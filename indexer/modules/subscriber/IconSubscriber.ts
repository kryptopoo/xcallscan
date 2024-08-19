import {
    IconService,
    HttpProvider,
    BlockMonitorSpec,
    BlockNotification,
    Monitor,
    EventMonitorSpec,
    EventNotification,
    EventFilter,
    Converter,
    BigNumber
} from 'icon-sdk-js'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URLS, WSS } from '../../common/constants'
import logger from '../logger/logger'
import { IconDecoder } from '../decoder/IconDecoder'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLog, EventLogData } from '../../types/EventLog'

export class IconSubscriber implements ISubscriber {
    private monitor!: Monitor<EventNotification>
    private iconService: IconService
    private interval = 20 // block interval
    private decoder: IDecoder

    constructor(public network: string, public contractAddress: string, decoder: IDecoder) {
        const provider: HttpProvider = new HttpProvider(WSS[network])
        this.iconService = new IconService(provider)
        this.decoder = decoder
    }

    private async buildEventLog(txHash: string, eventLogData: EventLogData) {
        const tx = await this.iconService.getTransaction(txHash).execute()
        const log: EventLog = {
            txRaw: tx,
            blockNumber: tx.blockHeight,
            blockTimestamp: Math.floor(new Date(tx.timestamp).getTime() / 1000000),
            txHash: tx.txHash,
            txFrom: tx.from,
            txTo: tx.to,
            // gasPrice: '12500000000',
            // gasUsed: txDetail.stepUsedByTxn, //IconService.IconConverter.toNumber().toString(),
            // txFee: IconService.IconConverter.toNumber(
            //     !tx.transaction_fee || tx.transaction_fee == '' ? '0x0' : tx.transaction_fee
            // ).toString(),
            txFee: (IconService.IconConverter.toNumber(tx.stepLimit) * IconService.IconConverter.toNumber('12500000000')).toString(),
            // txValue: IconService.IconConverter.toNumber(!tx.value || tx.value == '' ? '0x0' : tx.value).toString(),
            eventName: EVENT.CallMessageSent,
            eventData: eventLogData
        }
    }

    async subscribe(calbback: ISubscriberCallback) {
        logger.info(`[subscriber] ${this.network} connecting ${WSS[this.network]}...`)
        logger.info(`[subscriber] ${this.network} listening events on contract ${this.contractAddress}...`)

        const block = await this.iconService.getLastBlock().execute()
        const height = block.height
        const specCallMessageSent = new EventMonitorSpec(
            BigNumber(height),
            new EventFilter('CallMessageSent(Address,str,int)', this.contractAddress),
            true,
            this.interval
        )
        const specCallExecuted = new EventMonitorSpec(
            BigNumber(height),
            new EventFilter('CallExecuted(int,int,str)', this.contractAddress),
            true,
            this.interval
        )

        const onerror = (error: any) => {
            logger.info(`[subscriber] ${this.network} error ${JSON.stringify(error)}`)
        }
        const onprogress = (height: BigNumber) => {
            // logger.info(`[subscriber] ${this.network} height ${height.toString()}`)
        }
        const ondata = async (eventName: string, notification: EventNotification) => {
            logger.info(`[subscriber] ${this.network} ${JSON.stringify(notification)}`)

            const decodeEventLog = this.decoder.decodeEventLog(notification.logs[0], eventName)
            logger.info(`[subscriber] ${this.network} ${JSON.stringify(decodeEventLog)}`)

            // const tx = await this.iconService.getTransaction(notification.hash).execute()
            // const log = await this.buildEventLog(notification.hash, decodeEventLog)
            try {
                const tx = await this.iconService.getTransaction(notification.hash).execute()
                logger.info(`[subscriber] ${this.network} tx ${JSON.stringify(tx)}`)

                const txDetail = this.iconService.getTransactionResult(notification.hash).execute()
                logger.info(`[subscriber] ${this.network} txDetail ${JSON.stringify(txDetail)}`)
            } catch (error) {
                logger.error(`[subscriber] ${this.network} error ${JSON.stringify(error)}`)
            }

            calbback(decodeEventLog)
        }

        this.iconService.monitorEvent(
            specCallMessageSent,
            async (notification: EventNotification) => await ondata(EVENT.CallMessageSent, notification),
            onerror,
            onprogress
        )
        this.iconService.monitorEvent(
            specCallExecuted,
            async (notification: EventNotification) => await ondata(EVENT.CallExecuted, notification),
            onerror,
            onprogress
        )

        // this.iconService.monitorEvent(
        //     specCallExecuted,
        //     (notification: EventNotification) => {
        //         logger.info(`[subscriber] ${this.network} ${JSON.stringify(notification)}`)
        //         logger.info(`[subscriber] ${this.network} ${JSON.stringify(this.decoder.decodeEventLog(notification.logs[0], EVENT.CallExecuted))}`)
        //     },
        //     onerror,
        //     onprogress
        // )
    }
}

// const network = NETWORK.ICON
// const contract = 'cxa07f426062a1384bdd762afa6a87d123fbc81c75'
// const decoder = new IconDecoder()
// const subscriber = new IconSubscriber(network, contract, decoder)
// subscriber.subscribe((data: any) => {
//     logger.info(`[subscriber] ${subscriber.network} callback ${JSON.stringify(data)}`)
// })

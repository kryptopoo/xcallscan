import { IconService, HttpProvider, EventMonitorSpec, EventNotification, EventFilter, BigNumber } from 'icon-sdk-js'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URLS, WSS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { IconDecoder } from '../decoder/IconDecoder'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLog, EventLogData } from '../../types/EventLog'
import { sleep } from '../../common/helper'

export class IconSubscriber implements ISubscriber {
    private iconService: IconService
    private interval = 20 // block interval
    private decoder: IDecoder

    public contractAddress: string

    constructor(public network: string) {
        const provider: HttpProvider = new HttpProvider(WSS[network])
        this.iconService = new IconService(provider)
        this.decoder = new IconDecoder()
        this.contractAddress = CONTRACT[this.network].xcall[0]
    }

    private buildEventLog(block: any, tx: any, eventName: string, eventData: EventLogData) {
        return {
            // txRaw: JSON.stringify(tx),
            blockNumber: block.height,
            blockTimestamp: Math.floor(new Date(block.timeStamp).getTime() / 1000000),
            txHash: tx.txHash,
            txFrom: tx.from,
            txTo: tx.to,
            txFee: (IconService.IconConverter.toNumber(tx.stepUsed) * IconService.IconConverter.toNumber(tx.stepPrice)).toString(),
            // txValue: IconService.IconConverter.toNumber(!tx.value || tx.value == '' ? '0x0' : tx.value).toString(),
            eventName: eventName,
            eventData: eventData
        } as EventLog
    }

    private getEventName(log: string) {
        if (log.includes('CallMessageSent(Address,str,int)')) return EVENT.CallMessageSent
        if (log.includes('CallMessage(str,str,int,int,bytes)')) return EVENT.CallMessage
        if (log.includes('CallExecuted(int,int,str)')) return EVENT.CallExecuted
        if (log.includes('ResponseMessage(int,int)')) return EVENT.ResponseMessage
        if (log.includes('RollbackMessage(int)')) return EVENT.RollbackMessage
        if (log.includes('RollbackExecuted(int)')) return EVENT.RollbackExecuted

        return ''
    }

    private async retry(func: any) {
        const maxRetries = 3
        const retryDelay = 3000
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const data = await func()
                return data
            } catch (error: any) {
                logger.error(`${this.network} retry error ${error.code}`)
                if (attempt < maxRetries) {
                    await sleep(retryDelay)
                } else {
                    logger.error(`${this.network} retry failed`)
                }
            }
        }

        return undefined
    }

    async subscribe(calbback: ISubscriberCallback) {
        logger.info(`${this.network} connect ${WSS[this.network]}`)
        logger.info(`${this.network} listen events on ${this.contractAddress}`)

        const iconEventNames = [
            'CallMessageSent(Address,str,int)',
            'CallMessage(str,str,int,int,bytes)',
            'CallExecuted(int,int,str)',
            'ResponseMessage(int,int)',
            'RollbackMessage(int)',
            'RollbackExecuted(int)'
        ]
        const onerror = (error: any) => {
            logger.info(`${this.network} error ${JSON.stringify(error)}`)
        }
        const onprogress = (height: BigNumber) => {
            // logger.info(`${this.network} height ${height.toString()}`)
        }
        const ondata = async (notification: EventNotification) => {
            logger.info(`${this.network} ${JSON.stringify(notification)}`)

            const eventName = this.getEventName(JSON.stringify(notification.logs[0]))
            const decodeEventLog = await this.decoder.decodeEventLog(notification.logs[0], eventName)
            logger.info(`${this.network} ${eventName} decodeEventLog ${JSON.stringify(decodeEventLog)}`)

            try {
                if (decodeEventLog) {
                    // const block = await this.iconService.getBlockByHash(notification.hash).execute()
                    const block = await this.retry(this.iconService.getBlockByHash(notification.hash).execute())
                    let tx = block.confirmedTransactionList.find((t: any) => t.from && t.to) as any
                    if (tx) {
                        // const txDetail = await this.iconService.getTransactionResult(tx.txHash).execute()
                        const txDetail = await this.retry(this.iconService.getTransactionResult(tx.txHash).execute())
                        tx.blockHeight = txDetail.blockHeight
                        tx.stepUsed = txDetail.stepUsed
                        tx.stepPrice = txDetail.stepPrice
                        tx.eventLogs = txDetail.eventLogs
                        const eventLog = this.buildEventLog(block, tx, eventName, decodeEventLog)

                        logger.info(`${this.network} eventLog ${JSON.stringify(eventLog)}`)
                        calbback(eventLog)
                    }
                }
            } catch (error) {
                logger.error(`${this.network} error ${JSON.stringify(error)}`)
            }
        }

        const block = await this.iconService.getLastBlock().execute()
        const height = block.height
        const specs = iconEventNames.map(
            (n) => new EventMonitorSpec(BigNumber(height), new EventFilter(n, this.contractAddress), true, this.interval)
        )
        const monitorEvents = specs.map((s) =>
            this.iconService.monitorEvent(s, async (notification: EventNotification) => await ondata(notification), onerror, onprogress)
        )
    }
}

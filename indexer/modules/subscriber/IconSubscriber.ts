import { IconService, HttpProvider, EventMonitorSpec, EventNotification, EventFilter, BigNumber } from 'icon-sdk-js'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URLS, WSS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { IconDecoder } from '../decoder/IconDecoder'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLog, EventLogData } from '../../types/EventLog'
import { retryAsync } from 'ts-retry'

export class IconSubscriber implements ISubscriber {
    private iconService: IconService
    // default interval is 20 block
    private interval = 2 // block time ~2s
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
            txFee: (IconService.IconConverter.toNumber(tx.stepUsed || tx.stepLimit) * IconService.IconConverter.toNumber('12500000000')).toString(),
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

    private async getTxsByBlock(blockNumber: string) {
        const url = `https://tracker.icon.community/api/v1/transactions/block-number/${blockNumber}`
        const response = await fetch(url)
        const txs = await response.json()
        return txs
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
            logger.info(`${this.network} ondata ${JSON.stringify(notification)}`)

            const eventName = this.getEventName(JSON.stringify(notification.logs[0]))
            const decodeEventLog = await this.decoder.decodeEventLog(notification.logs[0], eventName)

            if (decodeEventLog) {
                let tx = undefined

                // init another iconService to avoid conflict
                const iconService = new IconService(new HttpProvider(WSS[this.network]))

                let blockHash = notification.hash
                let blockNumber = notification.height
                let block = await iconService.getBlockByHash(blockHash).execute()
                if (block) {
                    tx = block.confirmedTransactionList.find((t: any) => t.from && t.to) as any

                    // try finding tx in prevBlockHash
                    if (!tx) {
                        blockHash = block.prevBlockHash
                        blockNumber = new BigNumber(block.height)
                        block = await iconService.getBlockByHash(blockHash).execute()
                        tx = block.confirmedTransactionList.find((t: any) => t.from && t.to) as any
                    }
                }

                if (tx) {
                    // try getting correct fee
                    try {
                        const txDetail = await retryAsync(
                            async () => {
                                return await iconService.getTransactionResult(tx.txHash).execute()
                            },
                            { delay: 1000, maxTry: 3 }
                        )
                        tx.stepUsed = txDetail.stepUsed
                        tx.stepPrice = txDetail.stepPrice
                    } catch (error) {
                        logger.info(`${this.network} ondata ${eventName} getTransactionResult failed`)
                    }

                    const eventLog = this.buildEventLog(block, tx, eventName, decodeEventLog)
                    calbback(eventLog)
                } else {
                    logger.info(`${this.network} ondata ${eventName} could not find tx in block ${blockNumber.toString()} ${blockHash}`)
                }
            } else {
                logger.info(`${this.network} ondata ${eventName} could not decodeEventLog`)
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

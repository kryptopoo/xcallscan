import { IconService, HttpProvider, EventMonitorSpec, EventNotification, EventFilter, BigNumber } from 'icon-sdk-js'
import { retryAsync } from 'ts-retry'

import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URLS, SUBSCRIBER_INTERVAL, WSS_URLS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { IconDecoder } from '../decoder/IconDecoder'
import { EventLog, EventLogData } from '../../types/EventLog'
import { BaseSubscriber } from './BaseSubscriber'

export class IconSubscriber extends BaseSubscriber {
    iconService: IconService

    // default interval is 20 block
    interval = Math.round(SUBSCRIBER_INTERVAL / 2000) // block time ~2s
    reconnectInterval: number = SUBSCRIBER_INTERVAL * 2

    constructor(network: string) {
        super(network, WSS_URLS[network], new IconDecoder())
        const provider: HttpProvider = new HttpProvider(this.url)
        this.iconService = new IconService(provider)
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

    async findTxInBlock(iconService: IconService, blockNumber: BigNumber, eventName: string) {
        let block = undefined
        try {
            block = await retryAsync(
                async () => {
                    return await iconService.getBlockByHeight(blockNumber).execute()
                },
                { delay: 1000, maxTry: 5 }
            )
        } catch (error) {
            logger.error(`${this.network} get block ${blockNumber} error ${JSON.stringify(error)}`)
        }

        if (block) {
            const confirmedTxs = block.confirmedTransactionList
                .filter((t: any) => t.from && t.to)
                .concat(block.confirmedTransactionList.filter((t: any) => t.from && t.to))

            for (let i = 0; i < confirmedTxs.length; i++) {
                const confirmedTx = confirmedTxs[i]
                const confirmedTxDetail = await retryAsync(
                    async () => {
                        return await iconService.getTransactionResult(confirmedTx.txHash).execute()
                    },
                    { delay: 1000, maxTry: 5 }
                )

                const confirmedEventLogs = confirmedTxDetail.eventLogs as any[]
                for (let e = 0; e < confirmedEventLogs.length; e++) {
                    const tryDecodeEventLog = await this.decoder.decodeEventLog(confirmedEventLogs[e], eventName)
                    if (tryDecodeEventLog) {
                        return { tx: confirmedTxDetail, block: block }
                    }
                }
            }
        }

        return undefined
    }

    async subscribe(calbback: ISubscriberCallback) {
        logger.info(`${this.network} connect ${this.url}`)
        logger.info(`${this.network} listen events on ${JSON.stringify(this.xcallContracts)}`)

        const iconEventNames = [
            'CallMessageSent(Address,str,int)',
            'CallMessage(str,str,int,int,bytes)',
            'CallExecuted(int,int,str)',
            'ResponseMessage(int,int)',
            'RollbackMessage(int)',
            'RollbackExecuted(int)'
        ]
        const onerror = (error: any) => {
            logger.error(`${this.network} onerror ${JSON.stringify(error)}`)

            setTimeout(() => {
                logger.info(`${this.network} ws reconnect...`)
                monitorEvent()
            }, this.reconnectInterval)
        }
        const onprogress = (height: BigNumber) => {
            // logger.info(`${this.network} height ${height.toString()}`)
        }
        const ondata = async (notification: EventNotification) => {
            logger.info(`${this.network} ondata ${JSON.stringify(notification)}`)

            try {
                const eventName = this.getEventName(JSON.stringify(notification.logs[0]))
                const decodeEventLog = await this.decoder.decodeEventLog(notification.logs[0], eventName)

                if (decodeEventLog) {
                    // init another iconService to avoid conflict
                    const iconService = new IconService(new HttpProvider(this.url))

                    let blockHash = notification.hash
                    let blockNumber = notification.height
                    let prevBlockNumber = new BigNumber(Number(notification.height) - 1)
                    let txInBlock = await this.findTxInBlock(iconService, prevBlockNumber, eventName)
                    if (!txInBlock) {
                        // try current block from notification
                        txInBlock = await this.findTxInBlock(iconService, blockNumber, eventName)
                    }

                    if (txInBlock) {
                        const eventLog = this.buildEventLog(txInBlock.block, txInBlock.tx, eventName, decodeEventLog)
                        calbback(eventLog)
                    } else {
                        logger.info(`${this.network} ondata ${eventName} could not find tx in block ${blockNumber.toString()} ${blockHash}`)
                    }
                } else {
                    logger.info(`${this.network} ondata ${eventName} could not decodeEventLog`)
                }
            } catch (error) {
                logger.info(`${this.network} error ${JSON.stringify(error)}`)
                logger.error(`${this.network} error ${JSON.stringify(error)}`)
            }
        }

        const monitorEvent = async () => {
            const allEventFilters: EventFilter[] = []
            for (let i = 0; i < this.xcallContracts.length; i++) {
                const contractAddr = this.xcallContracts[i]
                iconEventNames.forEach((eventName) => {
                    allEventFilters.push(new EventFilter(eventName, contractAddr))
                })
            }
            const lastBlock = await this.iconService.getLastBlock().execute()
            // const specs = iconEventNames.map(
            //     (n) => new EventMonitorSpec(BigNumber(lastBlock.height), new EventFilter(n, this.contractAddress), true, this.interval)
            // )
            // const monitorEvents = specs.map((s) =>
            //     this.iconService.monitorEvent(s, async (notification: EventNotification) => await ondata(notification), onerror, onprogress)
            // )
            const spec = new EventMonitorSpec(BigNumber(lastBlock.height), allEventFilters, true, this.interval)
            this.iconService.monitorEvent(spec, async (notification: EventNotification) => await ondata(notification), onerror, onprogress)
        }

        monitorEvent()
    }
}

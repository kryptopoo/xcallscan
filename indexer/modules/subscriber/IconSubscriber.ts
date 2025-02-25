import { IconService, HttpProvider, EventMonitorSpec, EventNotification, EventFilter, BigNumber } from 'icon-sdk-js'
import { retryAsync } from 'ts-retry'

import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, WSS_URLS } from '../../common/constants'
import { IconDecoder } from '../decoder/IconDecoder'
import { EventLog, EventLogData } from '../../types/EventLog'
import { BaseSubscriber } from './BaseSubscriber'

export class IconSubscriber extends BaseSubscriber {
    iconService: IconService

    // default interval is 20 block, block time ~2s
    reconnectInterval: number = 4

    ICON_EVENT_ID: { [eventName: string]: string } = {
        [EVENT.CallMessageSent]: 'CallMessageSent(Address,str,int)',
        [EVENT.CallMessage]: 'CallMessage(str,str,int,int,bytes)',
        [EVENT.CallExecuted]: 'CallExecuted(int,int,str)',
        [EVENT.ResponseMessage]: 'ResponseMessage(int,int)',
        [EVENT.RollbackMessage]: 'RollbackMessage(int)',
        [EVENT.RollbackExecuted]: 'RollbackExecuted(int)'
        // [INTENTS_EVENT.SwapIntent]: ethers.utils.id('SwapIntent(uint256,string,string,string,string,string,string,uint256,string,uint256,bytes)'),
        // [INTENTS_EVENT.OrderFilled]: ethers.utils.id('OrderFilled(uint256,string)'),
        // [INTENTS_EVENT.OrderClosed]: ethers.utils.id('OrderClosed(uint256)'),
        // [INTENTS_EVENT.OrderCancelled]: ethers.utils.id('OrderCancelled(uint256,string)'),
        // [INTENTS_EVENT.Message]: ethers.utils.id('Message(string,uint256,bytes)')
    }

    constructor(network: string) {
        super(network, WSS_URLS[network], new IconDecoder())
        const provider: HttpProvider = new HttpProvider(this.url)
        this.iconService = new IconService(provider)

        // convert ms to s
        this.interval = Math.round(this.interval / 1000)
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
        // if (log.includes('CallMessageSent(Address,str,int)')) return EVENT.CallMessageSent
        // if (log.includes('CallMessage(str,str,int,int,bytes)')) return EVENT.CallMessage
        // if (log.includes('CallExecuted(int,int,str)')) return EVENT.CallExecuted
        // if (log.includes('ResponseMessage(int,int)')) return EVENT.ResponseMessage
        // if (log.includes('RollbackMessage(int)')) return EVENT.RollbackMessage
        // if (log.includes('RollbackExecuted(int)')) return EVENT.RollbackExecuted

        for (const [key, value] of Object.entries(this.ICON_EVENT_ID)) {
            if (log.includes(value)) return key
        }

        return ''
    }

    async findTxsInBlock(iconService: IconService, blockNumber: BigNumber, eventName: string) {
        let block = undefined
        try {
            block = await retryAsync(() => iconService.getBlockByHeight(blockNumber).execute(), { delay: 1000, maxTry: 3 })
        } catch (error) {
            this.logger.error(`${this.network} get block ${blockNumber} error ${JSON.stringify(error)}`)
        }

        if (block) {
            const txs = []
            const confirmedTxs = block.confirmedTransactionList.filter((t: any) => t.from && t.to)

            // TODO: remove log
            this.logger.info(`${this.network} confirmedTxs ${confirmedTxs.length} ${confirmedTxs.map((c) => c.txHash)}`)

            for (let i = 0; i < confirmedTxs.length; i++) {
                const confirmedTx = confirmedTxs[i]
                const confirmedTxDetail = await retryAsync(() => iconService.getTransactionResult(confirmedTx.txHash).execute(), {
                    delay: 1000,
                    maxTry: 3
                })

                const confirmedEventLogs = confirmedTxDetail.eventLogs as any[]
                for (let e = 0; e < confirmedEventLogs.length; e++) {
                    const tryDecodeEventLog = (await this.decoder.decodeEventLog(confirmedEventLogs[e], eventName)) as EventLogData
                    if (tryDecodeEventLog) {
                        txs.push({ tx: confirmedTxDetail, block: block, decodeEventLog: tryDecodeEventLog })
                    }
                }
            }

            // TODO: remove log
            this.logger.info(
                `${this.network} findTxsInBlock ${txs.length} ${JSON.stringify(txs.map((t) => t.tx.txHash))}  ${JSON.stringify(
                    txs.map((t) => t.decodeEventLog)
                )}`
            )

            return txs
        }

        return []
    }

    async subscribe(contractAddresses: string[], eventNames: string[], calbback: ISubscriberCallback) {
        this.logger.info(`${this.network} connect ${this.url}`)
        this.logger.info(`${this.network} listen events ${JSON.stringify(eventNames)} on ${JSON.stringify(contractAddresses)}`)

        // checking rpc/ws
        try {
            await this.iconService.getLastBlock().execute()
        } catch (error) {
            // switch to public rpc/ws
            this.logger.error(`${this.network} connect ${this.url} failed`)
            this.rotateUrl()
            this.logger.info(`${this.network} connect ${this.url}`)
            this.iconService = new IconService(new HttpProvider(this.url))
        }

        const onerror = (error: any) => {
            this.logger.error(`${this.network} onerror ${JSON.stringify(error)}`)

            setTimeout(() => {
                this.logger.info(`${this.network} ws reconnect...`)
                monitorEvent()
            }, this.reconnectInterval)
        }
        const onprogress = (height: BigNumber) => {
            // this.logger.info(`${this.network} height ${height.toString()}`)
            this.logLatestPolling()
        }
        const ondata = async (notification: EventNotification) => {
            this.logger.info(`${this.network} ondata ${JSON.stringify(notification)}`)

            try {
                const eventName = this.getEventName(JSON.stringify(notification.logs[0]))
                const decodeEventLog = (await this.decoder.decodeEventLog(notification.logs[0], eventName)) as EventLogData

                if (decodeEventLog) {
                    // init another iconService to avoid conflict
                    const iconService = new IconService(new HttpProvider(this.url))

                    let blockHash = notification.hash
                    let blockNumber = notification.height
                    let prevBlockNumber = new BigNumber(Number(notification.height) - 1)
                    let txsInBlock = await this.findTxsInBlock(iconService, prevBlockNumber, eventName)
                    if (txsInBlock.length === 0) {
                        // try current block from notification
                        txsInBlock = await this.findTxsInBlock(iconService, blockNumber, eventName)
                    }

                    if (txsInBlock.length > 0) {
                        // fix duplicated txs
                        if (decodeEventLog._sn) {
                            for (let i = 0; i < txsInBlock.length; i++) {
                                const txInBlock = txsInBlock[i]
                                if (decodeEventLog._sn === txInBlock.decodeEventLog._sn) {
                                    const eventLog = this.buildEventLog(txInBlock.block, txInBlock.tx, eventName, decodeEventLog)
                                    calbback(eventLog)
                                }
                            }
                            // fix multiple CallExecuted txs
                        } else if (decodeEventLog._reqId) {
                            for (let i = 0; i < txsInBlock.length; i++) {
                                const txInBlock = txsInBlock[i]
                                if (decodeEventLog._reqId === txInBlock.decodeEventLog._reqId) {
                                    const eventLog = this.buildEventLog(txInBlock.block, txInBlock.tx, eventName, decodeEventLog)
                                    calbback(eventLog)
                                }
                            }
                        } else {
                            const eventLog = this.buildEventLog(txsInBlock[0].block, txsInBlock[0].tx, eventName, decodeEventLog)
                            calbback(eventLog)
                        }
                    } else {
                        this.logger.info(`${this.network} ondata ${eventName} could not find tx in block ${blockNumber.toString()} ${blockHash}`)
                    }
                } else {
                    this.logger.info(`${this.network} ondata ${eventName} could not decodeEventLog`)
                }
            } catch (error) {
                this.logger.error(`${this.network} error ${JSON.stringify(error)}`)
            }
        }

        const monitorEvent = async () => {
            const allEventFilters: EventFilter[] = []
            for (let i = 0; i < contractAddresses.length; i++) {
                const contractAddr = contractAddresses[i]
                Object.values(this.ICON_EVENT_ID).forEach((iconEventId) => {
                    allEventFilters.push(new EventFilter(iconEventId, contractAddr))
                })
            }
            const lastBlock = await this.iconService.getLastBlock().execute()
            const spec = new EventMonitorSpec(BigNumber(lastBlock.height), allEventFilters, true, this.interval)
            this.iconService.monitorEvent(spec, async (notification: EventNotification) => await ondata(notification), onerror, onprogress)
        }

        monitorEvent()
    }
}

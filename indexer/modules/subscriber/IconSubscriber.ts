import { IconService, HttpProvider, EventMonitorSpec, EventNotification, EventFilter, BigNumber } from 'icon-sdk-js'
import { retryAsync } from 'ts-retry'

import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, INTENTS_EVENT, NETWORK, WSS_URLS } from '../../common/constants'
import { IconDecoder } from '../decoder/IconDecoder'
import { EventLog, EventLogData, IntentsEventLogData } from '../../types/EventLog'
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
        [EVENT.RollbackExecuted]: 'RollbackExecuted(int)',

        [INTENTS_EVENT.SwapIntent]: 'SwapIntent(int,str,str,str,str,str,str,int,str,int,bytes)',
        [INTENTS_EVENT.OrderFilled]: 'OrderFilled(int,str)',
        [INTENTS_EVENT.OrderClosed]: 'OrderClosed(int)',
        [INTENTS_EVENT.OrderCancelled]: 'OrderCancelled(int,str)',
        [INTENTS_EVENT.Message]: 'Message(str,int,bytes)'
    }

    constructor(network: string) {
        super(network, WSS_URLS[network], new IconDecoder())
        const provider: HttpProvider = new HttpProvider(this.url)
        this.iconService = new IconService(provider)

        // convert ms to s
        this.interval = Math.round(this.interval / 1000)
    }

    private buildEventLog(block: any, tx: any, eventName: string, eventData: EventLogData | IntentsEventLogData) {
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

            // // TODO: remove log
            // this.logger.info(`${this.network} confirmedTxs ${confirmedTxs.length} ${confirmedTxs.map((c) => c.txHash)}`)

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

            // // TODO: remove log
            // this.logger.info(
            //     `${this.network} findTxsInBlock ${txs.length} ${JSON.stringify(txs.map((t) => t.tx.txHash))}  ${JSON.stringify(
            //         txs.map((t) => t.decodeEventLog)
            //     )}`
            // )

            return txs
        }

        return []
    }

    async fetchEventLog(log: any) {
        try {
            const eventName = this.getEventName(JSON.stringify(log))

            if (eventName) {
                const decodeEventLog = await this.decoder.decodeEventLog(log, eventName)
                if (decodeEventLog) {
                    // this.logger.info(`eventName:${eventName} decodeEventLog:${JSON.stringify(decodeEventLog)}`)

                    // init another iconService to avoid conflict
                    const iconService = new IconService(new HttpProvider(this.url))

                    if (log.height && log.hash) {
                        // const eventLogData = decodeEventLog as EventLogData

                        let blockHash = log.hash
                        let blockNumber = log.height
                        let prevBlockNumber = new BigNumber(Number(log.height) - 1)
                        let txsInBlock = await this.findTxsInBlock(iconService, prevBlockNumber, eventName)
                        if (txsInBlock.length === 0) {
                            // try current block from notification
                            txsInBlock = await this.findTxsInBlock(iconService, blockNumber, eventName)
                        }

                        if (txsInBlock.length > 0) {
                            // fix duplicated txs
                            const _sn = (decodeEventLog as EventLogData)._sn
                            const _reqId = (decodeEventLog as EventLogData)._reqId
                            if (_sn) {
                                for (let i = 0; i < txsInBlock.length; i++) {
                                    const txInBlock = txsInBlock[i]
                                    if (_sn === txInBlock.decodeEventLog._sn) {
                                        const eventLog = this.buildEventLog(txInBlock.block, txInBlock.tx, eventName, decodeEventLog)
                                        return eventLog
                                    }
                                }
                                // fix multiple CallExecuted txs
                            } else if (_reqId) {
                                for (let i = 0; i < txsInBlock.length; i++) {
                                    const txInBlock = txsInBlock[i]
                                    if (_reqId === txInBlock.decodeEventLog._reqId) {
                                        const eventLog = this.buildEventLog(txInBlock.block, txInBlock.tx, eventName, decodeEventLog)
                                        return eventLog
                                    }
                                }
                            } else {
                                const eventLog = this.buildEventLog(txsInBlock[0].block, txsInBlock[0].tx, eventName, decodeEventLog)
                                return eventLog
                            }
                        } else {
                            this.logger.info(`${this.network} ondata ${eventName} could not find tx in block ${blockNumber.toString()} ${blockHash}`)
                        }
                    }
                }
            }
        } catch (error) {
            this.logger.error(`${this.network} error ${JSON.stringify(error)}`)
        }

        return undefined
    }

    async subscribe(contractAddresses: string[], eventNames: string[], txHashes: string[], callback: ISubscriberCallback) {
        this.logger.info(`${this.network} connect ${this.url}`)
        this.logger.info(`${this.network} listen events ${JSON.stringify(eventNames)} on ${JSON.stringify(contractAddresses)}`)

        if (txHashes.length > 0) {
            // subscribe data by specific transaction hashes

            for (let i = 0; i < txHashes.length - 1; i++) {
                const hash = txHashes[i]
                const confirmedTxDetail = await retryAsync(() => this.iconService.getTransactionResult(hash).execute(), {
                    delay: 1000,
                    maxTry: 3
                })

                // console.log('confirmedTxDetail.eventLogs', confirmedTxDetail.eventLogs)

                if (confirmedTxDetail.eventLogs && (confirmedTxDetail.eventLogs as []).length > 0) {
                    for (let j = 0; j < (confirmedTxDetail.eventLogs as []).length; j++) {
                        let log = (confirmedTxDetail.eventLogs as [])[j] as any
                        log.hash = confirmedTxDetail.blockHash
                        log.height = confirmedTxDetail.blockHeight
                        const eventLog = await this.fetchEventLog(log)
                        if (eventLog) callback(eventLog)
                    }
                }
            }
        } else {
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

                let notificationLog: any = notification.logs[0]
                notificationLog.hash = notification.hash
                notificationLog.height = notification.height
                const eventLog = await this.fetchEventLog(notificationLog)
                if (eventLog) return callback(eventLog)
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
}

import { retryAsync } from 'ts-retry'

import { ISubscriberCallback } from '../../interfaces/ISubcriber'
import { NETWORK, RPC_URLS } from '../../common/constants'
import { EventLog } from '../../types/EventLog'
import AxiosCustomInstance from '../scan/AxiosCustomInstance'
import { SuiDecoder } from '../decoder/SuiDecoder'
import { BaseSubscriber } from './BaseSubscriber'

export class SuiSubscriber extends BaseSubscriber {
    private getEventName(eventLog: any) {
        const eventNameOfTx = eventLog.type.split('::').pop()
        return eventNameOfTx ?? ''
    }

    constructor() {
        super(NETWORK.SUI, RPC_URLS[NETWORK.SUI], new SuiDecoder())
    }

    async queryTxBlocks(contractAddress: string, nextCursor: string, descendingOrder: boolean, limit: number = 20): Promise<any> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()

            const res = await axiosInstance.post(this.url, {
                jsonrpc: '2.0',
                id: 8,
                method: 'suix_queryTransactionBlocks',
                params: [
                    {
                        filter: {
                            InputObject: contractAddress
                        },
                        options: {
                            showBalanceChanges: true,
                            showEffects: true,
                            showEvents: true,
                            showInput: true
                        }
                    },
                    nextCursor && nextCursor != '0' ? nextCursor : null,
                    limit,
                    descendingOrder
                ]
            })

            return res.data.result
        } catch (error: any) {
            this.logger.error(`${this.network} called rpc failed ${this.url} ${error.code}`)
        }

        return { data: [], nextCursor: undefined }
    }

    async queryTxBlock(digest: string): Promise<any> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()

            const res = await axiosInstance.post(this.url, {
                jsonrpc: '2.0',
                id: 1,
                method: 'sui_getTransactionBlock',
                params: [
                    digest,
                    {
                        showBalanceChanges: true,
                        showEffects: true,
                        showEvents: true,
                        showInput: true
                    }
                ]
            })

            return res.data.result
        } catch (error: any) {
            this.logger.error(`${this.network} called rpc failed ${this.url} ${error.code}`)
        }

        return { data: [], nextCursor: undefined }
    }

    async fetchEventLogs(tx: any) {
        // this.logger.info(`${this.network} ondata ${JSON.stringify(tx)}`)
        const eventLogs = []

        try {
            const eventsOfTxDetail: any[] = tx.events ?? []
            for (let j = 0; j < eventsOfTxDetail.length; j++) {
                const eventLog = eventsOfTxDetail[j]
                const eventName = this.getEventName(eventLog)

                let decodeEventLog = await this.decoder.decodeEventLog(eventLog?.parsedJson, eventName)
                if (decodeEventLog) {
                    const txFee = tx.effects.gasUsed.storageCost - tx.effects.gasUsed.storageRebate + tx.effects.gasUsed.computationCost
                    const log: EventLog = {
                        // txRaw: tx.transaction,
                        blockNumber: Number(tx.checkpoint),
                        blockTimestamp: Math.floor(new Date(Number(tx.timestampMs)).getTime() / 1000),
                        txHash: tx.digest,
                        txFrom: tx.transaction.data.sender,
                        // recipient could be empty
                        txTo: tx.balanceChanges.find((b: any) => b.owner.AddressOwner != tx.transaction.data.sender)?.owner.AddressOwner,
                        txFee: txFee.toString(),
                        // txValue: tx.value.toString(),
                        eventName: eventName,
                        eventData: decodeEventLog
                    }

                    eventLogs.push(log)
                }
            }
        } catch (error) {
            this.logger.error(`${this.network} error ${JSON.stringify(error)}`)
        }

        return eventLogs
    }

    async subscribe(contractAddresses: string[], eventNames: string[], txHashes: string[], callback: ISubscriberCallback): Promise<void> {
        this.logger.info(`${this.network} connect ${JSON.stringify(this.url)}`)
        this.logger.info(`${this.network} listen events ${JSON.stringify(eventNames)} on ${JSON.stringify(contractAddresses)}`)

        if (txHashes.length > 0) {
            // subscribe data by specific transaction hashes
            for (let i = 0; i < txHashes.length; i++) {
                const txHash = txHashes[i]

                const tx = await retryAsync(() => this.queryTxBlock(txHash), {
                    delay: 1000,
                    maxTry: 3,
                    onError: (err, currentTry) => {
                        this.logger.error(`${this.network} retry ${currentTry} queryTxBlock ${err}`)
                    }
                })

                const eventLogs = await this.fetchEventLogs(tx)
                eventLogs.forEach((eventLog) => {
                    if (eventLogs && eventNames.includes(eventLog.eventName)) callback(eventLog)
                })
            }
        } else {
            const task = async (contractAddress: string) => {
                let res = await retryAsync(() => this.queryTxBlocks(contractAddress, '', true, 1), {
                    delay: 1000,
                    maxTry: 3,
                    onError: (err, currentTry) => {
                        this.logger.error(`${this.network} retry ${currentTry} queryTxBlocks ${err}`)
                    }
                })

                let nextCursor = res.nextCursor
                this.logger.info(`${this.network} contract ${contractAddress} nextCursor ${nextCursor}`)

                const intervalId = setInterval(async () => {
                    try {
                        this.logLatestPolling(`${this.network}_${contractAddress}`)

                        const txsRes = await retryAsync(() => this.queryTxBlocks(contractAddress, nextCursor, false), {
                            delay: 1000,
                            maxTry: 3,
                            onError: (err, currentTry) => {
                                this.logger.error(`${this.network} retry ${currentTry} queryTxBlocks ${err}`)
                            }
                        })

                        if (txsRes?.nextCursor) nextCursor = txsRes.nextCursor
                        const txs = txsRes?.data?.filter((t: any) => t.events?.length > 0) ?? []
                        if (txs.length > 0) this.logger.info(`${this.network} ondata ${JSON.stringify(txs)}`)

                        for (let j = 0; j < txs.length; j++) {
                            const eventLogs = await this.fetchEventLogs(txs[j])
                            eventLogs.forEach((eventLog) => {
                                if (eventLogs && eventNames.includes(eventLog.eventName)) callback(eventLog)
                            })
                        }
                    } catch (error) {
                        this.logger.error(`${this.network} task ${intervalId} error ${JSON.stringify(error)}`)
                    }
                }, this.interval)
            }

            // run task
            for (let i = 0; i < contractAddresses.length; i++) {
                const contractAddress = contractAddresses[i]
                task(contractAddress)
            }
        }
    }
}

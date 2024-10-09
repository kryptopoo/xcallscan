import { retryAsync } from 'ts-retry'

import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { IDecoder } from '../../interfaces/IDecoder'
import { API_KEY, API_URL, CONTRACT, EVENT, NETWORK, RPC_URL, RPC_URLS, SUBSCRIBER_INTERVAL, WSS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { EventLog, EventLogData } from '../../types/EventLog'
import AxiosCustomInstance from '../scan/AxiosCustomInstance'
import { StellarDecoder } from '../decoder/StellarDecoder'
import { RpcSubscriber } from './BaseSubscriber'

const { parseTxOperationsMeta } = require('@stellar-expert/tx-meta-effects-parser')

export class StellarSubscriber extends RpcSubscriber {
    decoder: IDecoder = new StellarDecoder()

    constructor() {
        super(NETWORK.STELLAR)
    }

    async callRpc(postData: any): Promise<any> {
        const axiosInstance = AxiosCustomInstance.getInstance()
        const rotateRpcRetries = 3

        let res: any = undefined
        for (let retry = 1; retry <= rotateRpcRetries; retry++) {
            res = await retryAsync(
                async () => {
                    try {
                        const rpcRes = await axiosInstance.post(this.rpcUrl, postData)
                        return rpcRes.data.result
                    } catch (error) {
                        logger.error(`${this.network} called rpc failed ${error}`)
                    }

                    return undefined
                },
                { delay: 1000, maxTry: 3 }
            )
            if (!res) {
                const rotatedRpc = this.rotateRpcUrl()
                logger.error(`${this.network} retry ${retry} changing rpc to ${rotatedRpc}`)
            } else break
        }

        return res
    }

    async getEvents(startLedger: number): Promise<any> {
        const postData = {
            jsonrpc: '2.0',
            id: 8675309,
            method: 'getEvents',
            params: {
                startLedger: startLedger,
                filters: [
                    {
                        type: 'contract',
                        contractIds: this.xcallContracts
                    }
                ],
                pagination: {
                    limit: 1000
                }
            }
        }

        return this.callRpc(postData)
    }

    async getLatestLedger() {
        const postData = {
            jsonrpc: '2.0',
            id: 8675309,
            method: 'getLatestLedger'
        }

        return this.callRpc(postData)
    }

    async getTx(txHash: string) {
        const postData = {
            jsonrpc: '2.0',
            id: 8675309,
            method: 'getTransaction',
            params: {
                hash: txHash
            }
        }

        return this.callRpc(postData)
    }

    async subscribe(callback: ISubscriberCallback): Promise<void> {
        logger.info(`${this.network} connect ${this.rpcUrl}`)
        logger.info(`${this.network} listen events on ${JSON.stringify(this.xcallContracts)}`)

        const latestLedgerRes = await this.getLatestLedger()
        let latestLedger = latestLedgerRes?.sequence

        const task = () => {
            const intervalId = setInterval(async () => {
                try {
                    if (latestLedger) {
                        // get events given contract
                        const eventsRes = await this.getEvents(latestLedger)
                        const events = eventsRes.events

                        if (eventsRes && events && events.length > 0) {
                            logger.info(`${this.network} ondata ${JSON.stringify(eventsRes)}`)
                            latestLedger = eventsRes.latestLedger

                            for (let i = 0; i < events.length; i++) {
                                const event = events[i]

                                // get transaction
                                const txHash = event.txHash
                                const tx = await this.getTx(txHash)

                                // parse xrd
                                const res = parseTxOperationsMeta({
                                    network: 'Public Global Stellar Network ; September 2015',
                                    tx: tx.envelopeXdr, // trasnaction envelope XDR
                                    result: tx.resultXdr, // trasnaction result XDR
                                    meta: tx.resultMetaXdr, // trasnaction meta XDR
                                    processSystemEvents: false, // whether to analyze system Soroban diagnostic events
                                    mapSac: false, // whether to map Classic assets to Soroban contracts automatically
                                    processFailedOpEffects: false, // whether to analyze effects in failed transactions
                                    protocol: 21 // different versions of Stelalr protocol may yield uninform effects
                                })

                                // invokeHostFunctionOp
                                const invokeHostFunctionOp = res.operations[0]
                                const contractEvents = invokeHostFunctionOp.effects.filter((e: any) => e.type == 'contractEvent')

                                const eventNames = Object.values(EVENT)
                                for (let j = 0; j < eventNames.length; j++) {
                                    const eventName = eventNames[j]
                                    const contractEvent = contractEvents.find((obj: any) => obj.topics.includes(eventName))
                                    const decodeEventLog = await this.decoder.decodeEventLog(contractEvent?.data, eventName)
                                    if (decodeEventLog) {
                                        const txTo = contractEvent.contract
                                        const txFee = res.effects.find((e: any) => e.type == 'feeCharged')?.charged
                                        const log: EventLog = {
                                            // txRaw: tx.transaction,
                                            blockNumber: Number(tx.ledger),
                                            blockTimestamp: Number(tx.createdAt),
                                            txHash: txHash,
                                            txFrom: invokeHostFunctionOp.source,
                                            // recipient is contract
                                            txTo: txTo,
                                            txFee: txFee?.toString(),
                                            // txValue: tx.value.toString(),
                                            eventName: eventName,
                                            eventData: decodeEventLog
                                        }

                                        callback(log)
                                    }
                                }
                            }
                        }
                    }
                } catch (error) {
                    logger.error(`${this.network} clear interval task ${JSON.stringify(error)}`)
                    clearInterval(intervalId)

                    // retry with another task
                    task()
                }
            }, this.interval)
        }

        // run task
        task()
    }
}

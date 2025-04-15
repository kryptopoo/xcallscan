import { retryAsync } from 'ts-retry'
import { ISubscriberCallback } from '../../interfaces/ISubcriber'
import { EVENT, INTENTS_EVENT, NETWORK, RPC_URLS } from '../../common/constants'
import { EventLog, EventLogData } from '../../types/EventLog'
import AxiosCustomInstance from '../scan/AxiosCustomInstance'
import { StellarDecoder } from '../decoder/StellarDecoder'
import { BaseSubscriber } from './BaseSubscriber'
import logger from '../logger/logger'

const { parseTxOperationsMeta } = require('@stellar-expert/tx-meta-effects-parser')

export class StellarSubscriber extends BaseSubscriber {
    constructor() {
        super(NETWORK.STELLAR, RPC_URLS[NETWORK.STELLAR], new StellarDecoder())
    }

    async callRpc(postData: any): Promise<any> {
        const axiosInstance = AxiosCustomInstance.getInstance()

        const res = await retryAsync(() => axiosInstance.post(this.url, postData), {
            delay: 1000,
            maxTry: 3,
            onError: (err, currentTry) => {
                this.logger.error(`${this.network} retry ${currentTry} callRpc ${err}`)
            }
        })

        return res?.data?.result
    }

    getEvents(contractAddereses: string[], startLedger: number) {
        const postData = {
            jsonrpc: '2.0',
            id: 8675309,
            method: 'getEvents',
            params: {
                startLedger: startLedger,
                filters: [
                    {
                        type: 'contract',
                        contractIds: contractAddereses
                    }
                ],
                pagination: {
                    limit: 1000
                }
            }
        }

        return this.callRpc(postData)
    }

    getLatestLedger() {
        const postData = {
            jsonrpc: '2.0',
            id: 8675309,
            method: 'getLatestLedger'
        }

        return this.callRpc(postData)
    }

    getTx(txHash: string) {
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

    async getTxByExpectApi(txHash: string) {
        console.log('getTxByExpectApi')
        const axiosInstance = AxiosCustomInstance.getInstance()

        const res = await retryAsync(() => axiosInstance.get(`https://api.stellar.expert/explorer/public/tx/${txHash}`), {
            delay: 1000,
            maxTry: 3,
            onError: (err, currentTry) => {
                this.logger.error(`${this.network} retry ${currentTry} getTxByExpectApi ${err}`)
            }
        })

        return res?.data
    }

    async fetchEventLogs(txHash: string, eventNames: string[]) {
        try {
            const eventLogs: EventLog[] = []

            // get transaction
            let tx = await this.getTx(txHash)
            if (!tx || tx.status != 'SUCCESS') {
                // try getting data from api.stellar.expert
                tx = await this.getTxByExpectApi(txHash)
                tx.envelopeXdr = tx.body
                tx.resultXdr = tx.result
                tx.resultMetaXdr = tx.meta
                tx.createdAt = tx.ts
            }

            // parse xrd
            const res = parseTxOperationsMeta({
                network: 'Public Global Stellar Network ; September 2015',
                tx: tx.envelopeXdr ?? tx.body, // trasnaction envelope XDR
                result: tx.resultXdr ?? tx.result, // trasnaction result XDR
                meta: tx.resultMetaXdr ?? tx.meta, // trasnaction meta XDR
                processSystemEvents: false, // whether to analyze system Soroban diagnostic events
                mapSac: false, // whether to map Classic assets to Soroban contracts automatically
                processFailedOpEffects: false, // whether to analyze effects in failed transactions
                protocol: 21 // different versions of Stelalr protocol may yield uninform effects
            })

            // invokeHostFunctionOp
            const invokeHostFunctionOp = res.operations[0]
            const contractEvents = invokeHostFunctionOp.effects.filter((e: any) => e.type == 'contractEvent')
            const decodedFunctions = invokeHostFunctionOp.effects.filter((e: any) => e.type == 'contractInvoked') ?? []

            for (let j = 0; j < eventNames.length; j++) {
                const eventName = eventNames[j]
                const contractEvent = contractEvents.find((obj: any) => obj.topics.includes(eventName))
                if (!contractEvent) continue

                const data = contractEvent.data
                data.decodedFunctions = decodedFunctions
                const decodeEventLog = await this.decoder.decodeEventLog(data, eventName)
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

                    eventLogs.push(log)
                }
            }

            return eventLogs
        } catch (error) {
            this.logger.error(`${this.network} error ${JSON.stringify(error)}`)
        }

        return []
    }

    async subscribe(contractAddresses: string[], eventNames: string[], txHashes: string[], callback: ISubscriberCallback): Promise<void> {
        this.logger.info(`${this.network} connect ${this.url}`)
        this.logger.info(`${this.network} listen events ${JSON.stringify(eventNames)} on ${JSON.stringify(contractAddresses)}`)

        if (txHashes.length > 0) {
            // subscribe data by specific transaction hashes
            for (let i = 0; i < txHashes.length; i++) {
                const eventLogs = await this.fetchEventLogs(txHashes[i], eventNames)
                eventLogs.forEach((eventLog) => {
                    callback(eventLog)
                })
            }
        } else {
            const latestLedgerRes = await this.getLatestLedger()
            let latestLedger = latestLedgerRes?.sequence
            this.logger.info(`${this.network} latestLedger ${latestLedger}`)

            const task = (contractAddresses: string[]) => {
                let intervalId = setInterval(async () => {
                    try {
                        this.logLatestPolling(`${this.network}_${contractAddresses.join('_')}`)

                        if (latestLedger) {
                            // get events given contract
                            const eventsRes = await this.getEvents(contractAddresses, latestLedger + 1)
                            const events = eventsRes?.events

                            if (eventsRes && events && events.length > 0) {
                                this.logger.info(`${this.network} ondata ${JSON.stringify(eventsRes)}`)
                                latestLedger = eventsRes.latestLedger

                                // unique by tx hash
                                const txHashes = events
                                    .map((ev: any) => ev.txHash)
                                    .filter((value: string, index: number, array: string[]) => array.indexOf(value) === index)

                                for (let i = 0; i < txHashes.length; i++) {
                                    const eventLogs = await this.fetchEventLogs(txHashes[i], eventNames)
                                    eventLogs.forEach((eventLog) => {
                                        callback(eventLog)
                                    })
                                }

                                // for (let i = 0; i < txHashes.length; i++) {

                                //     const eventLogs = await this.fetchEventLogs(txHashes[i])
                                //     eventLogs.forEach((eventLog) => {
                                //         callback(eventLog)
                                //     })

                                //     // // get transaction
                                //     // const txHash = txHashes[i]
                                //     // const tx = await this.getTx(txHash)

                                //     // // parse xrd
                                //     // const res = parseTxOperationsMeta({
                                //     //     network: 'Public Global Stellar Network ; September 2015',
                                //     //     tx: tx.envelopeXdr, // trasnaction envelope XDR
                                //     //     result: tx.resultXdr, // trasnaction result XDR
                                //     //     meta: tx.resultMetaXdr, // trasnaction meta XDR
                                //     //     processSystemEvents: false, // whether to analyze system Soroban diagnostic events
                                //     //     mapSac: false, // whether to map Classic assets to Soroban contracts automatically
                                //     //     processFailedOpEffects: false, // whether to analyze effects in failed transactions
                                //     //     protocol: 21 // different versions of Stelalr protocol may yield uninform effects
                                //     // })

                                //     // // invokeHostFunctionOp
                                //     // const invokeHostFunctionOp = res.operations[0]
                                //     // const contractEvents = invokeHostFunctionOp.effects.filter((e: any) => e.type == 'contractEvent')

                                //     // for (let j = 0; j < eventNames.length; j++) {
                                //     //     const eventName = eventNames[j]
                                //     //     const contractEvent = contractEvents.find((obj: any) => obj.topics.includes(eventName))
                                //     //     const decodeEventLog = await this.decoder.decodeEventLog(contractEvent?.data, eventName)
                                //     //     if (decodeEventLog) {
                                //     //         const txTo = contractEvent.contract
                                //     //         const txFee = res.effects.find((e: any) => e.type == 'feeCharged')?.charged
                                //     //         const log: EventLog = {
                                //     //             // txRaw: tx.transaction,
                                //     //             blockNumber: Number(tx.ledger),
                                //     //             blockTimestamp: Number(tx.createdAt),
                                //     //             txHash: txHash,
                                //     //             txFrom: invokeHostFunctionOp.source,
                                //     //             // recipient is contract
                                //     //             txTo: txTo,
                                //     //             txFee: txFee?.toString(),
                                //     //             // txValue: tx.value.toString(),
                                //     //             eventName: eventName,
                                //     //             eventData: decodeEventLog
                                //     //         }

                                //     //         callback(log)
                                //     //     }
                                //     // }
                                // }
                            }
                        }
                    } catch (error) {
                        this.logger.error(`${this.network} task ${intervalId} error ${JSON.stringify(error)}`)

                        // restart task
                        this.logger.info(`${this.network} restart task`)
                        clearInterval(intervalId)
                        task(contractAddresses)
                    }
                }, this.interval)
            }

            // run task
            task(contractAddresses)
        }
    }
}

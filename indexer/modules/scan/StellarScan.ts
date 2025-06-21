import { API_URL, EVENT, RPC_URLS, USE_MAINNET } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import logger from '../logger/logger'
import AxiosCustomInstance from './AxiosCustomInstance'
import { StellarDecoder } from '../decoder/StellarDecoder'
const { parseTxOperationsMeta } = require('@stellar-expert/tx-meta-effects-parser')

export class StellarScan implements IScan {
    countName: string = 'BlockNumber'
    decoder: StellarDecoder = new StellarDecoder()

    constructor(public network: string) {}

    async callApi(postData: any, url: string = RPC_URLS[this.network][0]): Promise<any> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()

            const res = await axiosInstance.post(url, postData)
            return res.data.result
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${url} ${JSON.stringify(postData)} ${error.code}`)
        }

        return undefined
    }

    async getEvents(startLedger: number, contractAddress: string): Promise<any> {
        const postData = {
            jsonrpc: '2.0',
            id: 8675309,
            method: 'getEvents',
            params: {
                startLedger: startLedger,
                filters: [
                    {
                        type: 'contract',
                        contractIds: [contractAddress]
                    }
                ],
                pagination: {
                    limit: 10000
                }
            }
        }
        return this.callApi(postData)
    }

    async getLatestLedger() {
        const postData = {
            jsonrpc: '2.0',
            id: 8675309,
            method: 'getLatestLedger'
        }
        return this.callApi(postData)
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
        let rs = await this.callApi(postData, RPC_URLS[this.network][0])

        // retry with public url
        if (rs === undefined) {
            rs = await this.callApi(postData, RPC_URLS[this.network][1])
        }
        return rs
    }

    async getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }> {
        let results: EventLog[] = []

        let lastFlag: string = flag
        if (lastFlag == '' || lastFlag == '0') {
            const latestLedgerRes = await this.getLatestLedger()
            if (latestLedgerRes?.sequence) lastFlag = (Number(latestLedgerRes?.sequence) - 14400).toString()
        }

        const eventsRes = await this.getEvents(Number(lastFlag), xcallAddress)
        if (eventsRes) {
            lastFlag = eventsRes.latestLedger

            const events = eventsRes.events
            for (let i = 0; i < events.length; i++) {
                const event = events[i]

                // get transaction
                const txHash = event.txHash
                const tx = await this.getTx(txHash)

                if (tx) {
                    // parse xrd
                    const res = parseTxOperationsMeta({
                        network: USE_MAINNET ? 'Public Global Stellar Network ; September 2015' : '',
                        tx: tx.envelopeXdr,
                        result: tx.resultXdr,
                        meta: tx.resultMetaXdr,
                        processSystemEvents: false,
                        mapSac: false,
                        processFailedOpEffects: false,
                        protocol: 21
                    })

                    const invokeHostFunctionOp = res.operations[0]
                    const contractEvents = invokeHostFunctionOp.effects.filter((e: any) => e.type == 'contractEvent')

                    let eventNames = [eventName]
                    if (!eventName) eventNames = Object.values(EVENT)
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

                            results.push(log)
                        }
                    }
                }
            }
        }

        return { lastFlag: lastFlag, eventLogs: results }
    }
}

import { ethers } from 'ethers'

import { API_URL, EVENT } from '../../common/constants'
import { sleep } from '../../common/helper'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import logger from '../logger/logger'
import AxiosCustomInstance from './AxiosCustomInstance'
import { retryAsync } from 'ts-retry'

export class SuiVisionScan implements IScan {
    countName: string = 'NextCursor'

    constructor(public network: string) {}

    async callApi(apiUrl: string, postData: any): Promise<any> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()

            const res = await axiosInstance.post(apiUrl, postData)
            // const res = await retryAsync(
            //     async () => {
            //         return await axiosInstance.post(apiUrl, postData)
            //     },
            //     { delay: 1000, maxTry: 5 }
            // )

            return res.data.result
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${apiUrl} ${error.code}`)
        }

        return { data: [], nextCursor: undefined }
    }

    async getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }> {
        let results: EventLog[] = []

        let nextCursor: string = flag

        const url = API_URL[this.network]
        const postData = {
            jsonrpc: '2.0',
            id: 8,
            method: 'suix_queryTransactionBlocks',
            params: [
                {
                    filter: {
                        InputObject: '0xe9ae3e2d32cdf659ad5db4219b1086cc0b375da5c4f8859c872148895a2eace2'
                    },
                    options: {
                        showBalanceChanges: true,
                        showEffects: true,
                        showEvents: true,
                        showInput: true
                    }
                },
                nextCursor && nextCursor != '0' ? nextCursor : null,
                20,
                false
            ]
        }

        const txsRes = await this.callApi(url, postData)
        const txs = txsRes.data
        const lastFlag = txsRes.nextCursor ?? undefined

        if (txs) {
            for (let i = 0; i < txs.length; i++) {
                const tx = txs[i]

                if (tx) {
                    const eventsOfTxDetail: any[] = tx.events ?? []
                    const txFee = tx.effects.gasUsed.storageCost - tx.effects.gasUsed.storageRebate + tx.effects.gasUsed.computationCost

                    let eventNames = [eventName]
                    if (!eventName) eventNames = Object.values(EVENT)

                    for (let z = 0; z < eventNames.length; z++) {
                        const eventName = eventNames[z]
                        const decodeEventLog = this.decodeEventLog(eventsOfTxDetail, eventName)

                        if (decodeEventLog) {
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

                            results.push(log)
                        }
                    }
                }
            }
        }

        return { lastFlag: lastFlag, eventLogs: results }
    }

    private decodeEventLog(eventsOfTxDetail: any[], eventName: string) {
        const eventLog: any = eventsOfTxDetail.find((e) => {
            // e.g: e.type = 0x25f664e39077e1e7815f06a82290f2aa488d7f5139913886ad8948730a98977d::main::CallMessage
            const eventNameOfTx = e.type.split('::').pop()
            return eventName === eventNameOfTx
        })

        if (eventLog) {
            let rs: any = {}
            switch (eventName) {
                case EVENT.CallMessageSent:
                    rs._from = eventLog.parsedJson.from
                    rs._to = eventLog.parsedJson.to
                    rs._sn = Number(eventLog.parsedJson.sn)
                    rs._nsn = eventLog.parsedJson?.nsn
                    rs._decodedFrom = eventLog.parsedJson.from
                    rs._decodedTo = eventLog.parsedJson.to

                    break
                case EVENT.ResponseMessage:
                    rs._sn = Number(eventLog.parsedJson.sn)
                    rs._code = eventLog.parsedJson?.response_code

                    break
                case EVENT.RollbackMessage:
                    rs._sn = Number(eventLog.parsedJson.sn)
                    if (eventLog?.parsedJson?.data) {
                        const dataHex = ethers.utils.hexlify(eventLog?.parsedJson?.data)
                        rs._data = dataHex
                    }

                    break
                case EVENT.RollbackExecuted:
                    rs._sn = Number(eventLog.parsedJson.sn)
                    if (eventLog.parsedJson.code) rs._code = eventLog.parsedJson.code
                    if (eventLog.parsedJson.msg) rs._msg = eventLog.parsedJson.msg
                    if (eventLog.parsedJson.err_msg) rs._msg = eventLog.parsedJson.err_msg

                    break
                case EVENT.MessageReceived:
                    console.log(eventName, eventLog.parsedJson)

                    // // TODO: parse here
                    // rs._from =
                    // rs._data =
                    // rs._decodedFrom =

                    break
                case EVENT.CallMessage:
                    rs._sn = Number(eventLog.parsedJson.sn)
                    rs._from = eventLog.parsedJson?.from ? `${eventLog.parsedJson?.from.net_id}/${eventLog.parsedJson?.from.addr}` : undefined
                    rs._decodedFrom = rs._from
                    rs._to = eventLog?.parsedJson?.to
                    rs._decodedTo = eventLog?.parsedJson?.to
                    rs._reqId = Number(eventLog?.parsedJson?.req_id)

                    const data = eventLog?.parsedJson?.data
                    if (data) {
                        const dataHex = ethers.utils.hexlify(data)
                        rs._data = dataHex
                    }
                    break

                case EVENT.CallExecuted:
                    rs._reqId = Number(eventLog.parsedJson.req_id)
                    if (eventLog.parsedJson.code) rs._code = eventLog.parsedJson.code
                    if (eventLog.parsedJson.err_msg) rs._msg = eventLog.parsedJson.err_msg

                    break
                default:
                    break
            }

            return rs
        }

        return undefined
    }
}

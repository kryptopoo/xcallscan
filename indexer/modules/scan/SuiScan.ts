import { ethers } from 'ethers'

import { API_URL, EVENT } from '../../common/constants'
import { sleep } from '../../common/helper'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import logger from '../logger/logger'
import AxiosCustomInstance from './AxiosCustomInstance'

export class SuiScan implements IScan {
    countName: string = 'NextCursor'

    constructor(public network: string) {}

    async callApi(apiUrl: string, params: any): Promise<any> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()
            const res = await axiosInstance.get(apiUrl, {
                params: params
            })
            return res.data
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${apiUrl} ${error.code}`)
        }

        return { data: [] }
    }

    async getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }> {
        let results: EventLog[] = []

        let isNextPage: boolean = false
        let nextCursor: string = flag
        const params: any = {
            orderBy: 'ASC',
            size: 20,
            objectSourceType: 'INPUT_OBJECT'
        }
        if (nextCursor) {
            params['nextCursor'] = nextCursor
        }

        const eventLogsRes = await this.callApi(`${API_URL[this.network]}/objects/${xcallAddress}/transactions`, params)
        const eventLogs = eventLogsRes.content
        const lastFlag = eventLogsRes.nextCursor
        if (eventLogs) {
            for (let i = 0; i < eventLogs.length; i++) {
                const eventLog = eventLogs[i]
                const txDetail = await this.getTransactionDetail(eventLog.hash)
                if (txDetail) {
                    const eventsOfTxDetail: any[] = txDetail.rawTransaction.result.events

                    let eventNames = [eventName]
                    if (!eventName) eventNames = Object.values(EVENT)

                    for (let z = 0; z < eventNames.length; z++) {
                        const eventName = eventNames[z]

                        const decodeEventLog = this.decodeEventLog(eventsOfTxDetail, eventName)

                        if (decodeEventLog) {
                            const log: EventLog = {
                                blockNumber: Number(txDetail.rawTransaction.result.checkpoint),
                                blockTimestamp: Math.floor(new Date(Number(txDetail.rawTransaction.result.timestampMs)).getTime() / 1000),
                                txHash: txDetail.activityMetadata[0].activityWith[0].hash,
                                txFrom: decodeEventLog?._from,
                                txTo: decodeEventLog?._to,
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

    private async getTransactionDetail(txHash: string) {
        const maxRetries = 3
        const retryDelay = 3000
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await this.callApi(`${API_URL[this.network]}/raw-transaction/${txHash}/details`, {})
            } catch (error: any) {
                logger.error(`${this.network} get transaction error ${error.code}`)
                if (attempt < maxRetries) {
                    await sleep(retryDelay)
                } else {
                    logger.error(`${this.network} get transaction failed ${txHash}`)
                }
            }
        }
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
                    console.log(eventName, eventLog.parsedJson)

                    // // TODO: parse here
                    // rs._from =
                    // rs._to =
                    // rs._sn =
                    // rs._nsn =
                    // rs._decodedFrom =
                    // rs._decodedTo =

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
                    console.log(eventName, eventLog.parsedJson)

                    // // TODO: parse here
                    // rs._sn =
                    // rs._code =
                    // rs._msg =

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
                    console.log(eventName, eventLog.parsedJson)

                    // // TODO parse here
                    // rs._reqId =
                    // rs._code =
                    // rs._msg =

                    break
                default:
                    break
            }

            return rs
        }

        return undefined
    }
}

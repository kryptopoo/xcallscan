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

    async getEventLogs(flagNumber: string, eventName: string, xcallAddress: string): Promise<{ lastFlagNumber: string; eventLogs: EventLog[] }> {
        let results: EventLog[] = []

        let isNextPage: boolean = false
        let nextCursor: string = flagNumber
        do {
            const params: any = {
                orderBy: 'ASC',
                size: 20,
                objectSourceType: 'INPUT_OBJECT'
            }
            if (nextCursor) {
                params['nextCursor'] = nextCursor
            }

            const eventLogsRes = await this.callApi(`${API_URL[this.network]}/objects/${xcallAddress}/transactions`, params)

            isNextPage = eventLogsRes.hasNextPage
            nextCursor = eventLogsRes.nextCursor

            const eventLogs = eventLogsRes.content

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

                            const log: EventLog = {
                                blockNumber: txDetail.rawTransaction.result.checkpoint,
                                blockTimestamp: Math.floor(new Date(Number(txDetail.rawTransaction.result.timestampMs)).getTime() / 1000),
                                txHash: txDetail.activityMetadata[0].activityWith[0].hash,
                                txFrom: decodeEventLog._from,
                                txTo: decodeEventLog._to,
                                eventName: eventName,
                                eventData: decodeEventLog
                            }

                            results.push(log)
                        }
                    }
                }
            }
        } while (isNextPage)

        return { lastFlagNumber: nextCursor, eventLogs: results }
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
            const eventNameOfTx = e.type.split('::')[2]

            return eventName === eventNameOfTx
        })

        if (eventLog) {
            let rs: any = {}

            rs._sn = Number(eventLog.parsedJson.sn)
            rs._from = eventLog.sender
            rs._decodedFrom = eventLog.sender
            rs._to = eventLog.parsedJson?.to
            rs._decodedTo = eventLog.parsedJson?.to
            rs._reqId = eventLog.parsedJson?.req_id

            const data = eventLog.parsedJson?.data

            if (data) {
                if (data.toString().startsWith('[') && data.toString().endsWith(']')) {
                    const bytesArr = data
                        .replace(/[\[\]]/g, '')
                        .split(',')
                        .map((x: any) => Number(x))
                    const dataHex = ethers.utils.hexlify(bytesArr)
                    rs._data = dataHex
                } else {
                    rs._data = data
                }
            }

            return rs
        }

        return undefined
    }
}

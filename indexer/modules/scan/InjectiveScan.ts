import logger from '../logger/logger'
import { ethers } from 'ethers'

import { API_URL, EVENT, CONTRACT } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import AxiosCustomInstance from './AxiosCustomInstance'
import { cosmosHash } from '../../common/helper'

export class InjectiveScan implements IScan {
    countName: string = 'CountNumber'
    totalCount: number = 0

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
    }

    async getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }> {
        let result: EventLog[] = []
        const limit = 20
        let flagNumber: number = Number(flag)
        let scanCount = flagNumber

        // only fetch total in first time
        if (this.totalCount == 0) {
            const countRes = await this.callApi(`${API_URL[this.network]}/contractTxs/${xcallAddress}`, {
                limit: 1,
                skip: 0
            })
            this.totalCount = countRes ? countRes.paging.total : 0
        }

        if (scanCount < this.totalCount) {
            const totalPages = Math.ceil(this.totalCount / limit)
            const flagPageIndex = totalPages - Math.ceil(flagNumber / limit) - 1
            const offset = (flagPageIndex > 0 ? flagPageIndex : 0) * limit
            const txsRes = await this.callApi(`${API_URL[this.network]}/contractTxs/${xcallAddress}`, {
                limit: limit,
                skip: offset
            })

            let txs = txsRes.data as any[]
            txs = txs.sort((a, b) => {
                return a.block_number - b.block_number
            })

            let eventNames = [eventName]
            if (!eventName) eventNames = Object.values(EVENT)

            for (let i = 0; i < txs.length; i++) {
                const tx = txs[i]

                // skip if not existed logs
                if (!tx.logs || tx.logs.length == 0) continue

                const eventLogs: any[] = tx.logs[0].events
                let msgExecuteContract = tx.messages.find((t: any) => t.type == '/cosmwasm.wasm.v1.MsgExecuteContract')

                // try get in another type
                if (!msgExecuteContract) {
                    msgExecuteContract = tx.messages.find((t: any) => t.type == '/injective.wasmx.v1.MsgExecuteContractCompat')
                }

                for (let index = 0; index < eventNames.length; index++) {
                    const eventName = eventNames[index]

                    const decodeEventLog = this.decodeEventLog(eventLogs, eventName)
                    if (decodeEventLog) {
                        let log: EventLog = {
                            // txRaw: txRes.data.raw_log,
                            blockNumber: Number(tx.block_number),
                            blockTimestamp: Math.floor(new Date(tx.block_unix_timestamp).getTime() / 1000),
                            txHash: cosmosHash(tx.hash),
                            txFrom: msgExecuteContract.value.sender,
                            txTo: msgExecuteContract.value.contract ?? '',
                            txFee: tx.gas_fee.amount[0].amount,
                            txValue: msgExecuteContract.value.msg?.cross_transfer?.amount || msgExecuteContract.value.msg?.deposit?.amount || '0',

                            eventName: eventName,
                            eventData: decodeEventLog
                        }

                        result.push(log)
                    }
                }
            }

            scanCount += txs.length
            if (scanCount > this.totalCount) scanCount = this.totalCount
        }

        return { lastFlag: scanCount.toString(), eventLogs: result }
    }

    private decodeEventLog(eventLogs: any[], eventName: string) {
        const getEventLogValue = (eventLog: any, key: string) => {
            return eventLog?.attributes?.find((a: { key: string; value: string }) => a.key == key)?.value
        }

        const eventLog: any = eventLogs.find((ev) => {
            return ev.type == `wasm-${eventName}`
        })

        if (eventLog) {
            let rs: any = {}
            const sn = getEventLogValue(eventLog, 'sn')
            const nsn = getEventLogValue(eventLog, 'nsn')
            const from = getEventLogValue(eventLog, 'from')
            const to = getEventLogValue(eventLog, 'to')
            const reqId = getEventLogValue(eventLog, 'reqId')
            const data = getEventLogValue(eventLog, 'data')
            const code = getEventLogValue(eventLog, 'code')
            const msg = getEventLogValue(eventLog, 'msg')
            if (sn) rs._sn = sn
            if (nsn) rs._nsn = nsn
            if (from) {
                rs._from = from
                rs._decodedFrom = from
            }
            if (to) {
                rs._to = to
                rs._decodedTo = to
            }
            if (reqId) rs._reqId = reqId
            if (data && data != '' && data != '[]') {
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
            if (code) rs._code = code
            if (msg) rs._msg = msg

            return rs
        }

        return undefined
    }
}

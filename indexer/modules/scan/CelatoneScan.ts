import logger from '../logger/logger'
import axios from 'axios'
import { ethers } from 'ethers'

import { API_URL, EVENT, CONTRACT } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'

export class CelatoneScan implements IScan {
    countName: string = 'CountNumber'
    totalCount: number = 0

    constructor(public network: string) {}

    async callApi(apiUrl: string, params: any): Promise<any> {
        try {
            const res = await axios.get(apiUrl, {
                params: params
            })
            return res.data
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${error.code}`)
        }
    }

    async getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }> {
        let result: EventLog[] = []
        const limit = 50
        let scanCount = flagNumber

        // only fetch total in first time
        if (this.totalCount == 0) {
            const countRes = await this.callApi(`${API_URL[this.network]}/accounts/${CONTRACT[this.network].xcall}/txs-count`, {
                is_wasm: true,
                is_execute: true
            })
            this.totalCount = countRes.count
        }

        if (scanCount < this.totalCount) {
            const totalPages = Math.ceil(this.totalCount / limit)
            const flagPageIndex = totalPages - Math.ceil(flagNumber / limit) - 1
            const txsRes = await this.callApi(`${API_URL[this.network]}/accounts/${CONTRACT[this.network].xcall}/txs`, {
                limit: limit,
                offset: flagPageIndex * limit,
                is_wasm: true,
                is_execute: true
            })

            let txs = txsRes.items as any[]
            txs = txs.sort((a, b) => {
                return a.height - b.height
            })

            let eventNames = [eventName]
            if (!eventName) eventNames = Object.values(EVENT)

            for (let i = 0; i < txs.length; i++) {
                const tx = txs[i]
                const txHash = tx.hash.toString().replace('\\x', '')

                const txRes = await this.callApi(`${API_URL[this.network]}/txs/${txHash}`, {})
                const txDetail = txRes.tx_response
                const eventLogs: any[] = txDetail.logs[0].events
                const msgExecuteContract = txDetail.tx.body.messages.find((t: any) => t['@type'] == '/cosmwasm.wasm.v1.MsgExecuteContract')

                for (let index = 0; index < eventNames.length; index++) {
                    const eventName = eventNames[index]

                    const decodeEventLog = this.decodeEventLog(eventLogs, eventName)
                    if (decodeEventLog) {
                        let log: EventLog = {
                            txRaw: txDetail.raw_log,
                            blockNumber: Number(txDetail.height),
                            blockTimestamp: Math.floor(new Date(txDetail.timestamp).getTime() / 1000),
                            txHash: txDetail.txhash,
                            txFrom: msgExecuteContract.sender,
                            txTo: msgExecuteContract.contract ?? '',
                            txFee: txDetail.tx.auth_info.fee.amount[0].amount,
                            txValue: msgExecuteContract.msg?.cross_transfer?.amount || msgExecuteContract.msg?.deposit?.amount || '0',

                            eventName: eventName,
                            eventData: decodeEventLog
                        }

                        result.push(log)
                    }
                }
            }

            scanCount += txs.length
        }

        return { lastFlagNumber: scanCount, eventLogs: result }
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

import logger from '../logger/logger'
import { ethers } from 'ethers'

import { API_URL, EVENT, CONTRACT, API_KEY, SCAN_FROM_FLAG_NUMBER } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import { nowTimestamp, toDateString, toTimestamp } from '../../common/helper'
import AxiosCustomInstance from './AxiosCustomInstance'

export class MintScanV2 implements IScan {
    countName: string = 'BlockTimestamp'

    constructor(public network: string) {}

    async callApi(apiUrl: string, params: any): Promise<any> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()
            const res = await axiosInstance.get(apiUrl, {
                params: params,
                headers: {
                    Authorization: 'Bearer ' + API_KEY[this.network]
                }
            })
            return res.data
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${apiUrl} ${error.code}`)
        }

        return undefined
    }

    async getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }> {
        let result: EventLog[] = []
        const limit = 20

        const offsetTimestamp = 86400
        let lastBlockTimestamp = flagNumber == 0 ? SCAN_FROM_FLAG_NUMBER[this.network] : flagNumber
        const fromDateTime = toDateString(lastBlockTimestamp + 1)
        const toDateTime = toDateString(lastBlockTimestamp + offsetTimestamp)

        let txs: any[] = []
        let txsRes: any = {}
        let searchAfter = undefined
        let totalCount = 0

        do {
            txsRes = await this.callApi(
                `${API_URL[this.network]}/accounts/${
                    CONTRACT[this.network].xcall
                }/transactions?take=${limit}&messageTypes[0]=/cosmwasm.wasm.v1.MsgExecuteContract&fromDateTime=${fromDateTime}&toDateTime=${toDateTime}`,
                searchAfter != undefined ? { searchAfter: searchAfter } : {}
            )
            searchAfter = txsRes.pagination.searchAfter
            totalCount += limit
            txs = txs.concat(txsRes.transactions)
        } while (searchAfter != undefined && totalCount < txsRes.pagination.totalCount)

        let eventNames = [eventName]
        if (!eventName) eventNames = Object.values(EVENT)

        txs = txs.sort((a, b) => {
            return Number(a.height) - Number(b.height)
        })
        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i]
            const eventLogs: any[] = tx.logs.length > 0 ? tx.logs[0].events : []

            const msgExecuteContractItem = tx.tx['/cosmos-tx-v1beta1-Tx'].body?.messages?.find(
                (t: any) => t['@type'] == '/cosmwasm.wasm.v1.MsgExecuteContract'
            )
            const msgExecuteContract = msgExecuteContractItem['/cosmwasm-wasm-v1-MsgExecuteContract']

            for (let index = 0; index < eventNames.length; index++) {
                const eventName = eventNames[index]

                const decodeEventLog = this.decodeEventLog(eventLogs, eventName)
                if (decodeEventLog) {
                    let log: EventLog = {
                        txRaw: tx.raw_log,
                        blockNumber: Number(tx.height),
                        blockTimestamp: Math.floor(new Date(tx.timestamp).getTime() / 1000),
                        txHash: tx.txhash,
                        txFrom: msgExecuteContract.sender ?? '',
                        txTo: msgExecuteContract.contract ?? '',
                        txFee: tx.tx['/cosmos-tx-v1beta1-Tx'].auth_info.fee.amount[0].amount,
                        txValue: msgExecuteContract.msg?.cross_transfer?.amount || msgExecuteContract.msg?.deposit?.amount || '0',

                        eventName: eventName,
                        eventData: decodeEventLog
                    }

                    result.push(log)
                }
            }
        }

        if (lastBlockTimestamp + offsetTimestamp < nowTimestamp()) {
            lastBlockTimestamp += offsetTimestamp
        } else if (result.length > 0) {
            const maxBlockTimestamp = Math.max(...result.map((o) => o.blockTimestamp))
            lastBlockTimestamp = maxBlockTimestamp
        }

        return { lastFlagNumber: lastBlockTimestamp, eventLogs: result }
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

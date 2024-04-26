import logger from '../logger/logger'
import axios from 'axios'
import { ethers } from 'ethers'

import { API_URL, EVENT, CONTRACT, API_KEY, SERVICE_API_KEY, SCAN_FROM_FLAG_NUMBER } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'

// TODO: TO BE REVIEWED, DONT USE
export class MintContractScan implements IScan {
    totalCount: number = 0
    countName: string = 'CountNumber'

    constructor(public network: string) {}

    async callApi(apiUrl: string, params: any): Promise<any> {
        try {
            // Using proxy to prevent block
            const proxyUrl = `https://api.scrapingant.com/v2/extended?url=${encodeURIComponent(apiUrl)}&browser=false&x-api-key=${
                SERVICE_API_KEY.SCRAPING_ANT
            }`
            const res = await axios.get(proxyUrl)
            logger.info(`${this.network} calling api ${proxyUrl}`)
            if (res.data.status_code == 200) {
                const resJson = JSON.parse(res.data.text)
                return resJson
            } else {
                logger.error(`${this.network} called api failed ${res.data.status_code}`)
            }
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${error.code}`)
        }

        return undefined
    }

    async getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }> {
        let result: EventLog[] = []
        const limit = 50
        let scanCount = flagNumber

        // only fetch total in first time
        if (this.totalCount == 0) {
            const countRes = await this.callApi(`${API_URL[this.network]}/wasm/contracts/${CONTRACT[this.network].xcall}`, {})
            this.totalCount = countRes.contract.executed_count
        }

        if (scanCount < this.totalCount) {
            const totalPages = Math.ceil(this.totalCount / limit)
            const flagPageIndex = totalPages - Math.ceil(flagNumber / limit) - 1
            const offset = (flagPageIndex > 0 ? flagPageIndex : 0) * limit
            const txsRes = await this.callApi(
                `${API_URL[this.network]}/wasm/contracts/${CONTRACT[this.network].xcall}/txs?limit=${limit}&offset=${offset}`,
                {}
            )

            let txs = txsRes.txs as any[]
            txs = txs.sort((a, b) => {
                return a.header.id - b.header.id
            })

            let eventNames = [eventName]
            if (!eventName) eventNames = Object.values(EVENT)

            for (let i = 0; i < txs.length; i++) {
                const tx = txs[i]

                const eventLogs: any[] = tx.data.logs.length > 0 ? tx.data.logs[0].events : []
                const msgExecuteContract = tx.data.tx.body.messages.find((t: any) => t['@type'] == '/cosmwasm.wasm.v1.MsgExecuteContract')

                for (let index = 0; index < eventNames.length; index++) {
                    const eventName = eventNames[index]

                    const decodeEventLog = this.decodeEventLog(eventLogs, eventName)
                    if (decodeEventLog) {
                        let log: EventLog = {
                            txRaw: tx.data.raw_log,
                            blockNumber: Number(tx.data.height),
                            blockTimestamp: Math.floor(new Date(tx.data.timestamp).getTime() / 1000),
                            txHash: tx.data.txhash,
                            txFrom: msgExecuteContract.sender,
                            txTo: msgExecuteContract.contract ?? '',
                            txFee: tx.data.tx.auth_info.fee.amount[0].amount,
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

        console.log('eventLog', eventLog)
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

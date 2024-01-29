import logger from '../logger/logger'
import axios from 'axios'
import { ethers } from 'ethers'

import { API_URL, EVENT, CONTRACT, API_KEY, SERVICE_API_KEY } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import { nowTimestamp, toDateString, toTimestamp } from '../../common/helper'
// import { Crawler } from './Crawler'

export class CosmosScan implements IScan {
    // private _crawler: Crawler | undefined

    constructor(public network: string) {
        // this._crawler = new Crawler()
    }

    async callApi(apiUrl: string, params: any): Promise<any[]> {
        try {
            // // Using crawler
            // const textRs = await this._crawler?.run(apiUrl)
            // if (textRs) return JSON.parse(textRs)

            // Using proxy
            const proxyUrl = `https://api.scrapingant.com/v2/extended?url=${encodeURIComponent(apiUrl)}&browser=false&x-api-key=${
                SERVICE_API_KEY.SCRAPING_ANT
            }`
            const res = await axios.get(proxyUrl)
            if (res.data.status_code == 200) {
                const resJson = JSON.parse(res.data.text)
                return resJson
            } else {
                logger.error(`${this.network} called api failed ${res.data.status_code}`)
            }
        } catch (error: any) {
            console.log('call api err', error)
            logger.error(`${this.network} called api failed ${error.code}`)
        }

        return []
    }

    async getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }> {
        const defaultStartTimestamp = toTimestamp(new Date('2023-09-12'))
        const currentTimestamp = nowTimestamp()
        const offsetTimestamp = 86400
        const limit = 50
        let lastBlockTimestamp = flagNumber == 0 ? defaultStartTimestamp : flagNumber
        let result: EventLog[] = []
        const executeContractType = 47
        const startTimestamp = toDateString(lastBlockTimestamp + 1)
        const endTimestamp = toDateString(lastBlockTimestamp + offsetTimestamp)
        const baseUrl = `${API_URL[this.network]}/account/${CONTRACT[this.network].xcall}/txs`
        let url = `${baseUrl}?searchType=${executeContractType}&limit=${limit}&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}`
        console.log('url', url)

        let txs: any[] = []

        let res = await this.callApi(url, {})
        txs = txs.concat(res)

        // try fletching if remaining pages
        while (res.length == 50) {
            url = `${baseUrl}?searchType=${executeContractType}&limit=${limit}&startTimestamp=${startTimestamp}&endTimestamp=${endTimestamp}&from=${
                res[res.length - 1].header.id
            }`
            res = await this.callApi(url, {})
            txs = txs.concat(res)
        }

        txs = txs.sort((a, b) => {
            return a.header.id - b.header.id
        })

        let eventNames = [eventName]
        if (!eventName) eventNames = Object.values(EVENT)

        for (let i = 0; i < txs.length; i++) {
            const tx = txs[i]
            const eventLogs: any[] = tx.data.logs[0].events

            for (let index = 0; index < eventNames.length; index++) {
                const eventName = eventNames[index]

                const decodeEventLog = this.decodeEventLog(eventLogs, eventName)
                if (decodeEventLog) {
                    // const headerId = tx.header.id
                    // console.log('messages[0]', tx.data.tx.body.messages[0])
                    let log: EventLog = {
                        txRaw: tx.data.raw_log,
                        blockNumber: Number(tx.data.height),
                        blockTimestamp: Math.floor(new Date(tx.data.timestamp).getTime() / 1000),
                        txHash: tx.data.txhash,
                        txFrom: tx.data.tx.body.messages[0].sender,
                        txTo: tx.data.tx.body.messages[0].contract ?? '',
                        txFee: tx.data.tx.auth_info.fee.amount[0].amount,
                        txValue: tx.data.tx.body.messages[0].msg?.cross_transfer?.amount || tx.data.tx.body.messages[0].msg?.deposit?.amount || '',

                        eventName: eventName,
                        eventData: decodeEventLog
                    }

                    result.push(log)
                }
            }
        }

        lastBlockTimestamp = lastBlockTimestamp > currentTimestamp ? lastBlockTimestamp : lastBlockTimestamp + offsetTimestamp

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
                const bytesArr = data
                    .replace(/[\[\]]/g, '')
                    .split(',')
                    .map((x: any) => Number(x))
                const dataHex = ethers.utils.hexlify(bytesArr)
                rs._data = dataHex
            }
            if (code) rs._code = code
            if (msg) rs._msg = msg

            return rs
        }

        return undefined
    }
}

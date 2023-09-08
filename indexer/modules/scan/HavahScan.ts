import logger from '../logger/logger'
import axios from 'axios'
import IconService from 'icon-sdk-js'
import { API_URL, EVENT, NETWORK, CONTRACT } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'

export class HavahScan implements IScan {
    network: string = NETWORK.HAVAH

    async callApi(apiUrl: string, params: any): Promise<any> {
        try {
            const res = await axios.get(apiUrl, {
                params: params
            })
            return res
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${error.code}`)
        }

        return { data: [], totalSize: 0 }
    }

    async getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }> {
        const limit = 100
        // const scoreAddr = [EVENT.RollbackExecuted, EVENT.CallExecuted].indexOf(eventName) > -1 ? CONTRACT[this.network].xcall : CONTRACT[this.network].dapp

        let scoreAddr = CONTRACT[this.network].dapp
        if ([EVENT.RollbackExecuted, EVENT.CallExecuted].indexOf(eventName) > -1) scoreAddr = CONTRACT[this.network].xcall
        if ([EVENT.CallMessage, EVENT.ResponseMessage, EVENT.RollbackMessage].indexOf(eventName) > -1) scoreAddr = CONTRACT[this.network].bmc

        let result: EventLog[] = []

        // https://scan.altair.havah.io/v3/score/eventLogList?scoreAddr=cxce3a72cc1defaf07b23e05b595840c00d5a80b0c&page=1&count=5

        // always get lastest block of events
        const latestEventRes = await this.callApi(`${API_URL[this.network]}/score/eventLogList`, {
            scoreAddr: scoreAddr,
            page: 1,
            count: 1
        })

        const totalCount = latestEventRes.data.totalSize
        const lastPage = Math.ceil((totalCount - flagNumber) / limit)
        // console.log('lastPage', lastPage)

        if (lastPage == 0) return { lastFlagNumber: flagNumber, eventLogs: result }

        const eventLogsRes = await this.callApi(`${API_URL[this.network]}/score/eventLogList`, {
            scoreAddr: scoreAddr,
            page: lastPage,
            count: limit
        })

        const eventLogs = eventLogsRes.data.data
        flagNumber = flagNumber + eventLogs.length
        // console.log('flagNumber', flagNumber)
        // console.log('eventLogs', eventLogs)
        if (eventLogs) {
            // console.log('eventLogs', eventLogs)
            for (let j = 0; j < eventLogs.length; j++) {
                let eventLog = eventLogs[j]

                // check event name correctly
                if (eventLog.method.startsWith(`${eventName}(`)) {
                    // console.log('tx', tx)
                    let tx = await this.getTransactionDetail(eventLog.txHash)

                    let decodeEventLog = this.decodeEventLog(eventLog.eventLog, eventName)
                    // console.log('decodeEventLog', decodeEventLog)

                    let log: EventLog = {
                        txRaw: tx,
                        blockNumber: eventLog.height,
                        blockTimestamp: Math.floor(new Date(eventLog.timestamp).getTime() / 1000),
                        txHash: eventLog.txHash,
                        txFrom: tx.fromAddr,
                        txTo: tx.toAddr,
                        // txFee:  tx.fee,
                        // txValue: tx.amount,
                        txFee: IconService.IconAmount.of(tx.fee, IconService.IconAmount.Unit.ICX).toLoop().toString(),
                        txValue: IconService.IconAmount.of(tx.amount, IconService.IconAmount.Unit.ICX).toLoop().toString(),
                        eventName: eventName,
                        eventData: decodeEventLog
                    }

                    result.push(log)
                }
            }
        }

        return { lastFlagNumber: flagNumber, eventLogs: result }
    }

    private decodeEventLog(eventLog: string, eventName: string) {
        eventLog = eventLog.replace(/\[/gi, `"[`).replace(/\]/gi, `]"`)

        let eventLogObj = JSON.parse(eventLog)

        let eventData = [
            ...eventLogObj.indexed.replace(/\[/gi, '').replace(/\]/gi, '').split(', '),
            ...eventLogObj.data.replace(/\[/gi, '').replace(/\]/gi, '').split(', ')
        ]

        switch (eventName) {
            case EVENT.CallMessageSent:
                eventLogObj._from = eventData[1]
                eventLogObj._to = eventData[2]
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[3])
                eventLogObj._nsn = IconService.IconConverter.toNumber(eventData[4])

                // icon always decode string
                eventLogObj._decodedFrom = eventData[1]
                eventLogObj._decodedTo = eventData[2]

                break
            case EVENT.ResponseMessage:
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[1])
                eventLogObj._code = IconService.IconConverter.toNumber(eventData[2])
                eventLogObj._msg = eventData[3]
                break
            case EVENT.RollbackMessage:
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[1])
                break
            case EVENT.RollbackExecuted:
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[1])
                eventLogObj._code = IconService.IconConverter.toNumber(eventData[2])
                eventLogObj._msg = eventData[3]
                break
            case EVENT.MessageReceived:
                eventLogObj._from = eventData[1]
                eventLogObj._data = eventData[2]

                eventLogObj._decodedFrom = eventData[1]
                break
            case EVENT.CallMessage:
                eventLogObj._from = eventData[1]
                eventLogObj._to = eventData[2]
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[3])
                eventLogObj._reqId = IconService.IconConverter.toNumber(eventData[4])
                eventLogObj._data = eventData[5]

                eventLogObj._decodedFrom = eventData[1]
                eventLogObj._decodedTo = eventData[2]
                break

            case EVENT.CallExecuted:
                eventLogObj._reqId = IconService.IconConverter.toNumber(eventData[1])
                eventLogObj._code = IconService.IconConverter.toNumber(eventData[2])
                eventLogObj._msg = eventData[3]
                break
            default:
                break
        }

        delete eventLogObj.indexed
        delete eventLogObj.data
        return eventLogObj
    }

    private async getTransactionDetail(txHash: string) {
        let txHashRes = await this.callApi(`${API_URL[this.network]}/transaction/info`, {
            txHash: txHash
        })

        return txHashRes.data.data
    }
}

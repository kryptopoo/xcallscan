import logger from '../logger/logger'
import IconService from 'icon-sdk-js'
import { API_URL, EVENT, NETWORK, CONTRACT } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import AxiosCustomInstance from './AxiosCustomInstance'
import { sleep } from '../../common/helper'

export class HavahScan implements IScan {
    countName: string = 'CountNumber'
    network: string = NETWORK.HAVAH

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

        return { data: [], totalSize: 0 }
    }

    async getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }> {
        const limit = 20

        // // deprecated
        // let scoreAddr = CONTRACT[this.network].dapp
        // if ([EVENT.RollbackExecuted, EVENT.CallExecuted].indexOf(eventName) > -1) scoreAddr = CONTRACT[this.network].xcall
        // if ([EVENT.CallMessage, EVENT.ResponseMessage, EVENT.RollbackMessage].indexOf(eventName) > -1) scoreAddr = CONTRACT[this.network].bmc
        let scoreAddr = CONTRACT[this.network].xcall
        if ([EVENT.CallMessage, EVENT.ResponseMessage, EVENT.RollbackMessage].indexOf(eventName) > -1) scoreAddr = CONTRACT[this.network].bmc

        let result: EventLog[] = []

        // always get lastest block of events
        const latestEventRes = await this.callApi(`${API_URL[this.network]}/score/eventLogList`, {
            scoreAddr: scoreAddr,
            page: 1,
            count: 1
        })

        const totalCount = Number(latestEventRes.totalSize)
        const lastPage = Math.ceil((totalCount - flagNumber) / limit)
        if (lastPage <= 0) return { lastFlagNumber: flagNumber, eventLogs: result }

        const eventLogsRes = await this.callApi(`${API_URL[this.network]}/score/eventLogList`, {
            scoreAddr: scoreAddr,
            page: lastPage,
            count: limit
        })

        const eventLogs = eventLogsRes.data
        if (flagNumber + eventLogs.length > totalCount) {
            flagNumber = totalCount
        } else {
            flagNumber = flagNumber + eventLogs.length
        }

        if (eventLogs) {
            for (let j = 0; j < eventLogs.length; j++) {
                let eventLog = eventLogs[j]

                // check event name correctly
                if (eventLog.method.startsWith(`${eventName}(`)) {
                    let tx = await this.getTransactionDetail(eventLog.txHash)
                    if (!tx) {
                        logger.error(`${this.network} transaction not found ${eventLog.txHash}`)
                        continue
                    }

                    let decodeEventLog = this.decodeEventLog(eventLog.eventLog, eventName)

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
                if (eventData[3]) eventLogObj._sn = IconService.IconConverter.toNumber(eventData[3])
                if (eventData[4]) eventLogObj._nsn = IconService.IconConverter.toNumber(eventData[4])

                // icon always decode string
                eventLogObj._decodedFrom = eventData[1]
                eventLogObj._decodedTo = eventData[2]

                break
            case EVENT.ResponseMessage:
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) eventLogObj._code = IconService.IconConverter.toNumber(eventData[2])
                eventLogObj._msg = eventData[3]
                break
            case EVENT.RollbackMessage:
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[1])
                break
            case EVENT.RollbackExecuted:
                eventLogObj._sn = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) eventLogObj._code = IconService.IconConverter.toNumber(eventData[2])
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
                if (eventData[3]) eventLogObj._sn = IconService.IconConverter.toNumber(eventData[3])
                if (eventData[4]) eventLogObj._reqId = IconService.IconConverter.toNumber(eventData[4])
                if (eventData[5]) eventLogObj._data = eventData[5]

                eventLogObj._decodedFrom = eventData[1]
                eventLogObj._decodedTo = eventData[2]
                break

            case EVENT.CallExecuted:
                eventLogObj._reqId = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) eventLogObj._code = IconService.IconConverter.toNumber(eventData[2])
                if (eventData[3]) eventLogObj._msg = eventData[3]
                break
            default:
                break
        }

        delete eventLogObj.indexed
        delete eventLogObj.data
        return eventLogObj
    }

    private async getTransactionDetail(txHash: string) {
        const maxRetries = 3
        const retryDelay = 3000
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                let txHashRes = await this.callApi(`${API_URL[this.network]}/transaction/info`, {
                    txHash: txHash
                })

                return txHashRes.data
            } catch (error: any) {
                logger.error(`${this.network} get transaction error ${error.code}`)
                if (attempt < maxRetries) {
                    await sleep(retryDelay)
                } else {
                    logger.error(`${this.network} get transaction failed ${txHash}`)
                }
            }
        }

        return undefined
    }
}

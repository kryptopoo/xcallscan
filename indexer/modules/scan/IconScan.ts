import logger from '../logger/logger'
import axios from 'axios'
import IconService from 'icon-sdk-js'
import { API_URL, EVENT, NETWORK, CONTRACT } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'

export class IconScan implements IScan {
    network: string = NETWORK.ICON

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
        let result: EventLog[] = []
        const limit = 100

        // always get lastest block of events
        const latestBlockRes = await this.callApi(`${API_URL[this.network]}/logs`, {
            address: CONTRACT[this.network].xcall,
            limit: 1,
            skip: 0
        })
        const totalCount = parseInt(latestBlockRes.headers['x-total-count'])
        const blockLatest = latestBlockRes.data[0].block_number

        // set blockStart, blockEnd
        let blockStart = flagNumber
        if (flagNumber == 0) {
            // for very first time
            const blockStartRes = await this.callApi(`${API_URL[this.network]}/logs`, {
                address: CONTRACT[this.network].xcall,
                limit: 1,
                skip: totalCount - 1
            })

            blockStart = blockStartRes.data[blockStartRes.data.length - 1].block_number
        }
        let blockEnd = blockStart + limit

        const eventLogsRes = await this.callApi(`${API_URL[this.network]}/logs`, {
            address: CONTRACT[this.network].xcall,
            method: eventName,
            block_start: blockStart,
            block_end: blockEnd,
            limit: limit
        })

        const eventLogs = eventLogsRes.data
        if (eventLogs) {
            for (let j = 0; j < eventLogs.length; j++) {
                let eventLog = eventLogs[j]

                // check event name correctly
                if (eventLog.method == eventName) {
                    let tx = await this.getTransactionDetail(eventLog.transaction_hash)
                    let decodeEventLog = this.decodeEventLog(eventLog, eventName) // console.log('decodeEventLog', decodeEventLog)

                    let log: EventLog = {
                        txRaw: tx,
                        blockNumber: eventLog.block_number,
                        blockTimestamp: Math.floor(new Date(eventLog.block_timestamp).getTime() / 1000000),
                        txHash: eventLog.transaction_hash,
                        txFrom: tx.from_address,
                        txTo: tx.to_address,
                        // gasPrice: '12500000000',
                        // gasUsed: txDetail.stepUsedByTxn, //IconService.IconConverter.toNumber().toString(),
                        txFee: IconService.IconConverter.toNumber(
                            !tx.transaction_fee || tx.transaction_fee == '' ? '0x0' : tx.transaction_fee
                        ).toString(),
                        txValue: IconService.IconConverter.toNumber(!tx.value || tx.value == '' ? '0x0' : tx.value).toString(),
                        eventName: eventName,
                        eventData: decodeEventLog
                    }

                    result.push(log)
                }
            }
        }

        return { lastFlagNumber: blockEnd > blockLatest ? blockLatest : blockEnd, eventLogs: result }
    }

    private decodeEventLog(eventLog: any, eventName: string) {
        let eventLogObj = eventLog
        let eventData = [...JSON.parse(eventLogObj.indexed), ...JSON.parse(eventLogObj.data == 'null' ? '[]' : eventLogObj.data)]

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
        let txHashRes = await this.callApi(`${API_URL[this.network]}/transactions/details/${txHash}`, {})

        // console.log('txHashRes', txHashRes.data)
        return txHashRes.data
    }
}

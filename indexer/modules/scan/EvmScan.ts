import logger from '../logger/logger'
import axios from 'axios'
import { ethers } from 'ethers'
import { API_URL, RPC_URL, EVENT, CONTRACT, API_KEY } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import xcallAbi from '../../abi/xcall.abi.json'
const xcallInterface = new ethers.utils.Interface(xcallAbi)

export class EvmScan implements IScan {
    countName: string = 'BlockNumber'
    provider: ethers.providers.BaseProvider

    constructor(public network: string) {
        this.provider = new ethers.providers.JsonRpcProvider(RPC_URL[this.network])
    }

    async callApi(apiUrl: string, params: any): Promise<any[]> {
        try {
            const res = await axios.get(apiUrl, {
                params: params
            })
            return res.data.result as any[]
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${error.code}`)
        }

        return []
    }

    async getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }> {
        const limit = 20
        let lastBlockNumber = flagNumber
        let result: EventLog[] = []
        let eventLogs = await this.callApi(API_URL[this.network], {
            module: 'logs',
            action: 'getLogs',
            address: CONTRACT[this.network].xcall,
            fromBlock: flagNumber + 1,
            toBlock: 'latest',
            topic0: xcallInterface.getEventTopic(eventName),
            page: 1,
            offset: limit,
            // sort: 'asc',
            apikey: API_KEY[this.network]
        })

        for (let i = 0; i < eventLogs.length; i++) {
            const eventLog = eventLogs[i]
            const decodeEventLog = xcallInterface.decodeEventLog(eventName, eventLog.data, eventLog.topics)

            // get tx
            const tx = await this.provider.getTransaction(eventLog.transactionHash)

            let log: EventLog = {
                txRaw: tx,
                blockNumber: ethers.BigNumber.from(eventLog.blockNumber).toNumber(),
                blockTimestamp: ethers.BigNumber.from(eventLog.timeStamp).toNumber(),
                txHash: eventLog.transactionHash,
                txFrom: tx.from,
                txTo: tx.to ?? '',
                txFee: ethers.BigNumber.from(eventLog.gasUsed).mul(ethers.BigNumber.from(eventLog.gasPrice)).toString(),
                txValue: ethers.BigNumber.from(tx.value).toString(),
                // gasPrice: ethers.BigNumber.from(eventLog.gasPrice).toString(),
                // gasUsed: ethers.BigNumber.from(eventLog.gasUsed).toString(),
                eventName: eventName
            }

            switch (eventName) {
                case EVENT.CallMessageSent:
                    log.eventData = {
                        _sn: decodeEventLog._sn.toNumber(),
                        _nsn: decodeEventLog._nsn.toNumber(),
                        _from: decodeEventLog._from,
                        _to: decodeEventLog._to.hash
                    }

                    // try decode toBtp
                    log.eventData._decodedFrom = log.eventData._from // _from is always address
                    try {
                        const sendMessageInterface = new ethers.utils.Interface(['function sendMessage(string _to,bytes _data,bytes _rollback)'])
                        const decodedSendMessage = sendMessageInterface.decodeFunctionData('sendMessage', tx.data)
                        log.eventData._decodedTo = decodedSendMessage[0]
                    } catch (error) {}

                    try {
                        const sendMessageInterface = new ethers.utils.Interface(['sendCallMessage(string _to,bytes _data,bytes _rollback)'])
                        const decodedSendMessage = sendMessageInterface.decodeFunctionData('sendCallMessage', tx.data)
                        log.eventData._decodedTo = decodedSendMessage[0]
                    } catch (error) {}

                    break
                case EVENT.ResponseMessage:
                    log.eventData = {
                        _sn: decodeEventLog._sn.toNumber(),
                        _code: decodeEventLog._code.toNumber(),
                        _msg: decodeEventLog._msg
                    }
                    break
                case EVENT.RollbackMessage:
                    log.eventData = {
                        _sn: decodeEventLog._sn.toNumber()
                    }
                    break
                case EVENT.RollbackExecuted:
                    log.eventData = {
                        _sn: decodeEventLog._sn.toNumber(),
                        _code: decodeEventLog._code.toNumber(),
                        _msg: decodeEventLog._msg
                    }
                    break
                case EVENT.MessageReceived:
                    log.eventData = {
                        _from: decodeEventLog._from?.hash,
                        _data: decodeEventLog._data
                    }
                    break
                case EVENT.CallMessage:
                    log.eventData = {
                        _sn: decodeEventLog._sn.toNumber(),
                        _from: decodeEventLog._from?.hash,
                        _to: decodeEventLog._to?.hash,
                        _reqId: decodeEventLog._reqId.toNumber(),
                        _data: decodeEventLog._data
                    }

                    // // try decode toBtp
                    // try {
                    //     const sendMessageInterface = new ethers.utils.Interface(['function sendMessage(string _to,bytes _data,bytes _rollback)'])
                    //     const decodedSendMessage = sendMessageInterface.decodeFunctionData('sendMessage', tx.data)
                    //     log.eventData._fromBtp = decodedSendMessage[0]
                    // } catch (error) {}

                    break
                case EVENT.CallExecuted:
                    log.eventData = {
                        _reqId: decodeEventLog._reqId.toNumber(),
                        _code: decodeEventLog._code.toNumber(),
                        _msg: decodeEventLog._msg
                    }
                    break
                default:
                    break
            }

            if (lastBlockNumber < log.blockNumber) lastBlockNumber = log.blockNumber
            result.push(log)
        }

        return { lastFlagNumber: lastBlockNumber, eventLogs: result }
    }
}

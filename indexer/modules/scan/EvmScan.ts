import logger from '../logger/logger'
import { ethers } from 'ethers'
import { API_URL, RPC_URL, EVENT, CONTRACT, API_KEY, BTP_NETWORK_ID, NETWORK } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import { sleep } from '../../common/helper'
import AxiosCustomInstance from './AxiosCustomInstance'
import xcallAbi from '../../abi/xcall.abi.json'
import assetManagerAbi from '../../abi/AssetManager.abi.json'
import oracleProxyAbi from '../../abi/OracleProxy.abi.json'
import balancedDollarAbi from '../../abi/BalancedDollar.abi.json'
const xcallInterface = new ethers.utils.Interface(xcallAbi)

export class EvmScan implements IScan {
    countName: string = 'BlockNumber'
    provider: ethers.providers.BaseProvider

    constructor(public network: string) {
        this.provider = new ethers.providers.JsonRpcProvider(RPC_URL[this.network])
    }

    async callApi(apiUrl: string, params: any): Promise<any[]> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()
            const res = await axiosInstance.get(apiUrl, {
                params: params
            })

            if (res.data.result) return res.data.result as any[]
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${apiUrl} ${error.code}`)
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
            let decodeEventLog: any = undefined

            try {
                decodeEventLog = xcallInterface.decodeEventLog(eventName, eventLog.data, eventLog.topics)
            } catch (error: any) {
                logger.error(`${this.network} ${eventName} decodeEventLog error ${error.code}`)
            }

            if (decodeEventLog) {
                // get tx
                let tx: any = undefined
                const maxRetries = 3
                const retryDelay = 3000
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        tx = await this.provider.getTransaction(eventLog.transactionHash)
                    } catch (error: any) {
                        logger.error(`${this.network} get transaction error ${error.code}`)
                        if (attempt < maxRetries) {
                            await sleep(retryDelay)
                        } else {
                            logger.error(`${this.network} get transaction failed ${eventLog.transactionHash}`)
                        }
                    }
                }
                if (!tx) {
                    logger.error(`${this.network} transaction not found ${eventLog.transactionHash}`)
                    continue
                }

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
                            _nsn: decodeEventLog._nsn?.toNumber(),
                            _from: decodeEventLog._from,
                            _to: decodeEventLog._to.hash
                        }

                        // try decode toBtp
                        log.eventData._decodedFrom = log.eventData._from // _from is always address

                        try {
                            if (!log.eventData._decodedTo) {
                                const sendCallMessageInterface = new ethers.utils.Interface([
                                    'sendCallMessage(string _to,bytes _data,bytes _rollback)'
                                ])
                                const decodedSendMessage = sendCallMessageInterface.decodeFunctionData('sendCallMessage', tx.data)
                                log.eventData._decodedTo = decodedSendMessage[0]
                            }
                        } catch (error) {}

                        try {
                            if (!log.eventData._decodedTo) {
                                const sendCallMessageInterface = new ethers.utils.Interface([
                                    'function sendCallMessage(string _to,bytes _data,bytes _rollback,string[] sources,string[] destinations)'
                                ])
                                const decodedSendMessage = sendCallMessageInterface.decodeFunctionData('sendCallMessage', tx.data)
                                log.eventData._decodedTo = decodedSendMessage[0]
                                // const sources = decodedSendMessage[3]
                                // const destinations = decodedSendMessage[4]
                            }
                        } catch (error) {}

                        // Try decode from AssetManager contract
                        try {
                            if (!log.eventData._decodedTo) {
                                let decodedData: any = undefined
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(
                                        assetManagerAbi,
                                        'deposit(address token,uint256 amount,string to)',
                                        tx.data
                                    )
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(assetManagerAbi, 'depositNative(uint256 amount,string to)', tx.data)
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(assetManagerAbi, 'deposit(address token,uint amount)', tx.data)
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(
                                        assetManagerAbi,
                                        'deposit(address token,uint amount,string memory to,bytes memory data)',
                                        tx.data
                                    )
                                if (!decodedData) decodedData = await this.decodeFunction(assetManagerAbi, 'depositNative(uint amount)', tx.data)
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(
                                        assetManagerAbi,
                                        'depositNative(uint amount,string memory to,bytes memory data)',
                                        tx.data
                                    )

                                if (decodedData) {
                                    // const encodedTo = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(`${BTP_NETWORK_ID[NETWORK.ICON]}/${CONTRACT[NETWORK.ICON].asset_manager}`))
                                    const assetManagerAddr = log.txTo
                                    const assetManagerContract = new ethers.Contract(assetManagerAddr, assetManagerAbi, this.provider)
                                    const iconAssetManagerAddr = await assetManagerContract.iconAssetManager()
                                    log.eventData._decodedTo = iconAssetManagerAddr
                                }
                            }
                        } catch (error) {}

                        // Try decode from OracleProxy contract
                        try {
                            if (!log.eventData._decodedTo) {
                                let decodedData: any = undefined
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(oracleProxyAbi, 'updateCreditVaultPrice(address _vault)', tx.data)

                                if (decodedData) {
                                    const oracleProxyAddr = log.txTo
                                    const oracleProxyContract = new ethers.Contract(oracleProxyAddr, oracleProxyAbi, this.provider)
                                    const iconOracleAddr = await oracleProxyContract.iconOracle()
                                    log.eventData._decodedTo = iconOracleAddr
                                }
                            }
                        } catch (error) {}

                        // Try decode from BalancedDollar contract
                        try {
                            if (!log.eventData._decodedTo) {
                                let decodedData: any = undefined
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(balancedDollarAbi, 'crossTransfer(string to, uint256 value)', tx.data)
                                if (!decodedData)
                                    decodedData = await this.decodeFunction(
                                        balancedDollarAbi,
                                        'crossTransfer(string to, uint256 value,bytes memory data)',
                                        tx.data
                                    )

                                if (decodedData) {
                                    const balancedDollarAddr = log.txTo
                                    const balancedDollarContract = new ethers.Contract(balancedDollarAddr, balancedDollarAbi, this.provider)
                                    const iconBnUSDAddr = await balancedDollarContract.iconBnUSD()
                                    log.eventData._decodedTo = iconBnUSDAddr
                                }
                            }
                        } catch (error) {}

                        console.log('log.eventData', log.eventData)

                        break
                    case EVENT.ResponseMessage:
                        log.eventData = {
                            _sn: decodeEventLog._sn.toNumber(),
                            _code: decodeEventLog._code?.toNumber(),
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
                            _code: decodeEventLog._code?.toNumber(),
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
                            _reqId: decodeEventLog._reqId?.toNumber(),
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
                            _reqId: decodeEventLog._reqId?.toNumber(),
                            _code: decodeEventLog._code?.toNumber(),
                            _msg: decodeEventLog._msg
                        }
                        break
                    default:
                        break
                }

                if (lastBlockNumber < log.blockNumber) lastBlockNumber = log.blockNumber
                result.push(log)
            }
        }

        return { lastFlagNumber: lastBlockNumber, eventLogs: result }
    }

    private async decodeFunction(abi: any, funcName: string, data: string) {
        try {
            const contractInterface = new ethers.utils.Interface(abi)
            const decodedData = contractInterface.decodeFunctionData(funcName, data)
            return decodedData
        } catch (error) {
            // logger.error(`decoding function error ${funcName}`)
        }

        return undefined
    }
}

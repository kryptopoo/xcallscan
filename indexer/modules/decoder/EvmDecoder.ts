import { IDecoder } from '../../interfaces/IDecoder'
import { ethers } from 'ethers'
import { EVENT, RPC_URLS } from '../../common/constants'
import { EventLog, EventLogData } from '../../types/EventLog'
import xcallAbi from '../../abi/xcall.abi.json'
import assetManagerAbi from '../../abi/AssetManager.abi.json'
import oracleProxyAbi from '../../abi/OracleProxy.abi.json'
import balancedDollarAbi from '../../abi/BalancedDollar.abi.json'
import logger from '../logger/logger'
const xcallInterface = new ethers.utils.Interface(xcallAbi)

export class EvmDecoder implements IDecoder {
    private provider: ethers.providers.StaticJsonRpcProvider

    constructor(network: string) {
        this.provider = new ethers.providers.StaticJsonRpcProvider(RPC_URLS[network][0])
    }

    public decodeFunction(abi: any, funcName: string, data: string) {
        try {
            const contractInterface = new ethers.utils.Interface(abi)
            const decodedData = contractInterface.decodeFunctionData(funcName, data)
            return decodedData
        } catch (error) {}

        return undefined
    }

    async decodeEventLog(eventLog: any, eventName: string): Promise<EventLogData | undefined> {
        let rs: EventLogData = {}

        let decodeEventLog: any = undefined
        try {
            decodeEventLog = xcallInterface.decodeEventLog(eventName, eventLog.data, eventLog.topics)
        } catch (error: any) {
            logger.error(`${eventName} decodeEventLog error ${error.code}`)
        }

        if (!decodeEventLog) return undefined

        switch (eventName) {
            case EVENT.CallMessageSent:
                rs = {
                    _sn: decodeEventLog._sn.toNumber(),
                    _nsn: decodeEventLog._nsn?.toNumber(),
                    _from: decodeEventLog._from,
                    _to: decodeEventLog._to.hash
                }

                // try decode toBtp
                rs._decodedFrom = rs._from // _from is always address

                const tx = await this.provider.getTransaction(eventLog.transactionHash)
                try {
                    if (!rs._decodedTo) {
                        const sendCallMessageInterface = new ethers.utils.Interface(['sendCallMessage(string _to,bytes _data,bytes _rollback)'])
                        const decodedSendMessage = sendCallMessageInterface.decodeFunctionData('sendCallMessage', tx.data)
                        rs._decodedTo = decodedSendMessage[0]
                    }
                } catch (error) {}

                try {
                    if (!rs._decodedTo) {
                        const sendCallMessageInterface = new ethers.utils.Interface([
                            'function sendCallMessage(string _to,bytes _data,bytes _rollback,string[] sources,string[] destinations)'
                        ])
                        const decodedSendMessage = sendCallMessageInterface.decodeFunctionData('sendCallMessage', tx.data)
                        rs._decodedTo = decodedSendMessage[0]
                        // const sources = decodedSendMessage[3]
                        // const destinations = decodedSendMessage[4]
                    }
                } catch (error) {}

                try {
                    if (!rs._decodedTo) {
                        const sendCallInterface = new ethers.utils.Interface(['function sendCall(string _to,bytes _data)'])
                        const decodedSendCall = sendCallInterface.decodeFunctionData('sendCall', tx.data)
                        rs._decodedTo = decodedSendCall[0]
                    }
                } catch (error) {}

                // Try decode from AssetManager contract
                try {
                    if (!rs._decodedTo) {
                        let decodedData: any = undefined
                        if (!decodedData)
                            decodedData = this.decodeFunction(assetManagerAbi, 'deposit(address token,uint256 amount,string to)', tx.data)
                        if (!decodedData) decodedData = this.decodeFunction(assetManagerAbi, 'depositNative(uint256 amount,string to)', tx.data)
                        if (!decodedData) decodedData = this.decodeFunction(assetManagerAbi, 'deposit(address token,uint amount)', tx.data)
                        if (!decodedData)
                            decodedData = this.decodeFunction(
                                assetManagerAbi,
                                'deposit(address token,uint amount,string memory to,bytes memory data)',
                                tx.data
                            )
                        if (!decodedData) decodedData = this.decodeFunction(assetManagerAbi, 'depositNative(uint256 amount)', tx.data)
                        if (!decodedData)
                            decodedData = this.decodeFunction(assetManagerAbi, 'depositNative(uint256 amount,string to,bytes data)', tx.data)

                        if (decodedData && tx.to) {
                            const assetManagerAddr = tx.to
                            const assetManagerContract = new ethers.Contract(assetManagerAddr, assetManagerAbi, this.provider)
                            const iconAssetManagerAddr = await assetManagerContract.iconAssetManager()
                            rs._decodedTo = iconAssetManagerAddr
                        }
                    }
                } catch (error) {}

                // Try decode from OracleProxy contract
                try {
                    if (!rs._decodedTo) {
                        let decodedData: any = undefined
                        if (!decodedData) decodedData = this.decodeFunction(oracleProxyAbi, 'updateCreditVaultPrice(address _vault)', tx.data)

                        if (decodedData && tx.to) {
                            const oracleProxyAddr = tx.to
                            const oracleProxyContract = new ethers.Contract(oracleProxyAddr, oracleProxyAbi, this.provider)
                            const iconOracleAddr = await oracleProxyContract.iconOracle()
                            rs._decodedTo = iconOracleAddr
                        }
                    }
                } catch (error) {}

                // Try decode from BalancedDollar contract
                try {
                    if (!rs._decodedTo) {
                        let decodedData: any = undefined
                        if (!decodedData) decodedData = this.decodeFunction(balancedDollarAbi, 'crossTransfer(string to, uint256 value)', tx.data)
                        if (!decodedData)
                            decodedData = this.decodeFunction(balancedDollarAbi, 'crossTransfer(string to, uint256 value,bytes memory data)', tx.data)

                        if (decodedData && tx.to) {
                            const balancedDollarAddr = tx.to
                            const balancedDollarContract = new ethers.Contract(balancedDollarAddr, balancedDollarAbi, this.provider)
                            const iconBnUSDAddr = await balancedDollarContract.iconBnUSD()
                            rs._decodedTo = iconBnUSDAddr
                        }
                    }
                } catch (error) {}

                break
            case EVENT.ResponseMessage:
                rs = {
                    _sn: decodeEventLog._sn.toNumber(),
                    _code: decodeEventLog._code?.toNumber(),
                    _msg: decodeEventLog._msg
                }
                break
            case EVENT.RollbackMessage:
                rs = {
                    _sn: decodeEventLog._sn.toNumber()
                }
                break
            case EVENT.RollbackExecuted:
                rs = {
                    _sn: decodeEventLog._sn.toNumber(),
                    _code: decodeEventLog._code?.toNumber(),
                    _msg: decodeEventLog._msg
                }
                break
            case EVENT.MessageReceived:
                rs = {
                    _from: decodeEventLog._from?.hash,
                    _data: decodeEventLog._data
                }
                break
            case EVENT.CallMessage:
                rs = {
                    _sn: decodeEventLog._sn.toNumber(),
                    _from: decodeEventLog._from?.hash,
                    _to: decodeEventLog._to?.hash,
                    _reqId: decodeEventLog._reqId?.toNumber(),
                    _data: decodeEventLog._data
                }

                break
            case EVENT.CallExecuted:
                rs = {
                    _reqId: decodeEventLog._reqId?.toNumber(),
                    _code: decodeEventLog._code?.toNumber(),
                    _msg: decodeEventLog._msg
                }
                break
            default:
                break
        }

        return rs
    }
}

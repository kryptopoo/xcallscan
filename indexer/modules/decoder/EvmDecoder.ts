import { IDecoder } from '../../interfaces/IDecoder'
import { ethers } from 'ethers'
import { EVENT, INTENTS_EVENT, RPC_URLS } from '../../common/constants'
import { EventLog, EventLogData, IntentsEventLogData } from '../../types/EventLog'
import xcallAbi from '../../abi/xcall.abi.json'
import intentsAbi from '../../abi/Intents.abi.json'
import assetManagerAbi from '../../abi/AssetManager.abi.json'
import oracleProxyAbi from '../../abi/OracleProxy.abi.json'
import balancedDollarAbi from '../../abi/BalancedDollar.abi.json'
import stackedIcxAbi from '../../abi/StackedICX.abi.json'
import logger from '../logger/logger'
const xcallInterface = new ethers.utils.Interface(xcallAbi)
const intentsInterface = new ethers.utils.Interface(intentsAbi)

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

    async decodeEventLog(eventLog: any, eventName: string): Promise<EventLogData | IntentsEventLogData | undefined> {
        let rs: EventLogData | IntentsEventLogData | undefined = {}

        if (!eventName || eventName == '') return undefined

        let decodeEventLog: any = undefined
        try {
            decodeEventLog = xcallInterface.decodeEventLog(eventName, eventLog.data, eventLog.topics)
        } catch (error: any) {
            logger.error(`xcall ${eventName} decodeEventLog error ${error.code}`)
        }
        try {
            decodeEventLog = intentsInterface.decodeEventLog(eventName, eventLog.data, eventLog.topics)
        } catch (error: any) {
            logger.error(`intents ${eventName} decodeEventLog error ${error.code}`)
        }

        if (!decodeEventLog) return undefined

        // xcall event
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

                // Try decode from StackedICX and Balanced Token contract
                try {
                    if (!rs._decodedTo) {
                        let decodedData: any = undefined
                        if (!decodedData) decodedData = this.decodeFunction(stackedIcxAbi, 'crossTransfer(string to, uint256 value)', tx.data)
                        if (!decodedData)
                            decodedData = this.decodeFunction(stackedIcxAbi, 'crossTransfer(string to, uint256 value,bytes memory data)', tx.data)

                        if (decodedData && tx.to) {
                            const stackedIcxAddr = tx.to
                            const stackedIcxContract = new ethers.Contract(stackedIcxAddr, stackedIcxAbi, this.provider)
                            const iconTokenAddr = await stackedIcxContract.iconTokenAddress()
                            rs._decodedTo = iconTokenAddr
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

        // Intents events
        switch (eventName) {
            case INTENTS_EVENT.SwapIntent:
                rs = {
                    id: Number(decodeEventLog.id),
                    emitter: decodeEventLog.emitter,
                    srcNID: decodeEventLog.srcNID,
                    dstNID: decodeEventLog.dstNID,
                    creator: decodeEventLog.creator,
                    destinationAddress: decodeEventLog.destinationAddress,
                    token: decodeEventLog.token,
                    amount: Number(decodeEventLog.amount).toString(),
                    toToken: decodeEventLog.toToken,
                    toAmount: Number(decodeEventLog.toAmount).toString(),
                    data: decodeEventLog.data
                }
                break
            case INTENTS_EVENT.OrderFilled:
                rs = {
                    id: Number(decodeEventLog.id),
                    srcNID: decodeEventLog.srcNID
                }

                const intentsTx = await this.provider.getTransaction(eventLog.transactionHash)
                const decodedFill = this.decodeFunction(intentsAbi, 'fill', intentsTx.data)
                if (decodedFill) {
                    rs = {
                        id: Number(decodeEventLog.id),
                        emitter: decodedFill.order.emitter,
                        srcNID: decodedFill.order.srcNID,
                        dstNID: decodedFill.order.dstNID,
                        creator: decodedFill.order.creator,
                        destinationAddress: decodedFill.order.destinationAddress,
                        token: decodedFill.order.token,
                        amount: Number(decodedFill.order.amount).toString(),
                        toToken: decodedFill.order.toToken,
                        toAmount: Number(decodedFill.order.toAmount).toString(),
                        data: decodedFill.order.data
                    }
                }

                break
            case INTENTS_EVENT.OrderClosed:
                rs = {
                    id: Number(decodeEventLog.id)
                }

                const orderClosedTx = await this.provider.getTransaction(eventLog.transactionHash)
                const decodedOrderClosed = this.decodeFunction(intentsAbi, 'recvMessage', orderClosedTx.data)
                if (decodedOrderClosed) {
                    rs = {
                        id: Number(decodeEventLog.id),
                        dstNID: decodedOrderClosed.srcNetwork,
                        sn: decodedOrderClosed._connSn,
                        msg: decodedOrderClosed._msg
                    }
                }

                break
            case INTENTS_EVENT.OrderCancelled:
                rs = {
                    id: Number(decodeEventLog.id),
                    srcNID: decodeEventLog.srcNID
                }
                break

            case INTENTS_EVENT.Message:
                rs = {
                    sn: Number(decodeEventLog.sn),
                    dstNID: decodeEventLog.targetNetwork.toString(),
                    msg: decodeEventLog._msg.toString()
                }
                break
            default:
                break
        }

        return rs
    }
}

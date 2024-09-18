import logger from '../logger/logger'
import { ethers } from 'ethers'
import { API_URL, RPC_URL, EVENT, CONTRACT, API_KEY, BTP_NETWORK_ID, NETWORK, RPC_URLS } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import { sleep } from '../../common/helper'
import AxiosCustomInstance from './AxiosCustomInstance'
import xcallAbi from '../../abi/xcall.abi.json'
import assetManagerAbi from '../../abi/AssetManager.abi.json'
import oracleProxyAbi from '../../abi/OracleProxy.abi.json'
import balancedDollarAbi from '../../abi/BalancedDollar.abi.json'
import { EvmDecoder } from '../decoder/EvmDecoder'
const xcallInterface = new ethers.utils.Interface(xcallAbi)

export class EvmScan implements IScan {
    countName: string = 'BlockNumber'
    provider: ethers.providers.BaseProvider
    decoder: EvmDecoder

    constructor(public network: string) {
        this.provider = new ethers.providers.JsonRpcProvider(RPC_URL[this.network])
        this.decoder = new EvmDecoder(this.network)
    }

    async callApi(apiUrl: string, params: any): Promise<any[]> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()
            const res = await axiosInstance.get(apiUrl, {
                params: params
            })

            if (res.data.message == 'OK' && res.data.result) return res.data.result as any[]
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${apiUrl} ${error.code}`)
        }

        return []
    }

    async getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }> {
        const limit = 20
        let flagNumber: number = Number(flag)
        let lastBlockNumber = flagNumber
        let result: EventLog[] = []
        let eventLogs = await this.callApi(API_URL[this.network], {
            module: 'logs',
            action: 'getLogs',
            address: xcallAddress,
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
                logger.error(`${this.network} ${eventName} decodeEventLog error ${error?.code}`)
            }

            if (decodeEventLog) {
                // get tx
                let tx: any = await this.getTransactionDetail(eventLog.transactionHash)
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

                log.eventData = await this.decoder.decodeEventLog(eventLog, eventName)

                if (lastBlockNumber < Number(log.blockNumber)) lastBlockNumber = Number(log.blockNumber)
                result.push(log)
            }
        }

        return { lastFlag: lastBlockNumber.toString(), eventLogs: result }
    }

    private async getTransactionDetail(txHash: string) {
        const maxRetries = 5
        const retryDelay = 2000
        let retryProviderIndex = -1
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const tx = await this.provider.getTransaction(txHash)
                return tx
            } catch (error: any) {
                logger.error(`${this.network} get transaction error ${error.code}`)
                if (attempt < maxRetries) {
                    // try change other provider
                    if (retryProviderIndex < RPC_URLS[this.network].length - 1) {
                        retryProviderIndex += 1
                        this.provider = new ethers.providers.JsonRpcProvider(RPC_URLS[this.network][retryProviderIndex])
                        logger.info(`${this.network} change provider uri ${RPC_URLS[this.network][retryProviderIndex]}`)
                    }

                    await sleep(retryDelay)
                } else {
                    logger.error(`${this.network} get transaction failed ${txHash}`)
                }
            }
        }

        return undefined
    }
}

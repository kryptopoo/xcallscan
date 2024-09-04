import { ContractInterface, ethers } from 'ethers'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URLS, SUBSCRIBER_INTERVAL, WSS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLog, EventLogData } from '../../types/EventLog'
import { EvmDecoder } from '../decoder/EvmDecoder'
import { retryAsync } from 'ts-retry'

export class EvmSubscriber implements ISubscriber {
    private provider: ethers.providers.StaticJsonRpcProvider
    private decoder: IDecoder

    public contractAddress: string

    constructor(public network: string) {
        this.provider = new ethers.providers.StaticJsonRpcProvider(WSS[this.network][0])
        // // pollingInterval default is 4000 ms
        this.provider.pollingInterval = SUBSCRIBER_INTERVAL
        this.decoder = new EvmDecoder(this.network)
        this.contractAddress = CONTRACT[this.network].xcall[0]
    }

    private buildEventLog(block: any, tx: any, eventName: string, eventData: EventLogData) {
        return {
            // txRaw: JSON.stringify(tx),
            blockNumber: block.number,
            blockTimestamp: block.timestamp,
            txHash: tx.transactionHash,
            txFrom: tx.from,
            txTo: tx.to ?? '',
            txFee: tx.effectiveGasPrice.mul(tx.gasUsed).toString(),
            // txValue: ethers.BigNumber.from(tx.value).toString(),
            // gasPrice: ethers.BigNumber.from(eventLog.gasPrice).toString(),
            // gasUsed: ethers.BigNumber.from(eventLog.gasUsed).toString(),
            eventName: eventName,
            eventData: eventData
        } as EventLog
    }

    private getEventName(topics: string[]) {
        if (topics.includes(ethers.utils.id('CallMessageSent(address,string,uint256)'))) return EVENT.CallMessageSent
        if (topics.includes(ethers.utils.id('CallMessage(string,string,uint256,uint256,bytes)'))) return EVENT.CallMessage
        if (topics.includes(ethers.utils.id('CallExecuted(uint256,int256,string)'))) return EVENT.CallExecuted
        if (topics.includes(ethers.utils.id('ResponseMessage(uint256,int256)'))) return EVENT.ResponseMessage
        if (topics.includes(ethers.utils.id('RollbackMessage(uint256)'))) return EVENT.RollbackMessage
        if (topics.includes(ethers.utils.id('RollbackExecuted(uint256)'))) return EVENT.RollbackExecuted

        return ''
    }

    subscribe(callback: ISubscriberCallback) {
        logger.info(`${this.network} connect ${WSS[this.network][0]}`)
        logger.info(`${this.network} listen events on ${this.contractAddress}`)

        const topics = [
            [
                ethers.utils.id('CallMessageSent(address,string,uint256)'),
                ethers.utils.id('CallMessage(string,string,uint256,uint256,bytes)'),
                ethers.utils.id('CallExecuted(uint256,int256,string)'),
                ethers.utils.id('ResponseMessage(uint256,int256)'),
                ethers.utils.id('RollbackMessage(uint256)'),
                ethers.utils.id('RollbackExecuted(uint256)')
            ]
        ]
        const filter = {
            address: this.contractAddress,
            topics: topics
        }
        this.provider.on(filter, async (log: any, event: any) => {
            logger.info(`${this.network} ondata ${JSON.stringify(log)}`)

            try {
                const eventName = this.getEventName(log.topics)
                const decodeEventLog = await this.decoder.decodeEventLog(log, eventName)

                if (decodeEventLog) {
                    const block = await retryAsync(
                        async () => {
                            return await this.provider.getBlock(log.blockNumber)
                        },
                        { delay: 1000, maxTry: 3 }
                    )

                    const tx = await retryAsync(
                        async () => {
                            return await this.provider.getTransactionReceipt(log.transactionHash)
                        },
                        { delay: 1000, maxTry: 3 }
                    )

                    if (tx) {
                        const eventLog = this.buildEventLog(block, tx, eventName, decodeEventLog)
                        callback(eventLog)
                    } else {
                        logger.info(`${this.network} ondata ${eventName} could not find tx ${log.transactionHash}`)
                    }
                } else {
                    logger.info(`${this.network} ondata ${eventName} could not decodeEventLog`)
                }
            } catch (error) {
                logger.info(`${this.network} error ${JSON.stringify(error)}`)
                logger.error(`${this.network} error ${JSON.stringify(error)}`)
            }
        })
    }
}
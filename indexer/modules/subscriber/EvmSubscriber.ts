import { ethers } from 'ethers'
import { retryAsync } from 'ts-retry'

import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, INTENTS_EVENT, NETWORK, RPC_URLS } from '../../common/constants'
import { EventLog, EventLogData, IntentsEventLogData } from '../../types/EventLog'
import { EvmDecoder } from '../decoder/EvmDecoder'
import { BaseSubscriber } from './BaseSubscriber'

export class EvmSubscriber extends BaseSubscriber {
    private provider: ethers.providers.BaseProvider

    ETHERS_EVENT_ID: { [eventName: string]: string } = {
        [EVENT.CallMessageSent]: ethers.utils.id('CallMessageSent(address,string,uint256)'),
        [EVENT.CallMessage]: ethers.utils.id('CallMessage(string,string,uint256,uint256,bytes)'),
        [EVENT.CallExecuted]: ethers.utils.id('CallExecuted(uint256,int256,string)'),
        [EVENT.ResponseMessage]: ethers.utils.id('ResponseMessage(uint256,int256)'),
        [EVENT.RollbackMessage]: ethers.utils.id('RollbackMessage(uint256)'),
        [EVENT.RollbackExecuted]: ethers.utils.id('RollbackExecuted(uint256)'),
        [INTENTS_EVENT.SwapIntent]: ethers.utils.id('SwapIntent(uint256,string,string,string,string,string,string,uint256,string,uint256,bytes)'),
        [INTENTS_EVENT.OrderFilled]: ethers.utils.id('OrderFilled(uint256,string)'),
        [INTENTS_EVENT.OrderClosed]: ethers.utils.id('OrderClosed(uint256)'),
        [INTENTS_EVENT.OrderCancelled]: ethers.utils.id('OrderCancelled(uint256,string)'),
        [INTENTS_EVENT.Message]: ethers.utils.id('Message(string,uint256,bytes)')
    }

    constructor(network: string) {
        const urls = RPC_URLS[network].slice(0, 3)

        super(network, urls, new EvmDecoder(network))

        // this.provider = new ethers.providers.StaticJsonRpcProvider(this.url)
        this.provider = new ethers.providers.FallbackProvider(urls.map((n) => new ethers.providers.StaticJsonRpcProvider(n)))
        // // pollingInterval default is 4000 ms
        this.provider.pollingInterval = this.interval
    }

    private buildEventLog(block: any, tx: any, eventName: string, eventData: EventLogData | IntentsEventLogData) {
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
        for (const [key, value] of Object.entries(this.ETHERS_EVENT_ID)) {
            if (topics.includes(value)) return key
        }

        return ''
    }

    async fetchEventLog(log: any) {
        this.logger.info(`${this.network} ondata ${JSON.stringify(log)}`)

        try {
            const eventName = this.getEventName(log.topics)
            const decodeEventLog = await this.decoder.decodeEventLog(log, eventName)

            if (decodeEventLog) {
                const block = await retryAsync(() => this.provider.getBlock(log.blockNumber), {
                    delay: 1000,
                    maxTry: 3,
                    onError: (err, currentTry) => {
                        this.logger.error(`${this.network} retry ${currentTry} getBlock ${err}`)
                    }
                })

                const tx = await retryAsync(() => this.provider.getTransactionReceipt(log.transactionHash), {
                    delay: 1000,
                    maxTry: 3,
                    onError: (err, currentTry) => {
                        this.logger.error(`${this.network} retry ${currentTry} getTransactionReceipt ${err}`)
                    }
                })

                if (tx) {
                    const eventLog = this.buildEventLog(block, tx, eventName, decodeEventLog)
                    return eventLog
                } else {
                    this.logger.info(`${this.network} ondata ${eventName} could not find tx ${log.transactionHash}`)
                }
            } else {
                this.logger.info(`${this.network} ondata ${eventName} could not decodeEventLog`)
            }
        } catch (error) {
            this.logger.error(`${this.network} error ${JSON.stringify(error)}`)
        }

        return undefined
    }

    async subscribe(contracts: string[], eventNames: string[], txHashes: string[], callback: ISubscriberCallback) {
        this.logger.info(`${this.network} connect ${JSON.stringify(this.url)}`)
        this.logger.info(`${this.network} listen events ${JSON.stringify(eventNames)} on ${JSON.stringify(contracts)}`)

        if (txHashes.length > 0) {
            // subscribe data by specific transaction hashes
            for (let i = 0; i < txHashes.length; i++) {
                const txHash = txHashes[i]

                const tx = await retryAsync(() => this.provider.getTransactionReceipt(txHash), {
                    delay: 1000,
                    maxTry: 3,
                    onError: (err, currentTry) => {
                        this.logger.error(`${this.network} retry ${currentTry} getTransactionReceipt ${err}`)
                    }
                })

                for (let j = 0; j < tx.logs.length; j++) {
                    const eventLog = await this.fetchEventLog(tx.logs[j])
                    if (eventLog && eventNames.includes(eventLog.eventName)) callback(eventLog)
                }
            }
        } else {
            for (let i = 0; i < contracts.length; i++) {
                const contractAddress = contracts[i]
                const filter = {
                    address: contractAddress,
                    topics: [eventNames.map((eventName) => this.ETHERS_EVENT_ID[eventName]).filter((e) => e !== undefined)]
                }

                this.provider.on(filter, async (log: any, event: any) => {
                    const eventLog = await this.fetchEventLog(log)
                    if (eventLog) callback(eventLog)
                })

                this.provider.on('poll', () => {
                    this.logLatestPolling(`${this.network}_${contractAddress}`)
                })
            }
        }
    }
}

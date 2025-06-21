import { ethers } from 'ethers'
import { retryAsync } from 'ts-retry'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, INTENTS_EVENT, NETWORK, RPC_URLS } from '../../common/constants'
import { EventLog, EventLogData, IntentsEventLogData } from '../../types/EventLog'
import { EvmDecoder } from '../decoder/EvmDecoder'
import { BaseSubscriber } from './BaseSubscriber'
import logger from '../logger/logger'

class RetriableStaticJsonRpcProvider extends ethers.providers.StaticJsonRpcProvider {
    providerList: ethers.providers.StaticJsonRpcProvider[]
    currentIndex = 0
    error: any

    constructor(rpcs: string[], pollingInterval: number) {
        super({ url: rpcs[0] })
        this.pollingInterval = pollingInterval

        this.providerList = rpcs.map((url) => {
            const provider = new ethers.providers.StaticJsonRpcProvider({ url })
            provider.pollingInterval = pollingInterval
            return provider
        })
    }

    async send(method: string, params: Array<any>, retries?: number): Promise<any> {
        let _retries = retries || 0

        /**
         * validate retries before continue
         * base case of recursivity (throw if already try all rpcs)
         */
        this.validateRetries(_retries)

        try {
            // select properly provider
            const provider = this.selectProvider()

            // send rpc call
            return await provider.send(method, params)
        } catch (error) {
            // store error internally
            this.error = error

            // increase retries
            _retries = _retries + 1

            logger.error(`RetriableStaticJsonRpcProvider send failed, retried ${_retries}`)

            return this.send(method, params, _retries)
        }
    }

    private selectProvider() {
        // last rpc from the list
        if (this.currentIndex === this.providerList.length) {
            // set currentIndex to the seconds element
            this.currentIndex = 1
            return this.providerList[0]
        }

        // select current provider
        const provider = this.providerList[this.currentIndex]
        // increase counter
        this.currentIndex = this.currentIndex + 1

        return provider
    }

    /**
     * validate that retries is equal to the length of rpc
     * to ensure rpc are called at least one time
     *
     * if that's the case, and we fail in all the calls
     * then throw the internal saved error
     */
    private validateRetries(retries: number) {
        if (retries === this.providerList.length) {
            const error = this.error
            this.error = undefined
            // throw new Error(error)
            logger.error(`RetriableStaticJsonRpcProvider validateRetries error`)
        }
    }
}

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

        // const fallbackProviderConfigs: {
        //     provider: ethers.providers.StaticJsonRpcProvider
        //     priority?: number
        //     weight?: number
        //     stallTimeout?: number
        // }[] = []
        // for (let i = 0; i < urls.length; i++) {
        //     const url = urls[i]
        //     fallbackProviderConfigs.push({
        //         provider: new ethers.providers.StaticJsonRpcProvider(url)
        //         // priority: urls.length - i,
        //         // weight: urls.length - i
        //         // stallTimeout: 1000
        //     })
        // }
        // const quorum = 1
        // this.provider = new ethers.providers.FallbackProvider(fallbackProviderConfigs, quorum)

        this.provider = new ethers.providers.StaticJsonRpcProvider(urls[0])
        // this.provider = new RetriableStaticJsonRpcProvider(urls, this.interval)
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

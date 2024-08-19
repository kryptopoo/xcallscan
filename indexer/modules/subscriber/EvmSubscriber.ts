import { ContractInterface, ethers } from 'ethers'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, NETWORK, RPC_URLS, WSS } from '../../common/constants'
import logger from '../logger/logger'

export class EvmSubscriber implements ISubscriber {
    private contract: ethers.Contract
    private provider: ethers.providers.StaticJsonRpcProvider

    constructor(public network: string, public contractAddress: string, abi: ContractInterface) {
        this.contract = new ethers.Contract(contractAddress, abi)
        this.provider = new ethers.providers.StaticJsonRpcProvider(WSS[this.network])
        this.provider.pollingInterval = 10000
    }

    subscribe(callback: ISubscriberCallback) {
        logger.info(`[subscriber] ${this.network} connecting ${WSS[this.network]}...`)
        logger.info(`[subscriber] ${this.network} listening events on contract ${this.contractAddress}....`)

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
        this.provider.on(filter, (log: any, event: any) => {
            // Emitted whenever a DAI token transfer occurs
            logger.info(`[subscriber] ${this.network} event: ${JSON.stringify(event)}`)
            logger.info(`[subscriber] ${this.network} log: ${JSON.stringify(log)}`)

            callback(log)
        })
    }
}

// const network = NETWORK.ARBITRUM
// const contract = '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b'
// console.log('contract', contract)
// const abi = require('./../../abi/xcall.abi.json')
// const subscriber = new EvmSubscriber(network, contract, abi)
// subscriber.subscribe((data: any) => {
//     logger.info(`[subscriber] ${subscriber.network} callback ${JSON.stringify(data)}`)
// })

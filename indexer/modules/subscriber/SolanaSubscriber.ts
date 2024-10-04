import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URL, RPC_URLS, SUBSCRIBER_INTERVAL, WEB3_ALCHEMY_API_KEY, WSS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { SolanaDecoder } from '../decoder/SolanaDecoder'
import solanaWeb3, { Connection, ParsedInnerInstruction, PublicKey, SignaturesForAddressOptions } from '@solana/web3.js'

export class SolanaSubscriber implements ISubscriber {
    network: string
    decoder = new SolanaDecoder()
    solanaConnection: Connection
    contractAddress: string
    wssUrl: string
    rpcUrl: string

    constructor() {
        this.network = NETWORK.SOLANA
        this.contractAddress = CONTRACT[this.network].xcall[0]

        this.wssUrl = WSS[this.network][0]
        this.rpcUrl = `${RPC_URLS[this.network].find((u) => u.includes('alchemy'))}/${WEB3_ALCHEMY_API_KEY}`
        this.solanaConnection = new solanaWeb3.Connection(this.rpcUrl, { wsEndpoint: this.wssUrl })
    }

    subscribe(callback: ISubscriberCallback) {
        logger.info(`${this.network} connect ${this.wssUrl}`)
        logger.info(`${this.network} listen events on ${this.contractAddress}`)

        let subscriptionId = 0
        try {
            const publicKey = new PublicKey(this.contractAddress)
            subscriptionId = this.solanaConnection.onLogs(
                publicKey,
                (logs: any, context: any) => {
                    logger.info(`Event detected ${JSON.stringify(logs)}, Context: ${JSON.stringify(context)}`)
                },
                'confirmed'
            )
        } catch (error) {
            this.solanaConnection.removeOnLogsListener(subscriptionId)

            this.subscribe(callback)
        }
    }
}

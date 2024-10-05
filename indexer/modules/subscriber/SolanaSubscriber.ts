import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URL, RPC_URLS, SUBSCRIBER_INTERVAL, WEB3_ALCHEMY_API_KEY, WSS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { SolanaDecoder } from '../decoder/SolanaDecoder'
import solanaWeb3, { Connection, ParsedInnerInstruction, PublicKey, SignaturesForAddressOptions } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'
import { BorshCoder, EventParser, Program } from '@coral-xyz/anchor'
const xcallIdl = require('../../abi/xcall.idl.json')

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
                    logger.info(`logs: ${JSON.stringify(logs)}, context: ${JSON.stringify(context)}`)
                },
                'confirmed'
            )

            // listen from anchor lib
            const keypair = anchor.web3.Keypair.generate()
            const wallet = new anchor.Wallet(keypair)
            const provider = new anchor.AnchorProvider(this.solanaConnection, wallet)
            const program = new anchor.Program(xcallIdl, provider)

            // "events": [
            //     { "name": "CallExecuted", "discriminator": [237, 120, 238, 142, 189, 37, 65, 128] },
            //     { "name": "CallMessage", "discriminator": [125, 100, 225, 111, 72, 201, 186, 123] },
            //     { "name": "CallMessageSent", "discriminator": [255, 161, 224, 203, 154, 117, 117, 126] },
            //     { "name": "ResponseMessage", "discriminator": [125, 230, 224, 74, 135, 185, 132, 218] },
            //     { "name": "RollbackExecuted", "discriminator": [50, 154, 60, 223, 193, 198, 62, 240] },
            //     { "name": "RollbackMessage", "discriminator": [207, 120, 146, 208, 75, 64, 28, 168] }
            // ],
            program.addEventListener('CallExecuted', (event, slot) => {
                logger.info(`CallExecuted slot ${JSON.stringify(slot)} event value ${JSON.stringify(event)}`)
            })
            program.addEventListener('CallMessage', (event, slot) => {
                logger.info(`CallMessage slot ${JSON.stringify(slot)} event value ${JSON.stringify(event)}`)
            })
            program.addEventListener('CallMessageSent', (event, slot) => {
                logger.info(`CallMessageSent slot ${JSON.stringify(slot)} event value ${JSON.stringify(event)}`)
            })
            program.addEventListener('ResponseMessage', (event, slot) => {
                logger.info(`ResponseMessage slot ${JSON.stringify(slot)} event value ${JSON.stringify(event)}`)
            })
            program.addEventListener('RollbackExecuted', (event, slot) => {
                logger.info(`RollbackExecuted slot ${JSON.stringify(slot)} event value ${JSON.stringify(event)}`)
            })
            program.addEventListener('RollbackMessage', (event, slot) => {
                logger.info(`RollbackMessage slot ${JSON.stringify(slot)} event value ${JSON.stringify(event)}`)
            })
        } catch (error) {
            this.solanaConnection.removeOnLogsListener(subscriptionId)

            this.subscribe(callback)
        }
    }
}

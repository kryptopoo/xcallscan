import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URLS, SUBSCRIBER_INTERVAL, WEB3_ALCHEMY_API_KEY, WSS_URLS } from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { SolanaDecoder } from '../decoder/SolanaDecoder'
import solanaWeb3, { Connection, ParsedInnerInstruction, PublicKey, SignaturesForAddressOptions } from '@solana/web3.js'
import { BaseSubscriber } from './BaseSubscriber'
import { retryAsync } from 'ts-retry'
import { EventLog } from '../../types/EventLog'

export class SolanaSubscriber extends BaseSubscriber {
    solanaConnection: Connection

    constructor() {
        super(NETWORK.SOLANA, RPC_URLS[NETWORK.SOLANA], new SolanaDecoder())

        this.solanaConnection = new solanaWeb3.Connection(this.url)
    }

    async subscribe(callback: ISubscriberCallback) {
        logger.info(`${this.network} connect ${this.url}`)
        logger.info(`${this.network} listen events on ${JSON.stringify(this.xcallContracts)}`)

        const addressPubkey = new solanaWeb3.PublicKey(this.xcallContracts[0])
        const latestTxs = await retryAsync(
            async () => {
                return await this.solanaConnection.getSignaturesForAddress(addressPubkey, { limit: 1 })
            },
            { delay: 1000, maxTry: 3 }
        )

        let latestSignature = latestTxs[0].signature
        logger.info(`${this.network} latestSignature ${latestSignature}`)

        const task = () => {
            const intervalId = setInterval(async () => {
                try {
                    // try rotating other rpcs if failed
                    const rotateRpcRetries = 3
                    let txs: any
                    for (let retry = 1; retry <= rotateRpcRetries; retry++) {
                        txs = await retryAsync(
                            async () => {
                                const options: SignaturesForAddressOptions = { limit: 20, until: latestSignature }

                                return await this.solanaConnection.getSignaturesForAddress(addressPubkey, options)
                            },
                            { delay: 1000, maxTry: 3 }
                        )

                        if (!txs) {
                            const rotatedRpc = this.rotateUrl()
                            logger.error(`${this.network} retry ${retry} changing rpc to ${rotatedRpc}`)
                        } else break
                    }

                    if (txs) {
                        if (txs.length > 0) logger.info(`${this.network} ondata ${JSON.stringify(txs)}`)

                        // sort slot/block asc
                        txs = txs.sort((a: any, b: any) => a.slot - b.slot)
                        const txSignatures = txs.map((t: any) => t.signature)
                        for (let i = 0; i < txSignatures.length; i++) {
                            const txDetail = await this.solanaConnection.getParsedTransaction(txSignatures[i], { maxSupportedTransactionVersion: 0 })
                            if (txDetail) {
                                const eventNames = Object.values(EVENT)
                                for (let j = 0; j < eventNames.length; j++) {
                                    const decodedEventName = eventNames[i]
                                    const decodeEventLog = await this.decoder.decodeEventLog(txDetail, decodedEventName)
                                    if (decodeEventLog) {
                                        const txHash = txDetail.transaction.signatures[0]
                                        const log: EventLog = {
                                            // txRaw: tx.transaction,
                                            blockNumber: Number(txDetail.slot),
                                            blockTimestamp: Number(txDetail.blockTime),
                                            txHash: txHash,
                                            txFrom: txDetail.transaction.message.accountKeys.find((k) => k.signer)?.pubkey.toString() ?? '',
                                            txTo: this.xcallContracts[0],
                                            txFee: txDetail.meta?.fee.toString(),
                                            // // txValue: tx.value.toString(),
                                            eventName: decodedEventName,
                                            eventData: decodeEventLog
                                        }

                                        callback(log)
                                    }
                                }
                            }
                        }

                        if (txs.length > 0) latestSignature = txs[txs.length - 1].signature
                    }
                } catch (error) {
                    logger.error(`${this.network} clear interval task ${JSON.stringify(error)}`)
                    clearInterval(intervalId)

                    // retry with another task
                    task()
                }
            }, this.interval)
        }

        // run task
        task()
    }
}

import { ISubscriberCallback } from '../../interfaces/ISubcriber'
import { EVENT, NETWORK, RPC_URLS } from '../../common/constants'
import { SolanaDecoder } from '../decoder/SolanaDecoder'
import solanaWeb3, { Connection } from '@solana/web3.js'
import { BaseSubscriber } from './BaseSubscriber'
import { retryAsync } from 'ts-retry'
import { EventLog } from '../../types/EventLog'

export class SolanaSubscriber extends BaseSubscriber {
    solanaConnection: Connection

    constructor() {
        super(NETWORK.SOLANA, RPC_URLS[NETWORK.SOLANA], new SolanaDecoder())

        this.solanaConnection = new solanaWeb3.Connection(this.url)
    }

    async subscribe(contractAddresses: string[], eventNames: string[], callback: ISubscriberCallback) {
        this.logger.info(`${this.network} connect ${this.url}`)
        this.logger.info(`${this.network} listen events ${JSON.stringify(eventNames)} on ${JSON.stringify(contractAddresses)}`)

        const addressPubkey = new solanaWeb3.PublicKey(contractAddresses[0])
        const latestTxs = await retryAsync(() => this.solanaConnection.getSignaturesForAddress(addressPubkey, { limit: 1 }), {
            delay: 1000,
            maxTry: 3,
            onError: (err, currentTry) => {
                this.logger.error(`${this.network} retry ${currentTry} getSignaturesForAddress ${err}`)
            }
        })

        let latestSignature = latestTxs[0].signature
        this.logger.info(`${this.network} latestSignature ${latestSignature}`)

        const task = () => {
            const intervalId = setInterval(async () => {
                try {
                    this.logLatestPolling()

                    let txs = await retryAsync(
                        () => this.solanaConnection.getSignaturesForAddress(addressPubkey, { limit: 20, until: latestSignature }),
                        {
                            delay: 1000,
                            maxTry: 3,
                            onError: (err, currentTry) => {
                                this.logger.error(`${this.network} retry ${currentTry} getSignaturesForAddress ${err}`)
                            }
                        }
                    )

                    if (txs && txs.length > 0) {
                        // skip error txs
                        txs = txs.filter((tx) => !tx.err)

                        // sort slot/block asc
                        txs = txs.sort((a: any, b: any) => a.slot - b.slot)
                        const txSignatures = txs.map((t: any) => t.signature)

                        if (txs.length > 0) {
                            this.logger.info(`${this.network} ondata ${JSON.stringify(txs)}`)
                            latestSignature = txs[txs.length - 1].signature
                        }

                        for (let i = 0; i < txSignatures.length; i++) {
                            const txDetail = await retryAsync(
                                () => this.solanaConnection.getParsedTransaction(txSignatures[i], { maxSupportedTransactionVersion: 0 }),
                                {
                                    delay: 1000,
                                    maxTry: 3
                                }
                            )

                            if (txDetail) {
                                for (let j = 0; j < eventNames.length; j++) {
                                    const decodedEventName = eventNames[j]
                                    const decodeEventLog = await this.decoder.decodeEventLog(txDetail, decodedEventName)
                                    if (decodeEventLog) {
                                        const txHash = txDetail.transaction.signatures[0]
                                        const log: EventLog = {
                                            // txRaw: tx.transaction,
                                            blockNumber: Number(txDetail.slot),
                                            blockTimestamp: Number(txDetail.blockTime),
                                            txHash: txHash,
                                            txFrom: txDetail.transaction.message.accountKeys.find((k) => k.signer)?.pubkey.toString() ?? '',
                                            txTo: contractAddresses[0],
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
                    }
                } catch (error) {
                    this.logger.error(`${this.network} task ${intervalId} error ${JSON.stringify(error)}`)
                }
            }, this.interval)
        }

        // run task
        task()
    }
}

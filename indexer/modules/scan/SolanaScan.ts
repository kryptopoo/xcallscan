import { EVENT, RPC_URLS } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import { SolanaDecoder } from '../decoder/SolanaDecoder'
import solanaWeb3, { Connection, ParsedInnerInstruction, SignaturesForAddressOptions } from '@solana/web3.js'

export class SolanaScan implements IScan {
    countName: string = 'Signature'
    decoder = new SolanaDecoder()

    solanaConnection: Connection

    constructor(public network: string) {
        const rpcUrl = RPC_URLS[this.network][0]
        this.solanaConnection = new solanaWeb3.Connection(rpcUrl)
    }

    callApi(apiUrl: string, params: any): Promise<any> {
        throw new Error('Method not implemented.')
    }

    async getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }> {
        let results: EventLog[] = []

        let utilSignature: string = flag

        const addressPubkey = new solanaWeb3.PublicKey(xcallAddress)
        const options: SignaturesForAddressOptions = { limit: 100 }
        if (utilSignature != '' && utilSignature != '0') {
            options.until = utilSignature
            options.limit = 20
        }

        let txs = await this.solanaConnection.getSignaturesForAddress(addressPubkey, options)
        if (txs) {
            // skip error txs
            txs = txs.filter((tx) => !tx.err)

            // sort slot/block asc
            txs = txs.sort((a, b) => a.slot - b.slot)
            const txSignatures = txs.map((t) => t.signature)
            for (let i = 0; i < txSignatures.length; i++) {
                const txDetail = await this.solanaConnection.getParsedTransaction(txSignatures[i], { maxSupportedTransactionVersion: 0 })

                if (txDetail) {
                    const txHash = txDetail.transaction.signatures[0]

                    let eventNames = [eventName]
                    if (!eventName) eventNames = Object.values(EVENT)
                    for (let j = 0; j < eventNames.length; j++) {
                        const decodeEventLog = await this.decoder.decodeEventLog(txDetail, eventNames[j])
                        if (decodeEventLog) {
                            const log: EventLog = {
                                // txRaw: tx.transaction,
                                blockNumber: Number(txDetail.slot),
                                blockTimestamp: Number(txDetail.blockTime),
                                txHash: txHash,
                                txFrom: txDetail.transaction.message.accountKeys.find((k) => k.signer)?.pubkey.toString() ?? '',
                                txTo: xcallAddress,
                                txFee: txDetail.meta?.fee.toString(),
                                // // txValue: tx.value.toString(),
                                eventName: eventNames[j],
                                eventData: decodeEventLog
                            }
                            results.push(log)
                        }
                    }
                }
            }
        }

        const lastFlag = txs && txs.length > 0 ? txs[txs.length - 1].signature : utilSignature

        return { lastFlag: lastFlag, eventLogs: results }
    }
}

import { API_KEY, API_URL, CONTRACT, EVENT, RPC_URLS, WEB3_ALCHEMY_API_KEY } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import logger from '../logger/logger'
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
            // sort slot/block asc
            txs = txs.sort((a, b) => a.slot - b.slot)
            const txSignatures = txs.map((t) => t.signature)
            for (let i = 0; i < txSignatures.length; i++) {
                const txDetail = await this.solanaConnection.getParsedTransaction(txSignatures[i], { maxSupportedTransactionVersion: 0 })

                if (txDetail) {
                    const txHash = txDetail.transaction.signatures[0]

                    // combine instructions and innnerInstructions
                    let instructions =
                        txDetail.transaction.message?.instructions.map((i: any) => ({
                            programId: i.programId,
                            data: i.data
                        })) ?? []
                    if (txDetail.meta?.innerInstructions && txDetail.meta?.innerInstructions.length > 0) {
                        instructions = instructions.concat(
                            (txDetail.meta?.innerInstructions as ParsedInnerInstruction[])[0].instructions.map((i: any) => ({
                                programId: i.programId,
                                data: i.data
                            }))
                        )
                    }
                    instructions = instructions.filter((i) => i.data != undefined && i.data != null)

                    // check logMessages
                    const logMessages = txDetail.meta?.logMessages ?? []

                    // TODO: verify the logic if correct
                    eventName = ''
                    if (
                        logMessages.filter(
                            (l) =>
                                l.includes(`Instruction: DepositNative`) ||
                                l.includes(`Instruction: SendCall`) ||
                                l.includes(`Instruction: SendMessage`)
                        ).length > 0
                    ) {
                        eventName = EVENT.CallMessageSent
                        console.log(i, `logMessages ${eventName}`, logMessages)
                    }
                    if (logMessages.filter((l) => l.includes(`Instruction: ExecuteRollback`)).length > 0) {
                        eventName = EVENT.RollbackExecuted
                        console.log(i, `logMessages ${eventName}`, logMessages)
                    }

                    if (logMessages.filter((l) => l.includes(`Instruction: ExecuteCall`)).length > 0) {
                        eventName = EVENT.CallExecuted
                        console.log(i, `logMessages ${eventName}`, logMessages)
                    }

                    const decodeEventLog = await this.decoder.decodeEventLog(instructions, eventName)
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
                            eventName: eventName,
                            eventData: decodeEventLog
                        }
                        results.push(log)
                    }
                }
            }
        }

        const lastFlag = txs && txs.length > 0 ? txs[txs.length - 1].signature : utilSignature

        return { lastFlag: lastFlag, eventLogs: results }
    }
}

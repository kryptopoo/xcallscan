import { EVENT, RPC_URLS } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import logger from '../logger/logger'
import AxiosCustomInstance from './AxiosCustomInstance'
import { SuiDecoder } from '../decoder/SuiDecoder'

export class SuiVisionScan implements IScan {
    countName: string = 'NextCursor'

    decoder: SuiDecoder = new SuiDecoder()

    constructor(public network: string) {}

    async callApi(apiUrl: string, postData: any): Promise<any> {
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()
            const res = await axiosInstance.post(apiUrl, postData)
            return res.data.result
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${apiUrl} ${error.code}`)
        }

        return { data: [], nextCursor: undefined }
    }

    async getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }> {
        let results: EventLog[] = []

        let nextCursor: string = flag

        const rpcUrl = RPC_URLS[this.network][0]
        const postData = {
            jsonrpc: '2.0',
            id: 8,
            method: 'suix_queryTransactionBlocks',
            params: [
                {
                    filter: {
                        InputObject: xcallAddress
                    },
                    options: {
                        showBalanceChanges: true,
                        showEffects: true,
                        showEvents: true,
                        showInput: true
                    }
                },
                nextCursor && nextCursor != '0' ? nextCursor : null,
                20,
                false
            ]
        }

        const txsRes = await this.callApi(rpcUrl, postData)
        const txs = txsRes.data
        const lastFlag = txsRes.nextCursor ?? undefined

        if (txs) {
            for (let i = 0; i < txs.length; i++) {
                const tx = txs[i]

                if (tx) {
                    const eventsOfTxDetail: any[] = tx.events ?? []
                    const txFee = tx.effects.gasUsed.storageCost - tx.effects.gasUsed.storageRebate + tx.effects.gasUsed.computationCost

                    let eventNames = [eventName]
                    if (!eventName) eventNames = Object.values(EVENT)

                    for (let z = 0; z < eventNames.length; z++) {
                        const eventName = eventNames[z]
                        const eventLog: any = eventsOfTxDetail.find((e) => {
                            // e.g: e.type = 0x25f664e39077e1e7815f06a82290f2aa488d7f5139913886ad8948730a98977d::main::CallMessage
                            const eventNameOfTx = e.type.split('::').pop()
                            return eventName === eventNameOfTx
                        })
                        const decodeEventLog = await this.decoder.decodeEventLog(eventLog?.parsedJson, eventName)

                        if (decodeEventLog) {
                            const log: EventLog = {
                                // txRaw: tx.transaction,
                                blockNumber: Number(tx.checkpoint),
                                blockTimestamp: Math.floor(new Date(Number(tx.timestampMs)).getTime() / 1000),
                                txHash: tx.digest,
                                txFrom: tx.transaction.data.sender,
                                // recipient could be empty
                                txTo: tx.balanceChanges.find((b: any) => b.owner.AddressOwner != tx.transaction.data.sender)?.owner.AddressOwner,
                                txFee: txFee.toString(),
                                // txValue: tx.value.toString(),
                                eventName: eventName,
                                eventData: decodeEventLog
                            }

                            results.push(log)
                        }
                    }
                }
            }
        }

        return { lastFlag: lastFlag, eventLogs: results }
    }
}

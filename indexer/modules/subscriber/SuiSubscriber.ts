import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import {
    API_KEY,
    API_URL,
    CONTRACT,
    EVENT,
    NETWORK,
    RPC_URL,
    RPC_URLS,
    SUBSCRIBER_INTERVAL,
    WEB3_BLOCKVISION_API_KEY,
    WSS
} from '../../common/constants'
import { subscriberLogger as logger } from '../logger/logger'
import { EventLog, EventLogData } from '../../types/EventLog'
import AxiosCustomInstance from '../scan/AxiosCustomInstance'
import { SuiDecoder } from '../decoder/SuiDecoder'
import { retryAsync } from 'ts-retry'

export class SuiSubscriber implements ISubscriber {
    network: string = NETWORK.SUI
    rpcUrl: string
    decoder: SuiDecoder
    interval = SUBSCRIBER_INTERVAL
    contractAddress: string

    async queryTxBlocks(nextCursor: string, descendingOrder: boolean, limit: number = 20): Promise<any> {
        const postData = {
            jsonrpc: '2.0',
            id: 8,
            method: 'suix_queryTransactionBlocks',
            params: [
                {
                    filter: {
                        InputObject: this.contractAddress
                    },
                    options: {
                        showBalanceChanges: true,
                        showEffects: true,
                        showEvents: true,
                        showInput: true
                    }
                },
                nextCursor && nextCursor != '0' ? nextCursor : null,
                limit,
                descendingOrder
            ]
        }

        try {
            const axiosInstance = AxiosCustomInstance.getInstance()

            const res = await axiosInstance.post(this.rpcUrl, postData)

            return res.data.result
        } catch (error: any) {
            logger.error(`${this.network} called api failed ${this.rpcUrl} ${error.code}`)
        }

        return { data: [], nextCursor: undefined }
    }

    constructor() {
        this.rpcUrl = `${RPC_URLS[this.network].find((u) => u.includes('blockvision'))}/${WEB3_BLOCKVISION_API_KEY}`
        this.contractAddress = CONTRACT[this.network].xcall[0]
        this.decoder = new SuiDecoder()
    }

    async subscribe(callback: ISubscriberCallback): Promise<void> {
        logger.info(`${this.network} connect ${this.rpcUrl}`)
        logger.info(`${this.network} listen events on ${JSON.stringify(this.contractAddress)}`)

        const res = await retryAsync(
            async () => {
                return await this.queryTxBlocks('', true, 1)
            },
            { delay: 1000, maxTry: 3 }
        )
        let nextCursor = res.nextCursor
        logger.info(`${this.network} nextCursor ${nextCursor}`)

        const task = () => {
            const intervalId = setInterval(async () => {
                try {
                    const txsRes = await retryAsync(
                        async () => {
                            return this.queryTxBlocks(nextCursor, false)
                        },
                        { delay: 1000, maxTry: 3 }
                    )

                    if (txsRes?.nextCursor) nextCursor = txsRes.nextCursor

                    const txs = txsRes?.data?.filter((t: any) => t.events?.length > 0) ?? []
                    if (txs.length > 0) logger.info(`${this.network} ondata ${txs}`)

                    for (let i = 0; i < txs.length; i++) {
                        const tx = txs[i]
                        if (tx) {
                            const eventsOfTxDetail: any[] = tx.events ?? []
                            const eventNames = Object.values(EVENT)
                            for (let j = 0; j < eventNames.length; j++) {
                                const eventName = eventNames[j]
                                const eventLog: any = eventsOfTxDetail.find((e) => {
                                    // e.g: e.type = 0x25f664e39077e1e7815f06a82290f2aa488d7f5139913886ad8948730a98977d::main::CallMessage
                                    const eventNameOfTx = e.type.split('::').pop()
                                    return eventName === eventNameOfTx
                                })
                                const decodeEventLog = await this.decoder.decodeEventLog(eventLog?.parsedJson, eventName)

                                if (decodeEventLog) {
                                    const txFee =
                                        tx.effects.gasUsed.storageCost - tx.effects.gasUsed.storageRebate + tx.effects.gasUsed.computationCost
                                    const log: EventLog = {
                                        // txRaw: tx.transaction,
                                        blockNumber: Number(tx.checkpoint),
                                        blockTimestamp: Math.floor(new Date(Number(tx.timestampMs)).getTime() / 1000),
                                        txHash: tx.digest,
                                        txFrom: tx.transaction.data.sender,
                                        // recipient could be empty
                                        txTo: tx.balanceChanges.find((b: any) => b.owner.AddressOwner != tx.transaction.data.sender)?.owner
                                            .AddressOwner,
                                        txFee: txFee.toString(),
                                        // txValue: tx.value.toString(),
                                        eventName: eventName,
                                        eventData: decodeEventLog
                                    }

                                    callback(log)
                                }
                            }
                        }
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

import logger from '../logger/logger'
import { Db } from '../../data/Db'
import { BTP_NETWORK_ID, INTENTS_EVENT, MSG_STATUS, NETWORK } from '../../common/constants'
import { EventLog, IntentsEventLogData } from '../../types/EventLog'
import { EventModel, MessageModel } from '../../types/DataModels'
import { sleep } from '../../common/helper'

export class IntentsFetcher {
    private _db = new Db()

    constructor() {}

    getNetwork(btpNetworkId: string | undefined) {
        if (btpNetworkId) {
            for (const [key, value] of Object.entries(BTP_NETWORK_ID)) {
                if (value == btpNetworkId) return key
            }
        }

        return undefined
    }

    async storeDb(network: string, data: EventLog) {
        if (data) {
            const eventData = data.eventData as IntentsEventLogData
            const srcNetwork = this.getNetwork(eventData.srcNID) ?? network
            const destNetwork = this.getNetwork(eventData.dstNID) ?? network
            const intentsOrderId = eventData.id ?? 0
            const intentsOrderDetail = eventData

            //  SwapIntent | SwapOrder
            if (data.eventName == INTENTS_EVENT.SwapIntent || data.eventName == INTENTS_EVENT.SwapOrder) {
                const intentsMsg: MessageModel = {
                    sn: 0,
                    status: MSG_STATUS.Pending,
                    src_network: srcNetwork,
                    src_block_number: data.blockNumber,
                    src_block_timestamp: data.blockTimestamp,
                    src_tx_hash: data.txHash,
                    dest_network: destNetwork,
                    fee: data.txFee,
                    value: data.txValue,

                    synced: false,

                    intents_order_id: intentsOrderId,
                    intents_order_detail: JSON.stringify(intentsOrderDetail)
                }

                await this._db.insertIntentsMessage(intentsMsg)
            }

            // OrderFilled
            if (data.eventName == INTENTS_EVENT.OrderFilled) {
                await this._db.updateIntentsMessageOrderFilled(
                    intentsOrderId,
                    srcNetwork,
                    destNetwork,
                    data.blockNumber,
                    data.blockTimestamp,
                    data.txHash
                )
            }

            // OrderClosed
            if (data.eventName == INTENTS_EVENT.OrderClosed) {
                // wait updating OrderFilled
                if (srcNetwork == destNetwork) {
                    // no OrderFilled event in this case
                    await this._db.updateIntentsMessageOrderFilled(
                        intentsOrderId,
                        srcNetwork,
                        destNetwork,
                        data.blockNumber,
                        data.blockTimestamp,
                        data.txHash
                    )
                    
                    await sleep(1000)
                }

                await this._db.updateIntentsMessageOrderClosed(intentsOrderId, srcNetwork, data.blockNumber, data.blockTimestamp, data.txHash)
            }

            // OrderCancelled
            // TODO: review & test
            if (data.eventName == INTENTS_EVENT.OrderCancelled) {
                await this._db.updateIntentsMessageOrderCancelled(
                    intentsOrderId,
                    srcNetwork,
                    destNetwork,
                    data.blockNumber,
                    data.blockTimestamp,
                    data.txHash,
                    INTENTS_EVENT.OrderCancelled
                )
            }

            if (data.eventName == INTENTS_EVENT.Message) {
                // OrderCancelled: if Message emitted by calling calcel method
                if (intentsOrderId) {
                    await this._db.updateIntentsMessageOrderCancelled(
                        intentsOrderId,
                        srcNetwork,
                        destNetwork,
                        data.blockNumber,
                        data.blockTimestamp,
                        data.txHash,
                        INTENTS_EVENT.OrderCancelled
                    )
                }
            }
        }
    }
}

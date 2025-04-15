import createSubscriber, { Subscriber } from 'pg-listen'
import { analyzerLogger as logger } from '../logger/logger'
import { MsgActionParser } from '../parser/MsgActionParser'
import { MSG_STATUS, NATIVE_ASSETS } from '../../common/constants'
import { Db } from '../../data/Db'
import { convertAssetAmount, getAsset } from '../../common/helper'

import dotenv from 'dotenv'
dotenv.config()

export class Analyzer {
    private subscriber: Subscriber
    private db = new Db()

    constructor() {
        // create db listener
        const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${parseInt(
            process.env.PGPORT || '5432'
        )}/${process.env.PGDATABASE}`
        this.subscriber = createSubscriber({ connectionString: connectionString })
    }

    async start() {
        const actionParser = new MsgActionParser()

        // listen db notify
        await this.subscriber.connect()
        await this.subscriber.listenTo('message')

        this.subscriber.events.on('error', (error) => {
            logger.error(`error ${error.message}`)
        })
        this.subscriber.notifications.on('message', (data: any) => {
            try {
                // analyze msg action when msg executed
                if (data.status == MSG_STATUS.Executed && data.src_tx_hash && data.dest_tx_hash) {
                    logger.info(
                        `${data.src_network}->${data.dest_network} id:${data.id} sn:${data.sn} intents_order_id:${data.intents_order_id} src_tx_hash:${data.src_tx_hash} dest_tx_hash:${data.dest_tx_hash}`
                    )

                    // xcall message
                    if (data.sn > 0) {
                        actionParser.parseMgsAction(data.src_network, data.src_tx_hash, data.dest_network, data.dest_tx_hash).then((act) => {
                            logger.info(`id:${data.id} sn:${data.sn} intents_order_id:${data.intents_order_id} msg_action:${JSON.stringify(act)}`)

                            if (act) {
                                this.db.updateMessageAction(
                                    data.sn,
                                    data.intents_order_id,
                                    data.src_network,
                                    data.dest_network,
                                    act.type,
                                    JSON.stringify(act.detail),
                                    act.amount_usd
                                )
                            }
                        })
                    }

                    // intents order
                    if (data.intents_order_id > 0 && data.intents_order_detail) {
                        const intentsOrderDetail = JSON.parse(data.intents_order_detail)
                        const srcToken = intentsOrderDetail.token.split('::').pop() as string
                        const destToken = intentsOrderDetail.toToken.split('::').pop() as string
                        logger.info(
                            `${data.src_network}->${data.dest_network} id:${data.id} sn:${data.sn} intents_order_id:${
                                data.intents_order_id
                            } intentsOrderDetail:${JSON.stringify(intentsOrderDetail)}`
                        )

                        const src_network = data.src_network
                        const src_asset_symbol =
                            srcToken == '0x0000000000000000000000000000000000000000'
                                ? NATIVE_ASSETS[src_network]
                                : getAsset(src_network, srcToken)?.symbol ?? srcToken
                        const src_amount = convertAssetAmount(src_asset_symbol, intentsOrderDetail.amount)

                        const dest_network = data.dest_network
                        const dest_asset_symbol =
                            destToken == '0x0000000000000000000000000000000000000000'
                                ? NATIVE_ASSETS[dest_network]
                                : getAsset(dest_network, destToken)?.symbol ?? destToken

                        const dest_amount = convertAssetAmount(dest_asset_symbol, intentsOrderDetail.toAmount)

                        const act = {
                            type: 'SwapIntent',
                            amount_usd: '0',
                            detail: {
                                type: 'SwapIntent',
                                src_network: src_network,
                                src_asset: { name: src_asset_symbol, symbol: src_asset_symbol },
                                src_amount: src_amount,
                                dest_network: dest_network,
                                dest_asset: { name: dest_asset_symbol, symbol: dest_asset_symbol },
                                dest_amount: dest_amount
                            }
                        }
                        logger.info(
                            `${data.src_network}->${data.dest_network} id:${data.id} sn:${data.sn} intents_order_id:${
                                data.intents_order_id
                            } msg_action:${JSON.stringify(act)}`
                        )

                        this.db.updateMessageAction(
                            data.sn,
                            data.intents_order_id,
                            data.src_network,
                            data.dest_network,
                            act.type,
                            JSON.stringify(act.detail),
                            act.amount_usd
                        )
                    }
                }
            } catch (error) {
                logger.error(`on message error ${JSON.stringify(error)}`)
            }
        })
    }
}

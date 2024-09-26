import createSubscriber, { Subscriber } from 'pg-listen'
import { analyzerLogger as logger } from '../logger/logger'
import { MsgActionParser } from '../parser/MsgActionParser'
import { MSG_STATUS } from '../../common/constants'
import { Db } from '../../data/Db'

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
                    logger.info(`id:${data.id} sn:${data.sn} ${data.src_network} ${data.src_tx_hash} -> ${data.dest_network} ${data.dest_tx_hash}`)

                    actionParser.parseMgsAction(data.src_network, data.src_tx_hash, data.dest_network, data.dest_tx_hash).then((act) => {
                        logger.info(`id:${data.id} sn:${data.sn} msg_action: ${JSON.stringify(act)}`)

                        if (act) {
                            this.db.updateMessageAction(
                                data.sn,
                                data.src_network,
                                data.dest_network,
                                act.type,
                                JSON.stringify(act.detail),
                                act.amount_usd
                            )
                        }
                    })
                }
            } catch (error) {
                logger.error(`on message error ${JSON.stringify(error)}`)
            }
        })
    }
}

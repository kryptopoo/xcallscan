import createSubscriber, { Subscriber } from 'pg-listen'
import { analyzerLogger as logger } from '../logger/logger'
import { MsgActionParser } from '../parser/MsgActionParser'
import { MSG_STATUS } from '../../common/constants'
import dotenv from 'dotenv'
dotenv.config()

export class Analyzer {
    private subscriber: Subscriber

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
            // analyze msg action when msg executed
            if (data.status == MSG_STATUS.Executed && data.src_tx_hash && data.dest_tx_hash) {
                logger.info(`id:${data.id} sn:${data.sn} ${data.src_network} ${data.src_tx_hash} -> ${data.dest_network} ${data.dest_tx_hash}`)
                actionParser.parseMgsAction(data.src_network, data.src_tx_hash, data.dest_network, data.dest_tx_hash).then((act) => {
                    logger.info(`msg action: ${JSON.stringify(act)}`)
                })
            }
        })
    }
}

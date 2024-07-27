import createSubscriber, { Subscriber } from 'pg-listen'
import { WebSocketServer } from 'ws'
import logger from '../logger/logger'
import dotenv from 'dotenv'
dotenv.config()

export class Ws {
    private wss: WebSocketServer
    private subscriber: Subscriber

    constructor(public port: number = 8080) {
        // create db listener
        const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${parseInt(
            process.env.PGPORT || '5432'
        )}/${process.env.PGDATABASE}`
        this.subscriber = createSubscriber({ connectionString: connectionString })

        // init ws server
        this.wss = new WebSocketServer({ port: port })
    }

    async start() {
        // listen db notify
        await this.subscriber.connect()
        await this.subscriber.listenTo('message')

        // Creating connection using websocket
        this.wss.on('connection', (ws) => {
            logger.info(`ws: new client connected`)

            // handling close connection
            ws.onclose = function () {
                logger.info(`ws: client closed connection`)
            }

            // handling client connection error
            ws.onerror = function (error) {
                logger.error(error.message)
            }

            // emit message
            this.subscriber.notifications.on('message', async (data: any) => {
                ws.send(JSON.stringify(data))

                logger.info(`ws: send ${JSON.stringify(data)}`)
            })
        })

        logger.info(`ws: the websocket server is running on port ${this.port}`)
    }
}

import createSubscriber, { Subscriber } from 'pg-listen'
import { createServer, Server } from 'http'
import { WebSocketServer } from 'ws'
import logger from '../logger/logger'
import dotenv from 'dotenv'
dotenv.config()

export class Ws {
    private wss: WebSocketServer
    private server: Server
    private subscriber: Subscriber

    constructor(public port: number = 8080) {
        // create db listener
        const connectionString = `postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${parseInt(
            process.env.PGPORT || '5432'
        )}/${process.env.PGDATABASE}`
        this.subscriber = createSubscriber({ connectionString: connectionString })

        // init ws server
        // this.wss = new WebSocketServer({ port: port })
        this.wss = new WebSocketServer({ noServer: true })

        // init server
        this.server = createServer()
    }

    async start() {
        const wss = this.wss

        // listen db notify
        await this.subscriber.connect()
        await this.subscriber.listenTo('message')

        this.subscriber.events.on('error', (error) => {
            logger.error(`[ws] subscriber error ${error.message}`)
        })
        this.subscriber.notifications.on('message', (data: any) => {
            logger.info(`[ws] subscriber message ${JSON.stringify(data)}`)
            broadcast(data)
        })

        const broadcast = (data: any) => {
            logger.info(`[ws] broadcast to ${wss.clients.size} clients`)
            let clientIndex = 0
            wss.clients.forEach((client) => {
                clientIndex += 1
                if (client.readyState === client.OPEN) {
                    client.send(JSON.stringify(data))
                    logger.info(`[ws] send client ${clientIndex} ${JSON.stringify(data)}`)
                }
            })
        }

        // Creating connection using websocket
        wss.on('connection', (ws) => {
            logger.info(`[ws] new client connected, total clients ${wss.clients.size}`)

            // handling close connection
            ws.onclose = function () {
                logger.info(`[ws] client closed connection, total clients ${wss.clients.size}`)
            }

            // handling client connection error
            ws.onerror = function (error) {
                logger.error(`[ws] error ${error.message}`)
            }
        })

        // websocket authentication
        this.server.on('upgrade', function upgrade(request, socket, head) {
            // handle whitelist IPs
            const whitelistIPs: string[] = process.env.WS_WHITELIST_IPS?.split(';') || []
            const ipAddr = request.socket.remoteAddress?.split(':').pop() || ''
            logger.info(`[ws] request from IP ${ipAddr}`)
            if (whitelistIPs.length > 0 && !whitelistIPs.includes(ipAddr)) {
                logger.error(`[ws] access denied IP ${ipAddr}`)
                socket.write('HTTP/1.1 401 Unauthorized')
                socket.destroy()
                return
            }

            wss.handleUpgrade(request, socket, head, function done(ws) {
                wss.emit('connection', ws, request)
            })
        })

        this.server.listen(this.port)
        logger.info(`[ws] the websocket server is running on port ${this.port}`)
    }
}

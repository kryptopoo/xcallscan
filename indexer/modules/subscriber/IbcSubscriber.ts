import { WebSocket } from 'ws'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, NETWORK, RPC_URLS, WSS } from '../../common/constants'
import logger from '../logger/logger'
const { v4: uuidv4 } = require('uuid')

export class IbcSubscriber implements ISubscriber {
    ws!: WebSocket
    wsQuery: any

    constructor(public network: string, public contractAddress: string) {}

    subscribe(callback: ISubscriberCallback) {
        try {
            logger.info(`[subscriber] ${this.network} connecting ${WSS[this.network]}...`)
            logger.info(`[subscriber] ${this.network} listening events on contract ${this.contractAddress}....`)

            // Open a new WebSocket connection to the specified URL.
            this.ws = new WebSocket(WSS[this.network])

            // Define the subscription request. It asks for transactions where the recipient address, and checks for transactions to be published.
            this.wsQuery = {
                jsonrpc: '2.0',
                method: 'subscribe',
                id: uuidv4().toString(),
                params: {
                    query: `tm.event = 'Tx' AND wasm._contract_address = '${this.contractAddress}'`
                }
            }
            // When the WebSocket connection is established, send the subscription request.
            this.ws.on('open', () => {
                logger.info(`[subscriber] ${this.network} onopen`)
                this.ws.send(JSON.stringify(this.wsQuery))
            })
            // When a message (i.e., a matching transaction) is received, log the transaction and close the WebSocket connection.
            this.ws.on('message', (event: any) => {
                // logger.info(`[subscriber] ${this.network} onmessage ${JSON.stringify(event)}`)
                const eventData = JSON.parse(event)
                if (eventData && eventData.result && eventData.result.data) {
                    logger.info(`[subscriber] ${this.network} eventData ${JSON.stringify(eventData.result.data)}`)
                    // this.disconnectFromWebsocket()

                    callback(eventData.result.data)
                }
            })
            // If an error occurs with the WebSocket, log the error and close the WebSocket connection.
            this.ws.on('error', (error: any) => {
                logger.error(`[subscriber] ${this.network} error ${JSON.stringify(error)}`)
                this.disconnectFromWebsocket()
            })
        } catch (err) {
            // If an error occurs when trying to connect or subscribe, log the error and close the WebSocket connection.
            logger.error(`[subscriber] ${this.network} error ${JSON.stringify(err)}`)
            this.disconnectFromWebsocket()
        }
    }

    disconnectFromWebsocket() {
        logger.info(`[subscriber] ${this.network} disconnectFromWebsocket`)
        // If the WebSocket isn't open, exit the function.
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return
        // Send an 'unsubscribe' message to the server.
        this.ws.send(JSON.stringify({ ...this.wsQuery, method: 'unsubscribe' }))
        // Close the WebSocket connection.
        this.ws.close()
    }
}

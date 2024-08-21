import { WebSocket } from 'ws'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'
import { CONTRACT, EVENT, NETWORK, RPC_URL, RPC_URLS, WSS } from '../../common/constants'
import logger from '../logger/logger'
import { IbcDecoder } from '../decoder/IbcDecoder'
import { v4 as uuidv4 } from 'uuid'
import { toHex } from '@cosmjs/encoding'
import { sha256 } from '@cosmjs/crypto'
import { StargateClient } from '@cosmjs/stargate'
import { EventLogData } from '../../types/EventLog'
import { IDecoder } from '../../interfaces/IDecoder'

export class IbcSubscriber implements ISubscriber {
    ws!: WebSocket
    wsQuery: any
    decoder: IDecoder
    contractAddress: string

    constructor(public network: string) {
        this.contractAddress = CONTRACT[this.network].xcall[0]
        this.decoder = new IbcDecoder()
    }

    private getEventName(events: any[]) {
        if (
            events.find((e) => {
                return e.type == `wasm-${EVENT.CallMessageSent}`
            })
        )
            return EVENT.CallMessageSent
        if (
            events.find((e) => {
                return e.type == `wasm-${EVENT.CallMessage}`
            })
        )
            return EVENT.CallMessage
        if (
            events.find((e) => {
                return e.type == `wasm-${EVENT.CallExecuted}`
            })
        )
            return EVENT.CallExecuted
        if (
            events.find((e) => {
                return e.type == `wasm-${EVENT.ResponseMessage}`
            })
        )
            return EVENT.ResponseMessage
        if (
            events.find((e) => {
                return e.type == `wasm-${EVENT.RollbackMessage}`
            })
        )
            return EVENT.RollbackMessage
        if (
            events.find((e) => {
                return e.type == `wasm-${EVENT.RollbackExecuted}`
            })
        )
            return EVENT.RollbackExecuted

        return ''
    }

    private buildEventLog(block: any, tx: any, eventName: string, eventData: EventLogData) {
        const sender = (
            tx.events.find((e: any) => e.type == 'message' && e.attributes.filter((a: any) => a.key == 'sender').length > 0)['attributes'] as any[]
        ).find((a) => a.key == 'sender').value as string
        const contractAddress = (
            tx.events.find((e: any) => e.type == 'execute' && e.attributes.filter((a: any) => a.key == '_contract_address').length > 0)[
                'attributes'
            ] as any[]
        ).find((a) => a.key == '_contract_address').value as string
        const fee = (
            tx.events.find((e: any) => e.type == 'tx' && e.attributes.filter((a: any) => a.key == 'fee').length > 0)['attributes'] as any[]
        ).find((a) => a.key == 'fee').value as string

        return {
            // txRaw: tx.raw_log,
            blockNumber: Number(tx.height),
            blockTimestamp: Math.floor(new Date(block.header.time).getTime() / 1000),
            txHash: tx.hash,
            txFrom: sender ?? '',
            txTo: contractAddress ?? '',
            txFee: fee.replace('inj', '').replace('arch', '').replace('ntrn', ''),
            // txValue: msgExecuteContract.msg?.cross_transfer?.amount || msgExecuteContract.msg?.deposit?.amount || '0',
            eventName: eventName,
            eventData: eventData
        }
    }

    subscribe(callback: ISubscriberCallback) {
        try {
            logger.info(`[subscriber] ${this.network} connect ${WSS[this.network]}`)
            logger.info(`[subscriber] ${this.network} listen events on ${this.contractAddress}`)

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
                logger.info(`[subscriber] ${this.network} ws open sending the subscription request`)
                this.ws.send(JSON.stringify(this.wsQuery))
            })
            // When a message (i.e., a matching transaction) is received, log the transaction and close the WebSocket connection.
            this.ws.on('message', async (event: any) => {
                // logger.info(`[subscriber] ${this.network} onmessage ${JSON.stringify(event)}`)
                const eventData = JSON.parse(event)
                if (eventData && eventData.result && eventData.result.data) {
                    logger.info(`[subscriber] ${this.network} eventData ${JSON.stringify(eventData.result.data)}`)
                    // this.disconnectFromWebsocket()

                    const events = eventData.result.data.value.TxResult.result.events as any[]
                    const eventName = this.getEventName(events)
                    const eventLogData = await this.decoder.decodeEventLog(events, eventName)
                    logger.info(`[subscriber] ${this.network} ${eventName} decodeEventLog ${JSON.stringify(eventLogData)}`)

                    if (eventLogData) {
                        const txRaw = eventData.result.data.value.TxResult.tx
                        const txHash = toHex(sha256(Buffer.from(txRaw, 'base64')))
                        console.log(`[subscriber] ${this.network} txHash ${txHash}`)

                        const client = await StargateClient.connect(RPC_URL[this.network])
                        const tx = await client.getTx(txHash)
                        if (tx) {
                            const block = await client.getBlock(tx?.height)
                            console.log(`[subscriber] ${this.network} tx.events ${JSON.stringify(tx?.events)}`)

                            const eventLog = this.buildEventLog(block, tx, eventName, eventLogData)
                            callback(eventLog)
                        }
                    }
                }
            })
            // If an error occurs with the WebSocket, log the error and close the WebSocket connection.
            this.ws.on('error', (error: any) => {
                logger.error(`[subscriber] ${this.network} error ${JSON.stringify(error)}`)
                this.disconnectFromWebsocket()
            })
            this.ws.on('close', (code, reason) => {
                logger.error(`[subscriber] ${this.network} close ${code} ${reason}`)
                this.disconnectFromWebsocket()
            })
            this.ws.on('ping', (data) => {
                // logger.error(`[subscriber] ${this.network} ping ${JSON.stringify(data)}`)
            })
            this.ws.on('pong', (data) => {
                logger.error(`[subscriber] ${this.network} pong ${JSON.stringify(data)}`)
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

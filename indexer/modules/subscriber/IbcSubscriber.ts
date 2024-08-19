// import { WebSocket } from 'ws'

// import { ContractInterface, ethers } from 'ethers'
// import { ISubscriber } from '../../interfaces/ISubcriber'
// import { CONTRACT, NETWORK, RPC_URLS } from '../../common/constants'
// import logger from '../logger/logger'

// export class IbcSubscriber implements ISubscriber {
//     contract: ethers.Contract
//     provider: ethers.providers.StaticJsonRpcProvider

//     constructor(network: string, contract: string, abi: ContractInterface) {
//         this.contract = new ethers.Contract(contract, abi)
//         this.provider = new ethers.providers.StaticJsonRpcProvider(`https://arb-mainnet.g.alchemy.com/v2/4Ltbkjw0YnmYVrzphnEPUKeYjuADwzGf`)
//         this.provider.pollingInterval = 10000
//     }

//     subscribe(eventNames: string[]) {
//         logger.info(`[subscriber]: listen events....`)

//         const topics = [
//             ethers.utils.id('CallMessageSent(address,string,uint256)'),
//             ethers.utils.id('CallMessage(string,string,uint256,uint256,bytes)'),
//             ethers.utils.id('CallExecuted(uint256,int256,string)'),
//             ethers.utils.id('ResponseMessage(uint256,int256)'),
//             ethers.utils.id('RollbackMessage(uint256)'),
//             ethers.utils.id('RollbackExecuted(uint256)')
//         ]
//         const filter = {
//             address: this.contract.address,
//             topics: topics
//         }
//         this.provider.on(filter, (log: any, event: any) => {
//             // Emitted whenever a DAI token transfer occurs
//             logger.info(`event: ${JSON.stringify(event)}`)
//             logger.info(`log: ${JSON.stringify(log)}`)
//         })

//         // this.contract.on("CallMessageSent", (_from, _to, _sn) => {
//         // })

//         // this.contract.on("CallMessage", (_from, _to, _sn, _data) => {
//         // })
//     }
// }

// // const network = NETWORK.ARBITRUM
// // const contract = CONTRACT[network].xcall[0]
// // const abi = require('./../../abi/xcall.abi.json')
// // const subscriber = new IbcSubscriber(network, contract, abi)
// // subscriber.subscribe([])

// // Initialize websocket and wsQuery variables.
// let websocket: any
// let wsQuery: any

// // Import the UUID library to generate a unique ID for each subscription request.
// const { v4: uuidv4 } = require('uuid')
// // Define the address that is checked in the transactions.
// const network = NETWORK.IBC_ARCHWAY
// const address = 'archway19hzhgd90etqc3z2qswumq80ag2d8het38r0al0r4ulrly72t20psdrpna6'
// logger.info('address ' + address)
// // Initialize websocket and wsQuery variables.

// const queryForBalanceUpdate = () => {
//     try {
//         // Open a new WebSocket connection to the specified URL.
//         websocket = new WebSocket('wss://rpc.constantine.archway.io:443/websocket')

//         // Define the subscription request. It asks for transactions where the recipient address, and checks for transactions to be published.
//         wsQuery = {
//             jsonrpc: '2.0',
//             method: 'subscribe',
//             id: uuidv4().toString(),
//             params: {
//                 query: `tm.event = 'Tx' AND wasm EXISTS AND wasm._contract_address = '${address}'`
//             }
//         }
//         // When the WebSocket connection is established, send the subscription request.
//         websocket.on('open', () => {
//             logger.info('websocket open')
//             websocket.send(JSON.stringify(wsQuery))
//         })
//         // When a message (i.e., a matching transaction) is received, log the transaction and close the WebSocket connection.
//         websocket.on('message', (event: any) => {
//             const eventData = JSON.parse(event)
//             if (eventData && eventData.result && eventData.result.data) {
//                 logger.info('Matching transaction found' + JSON.stringify(eventData.result.data))
//                 disconnectFromWebsocket()
//             }
//         })
//         // If an error occurs with the WebSocket, log the error and close the WebSocket connection.
//         websocket.on('error', (error: any) => {
//             logger.error(error)
//             disconnectFromWebsocket()
//         })
//     } catch (err) {
//         // If an error occurs when trying to connect or subscribe, log the error and close the WebSocket connection.
//         logger.error(err)
//         disconnectFromWebsocket()
//     }
// }
// // This function closes the WebSocket connection and resets the websocket and wsQuery variables.
// const disconnectFromWebsocket = () => {
//     // If the WebSocket isn't open, exit the function.
//     if (!websocket || websocket.readyState !== WebSocket.OPEN) return
//     // Send an 'unsubscribe' message to the server.
//     websocket.send(JSON.stringify({ ...wsQuery, method: 'unsubscribe' }))
//     // Close the WebSocket connection.
//     websocket.close()
//     // Reset the websocket and wsQuery variables.
//     websocket = null
//     wsQuery = null
// }

// // Start the process by calling the queryForBalanceUpdate function.
// queryForBalanceUpdate()

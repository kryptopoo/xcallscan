// import { ContractInterface, ethers } from 'ethers'
// import { ISubscriber } from '../../interfaces/ISubcriber'
// import { CONTRACT, NETWORK, RPC_URLS } from '../../common/constants'
// import logger from '../logger/logger'

// export class EvmSubscriber implements ISubscriber {
//     private contract: ethers.Contract
//     private provider: ethers.providers.StaticJsonRpcProvider

//     constructor(public network: string, public contractAddress: string, abi: ContractInterface) {
//         this.contract = new ethers.Contract(contractAddress, abi)
//         this.provider = new ethers.providers.StaticJsonRpcProvider(
//             `https://ava-mainnet.blastapi.io/70992bb6-1518-445c-88ec-5cd69f0754b3/ext/bc/C/rpc`
//         )
//         this.provider.pollingInterval = 10000
//     }

//     subscribe(eventNames: string[]) {
//         logger.info(`[subscriber] ${network} listen events....`)

//         const topics = [
//             [
//                 ethers.utils.id('CallMessageSent(address,string,uint256)'),
//                 ethers.utils.id('CallMessage(string,string,uint256,uint256,bytes)'),
//                 ethers.utils.id('CallExecuted(uint256,int256,string)'),
//                 ethers.utils.id('ResponseMessage(uint256,int256)'),
//                 ethers.utils.id('RollbackMessage(uint256)'),
//                 ethers.utils.id('RollbackExecuted(uint256)')
//             ]
//         ]
//         const filter = {
//             address: this.contractAddress,
//             topics: topics
//         }
//         this.provider.on(filter, (log: any, event: any) => {
//             // Emitted whenever a DAI token transfer occurs
//             logger.info(`[subscriber] ${network} event: ${JSON.stringify(event)}`)
//             logger.info(`[subscriber] ${network} log: ${JSON.stringify(log)}`)
//         })

//         // this.contract.on("CallMessageSent", (_from, _to, _sn) => {
//         // })

//         // this.contract.on("CallMessage", (_from, _to, _sn, _data) => {
//         // })
//     }
// }

// const network = NETWORK.AVAX
// const contract = '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b'
// console.log('contract', contract)
// const abi = require('./../../abi/xcall.abi.json')
// const evmSubscriber = new EvmSubscriber(network, contract, abi)
// evmSubscriber.subscribe([])

// // const topic = ethers.utils.id('CallMessageSent(address,string,uint256)')
// // const topic = ethers.utils.id('CallMessage(string,string,uint256,uint256,bytes)')
// // const topic = ethers.utils.id('CallExecuted(uint256,int256,string)')
// // const topic = ethers.utils.id('ResponseMessage(uint256,int256)')
// // const topic = ethers.utils.id('RollbackMessage(uint256)')
// // const topic = ethers.utils.id('RollbackExecuted(uint256)')
// // const topic = ethers.utils.id('CallExecuted(uint256,int256,string)')

// // CallMessage (index_topic_1 string _from, index_topic_2 string _to, index_topic_3 uint256 _sn, uint256 _reqId, bytes _data)

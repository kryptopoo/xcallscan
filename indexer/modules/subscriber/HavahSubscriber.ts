// import {
//     IconService,
//     HttpProvider,
//     BlockMonitorSpec,
//     BlockNotification,
//     Monitor,
//     EventMonitorSpec,
//     EventNotification,
//     EventFilter,
//     Converter,
//     BigNumber
// } from 'icon-sdk-js'
// import { ISubscriber } from '../../interfaces/ISubcriber'
// import { CONTRACT, EVENT, NETWORK, RPC_URLS } from '../../common/constants'
// import logger from '../logger/logger'
// import { IconDecoder } from '../decoder/IconDecoder'

// export class IconSubscriber implements ISubscriber {
//     private monitor!: Monitor<EventNotification>
//     private iconService: IconService
//     private interval = 20 // block interval

//     constructor(public network: string, public contractAddress: string) {
//         const url = 'https://ctz.havah.io/api/v3'
//         const provider: HttpProvider = new HttpProvider(url)
//         this.iconService = new IconService(provider)
//     }

//     async subscribe(eventNames: string[]) {
//         logger.info(`[subscriber] ${this.network} listening events on contract ${this.contractAddress}....`)
//         const decoder = new IconDecoder()

//         const block = await this.iconService.getLastBlock().execute()
//         logger.info(`[subscriber] ${this.network} block hight ${block.height}....`)
//         const height = block.height
//         const specCallMessageSent = new EventMonitorSpec(
//             BigNumber(height),
//             new EventFilter('CallMessageSent(Address,str,int)', this.contractAddress),
//             true,
//             this.interval
//         )
//         console.log('specCallMessageSent', specCallMessageSent)
//         const specCallExecuted = new EventMonitorSpec(
//             BigNumber(height),
//             new EventFilter('CallExecuted(int,int,str)', this.contractAddress),
//             true,
//             this.interval
//         )

//         const onerror = (error: any) => {
//             logger.info(`[subscriber] ${this.network} error ${JSON.stringify(error)}`)
//         }
//         const onprogress = (height: BigNumber) => {
//             logger.info(`[subscriber] ${this.network} height ${height.toString()}`)
//         }

//         this.iconService.monitorEvent(
//             specCallMessageSent,
//             (notification: EventNotification) => {
//                 logger.info(`[subscriber] ${this.network} ${JSON.stringify(notification)}`)
//                 logger.info(`[subscriber] ${this.network} ${JSON.stringify(decoder.decodeEventLog(notification.logs[0], EVENT.CallMessageSent))}`)
//             },
//             onerror,
//             onprogress
//         )
        
//         this.iconService.monitorEvent(
//             specCallExecuted,
//             (notification: EventNotification) => {
//                 logger.info(`[subscriber] ${this.network} ${JSON.stringify(notification)}`)
//                 logger.info(`[subscriber] ${this.network} ${JSON.stringify(decoder.decodeEventLog(notification.logs[0], EVENT.CallExecuted))}`)
//             },
//             onerror,
//             onprogress
//         )
//     }
// }

// const network = NETWORK.HAVAH
// const contract = 'cx00104193d0a593c4b57fda544d1b7c88b8ed4fae'
// const subscriber = new IconSubscriber(network, contract)
// subscriber.subscribe([])

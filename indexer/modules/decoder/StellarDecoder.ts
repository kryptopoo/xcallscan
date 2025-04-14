import { ethers } from 'ethers'
import { EVENT, INTENTS_EVENT } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLogData, IntentsEventLogData } from '../../types/EventLog'
import logger from '../logger/logger'

export class StellarDecoder implements IDecoder {
    async decodeEventLog(data: any, eventName: string): Promise<EventLogData | IntentsEventLogData | undefined> {
        let rs: EventLogData | IntentsEventLogData | undefined = undefined

        if (data) {
            rs = {} as EventLogData
            // xcall
            switch (eventName) {
                case EVENT.CallMessageSent:
                    rs._from = data.from
                    rs._to = data.to
                    rs._sn = Number(data.sn)
                    rs._nsn = data?.nsn
                    rs._decodedFrom = data.from
                    rs._decodedTo = data.to

                    break
                case EVENT.ResponseMessage:
                    rs._sn = Number(data.sn)
                    rs._code = data.code

                    break
                case EVENT.RollbackMessage:
                    logger.info(`${eventName} ${JSON.stringify(data)}`)

                    // // TODO: review and parse here
                    rs._sn = Number(data.sn)
                    if (data?.data) {
                        try {
                            const dataHex = ethers.utils.hexlify(data?.data)
                            rs._data = dataHex
                        } catch (error) {}
                    }

                    break
                case EVENT.RollbackExecuted:
                    logger.info(`${eventName} ${JSON.stringify(data)}`)

                    // // TODO: review and parse here
                    rs._sn = Number(data.sn)
                    if (data.code) rs._code = data.code
                    if (data.msg) rs._msg = data.msg
                    if (data.err_msg) rs._msg = data.err_msg

                    break
                case EVENT.MessageReceived:
                    logger.info(`${eventName} ${JSON.stringify(data)}`)

                    // // TODO: parse here
                    // rs._from =
                    // rs._data =
                    // rs._decodedFrom =

                    break
                case EVENT.CallMessage:
                    rs._sn = Number(data?.sn)
                    rs._from = data?.from
                    rs._decodedFrom = rs._from
                    rs._to = data?.to
                    rs._decodedTo = data?.to
                    rs._reqId = Number(data?.reqId)

                    if (data?.data) {
                        try {
                            const dataHex = ethers.utils.hexlify(data?.data)
                            rs._data = dataHex
                        } catch (error) {}
                    }

                    break

                case EVENT.CallExecuted:
                    rs._reqId = Number(data.reqId)
                    if (data.code) rs._code = data.code
                    if (data.msg) rs._msg = data.msg

                    break
                default:
                    break
            }

            // intents
            switch (eventName) {
                case INTENTS_EVENT.SwapIntent:
                    rs = {
                        id: Number(data.id),
                        emitter: data.emitter,
                        srcNID: data.srcNID,
                        dstNID: data.dstNID,
                        creator: data.creator,
                        destinationAddress: data.destinationAddress,
                        token: data.token,
                        amount: data.amount.toString(),
                        toToken: data.toToken,
                        toAmount: data.toAmount.toString(),
                        data: data.data
                    } as IntentsEventLogData

                    break
                case INTENTS_EVENT.OrderFilled:
                    rs = {
                        id: Number(data.id),
                        srcNID: data.srcNID
                    } as IntentsEventLogData

                    // decode fill function
                    const decodedFill = data.decodedFunctions.find((f: any) => f.function == 'fill')
                    if (decodedFill) {
                        rs = {
                            id: Number(data.id),
                            emitter: decodedFill.args[0].emitter,
                            srcNID: decodedFill.args[0].src_nid,
                            dstNID: decodedFill.args[0].dst_nid,
                            creator: decodedFill.args[0].creator,
                            destinationAddress: decodedFill.args[0].destination_address,
                            token: decodedFill.args[0].token,
                            amount: Number(decodedFill.args[0].amount).toString(),
                            toToken: decodedFill.args[0].to_token,
                            toAmount: Number(decodedFill.args[0].to_amount).toString(),
                            data: decodedFill.args[0].data,

                            solverAddress: decodedFill.args[1]
                        }
                    }

                    break
                case INTENTS_EVENT.OrderClosed:
                    rs = { id: Number(data.id) } as IntentsEventLogData

                    // decode fill function
                    const decodedClose = data.decodedFunctions.find((f: any) => f.function == 'fill')
                    if (decodedClose) {
                        rs = {
                            id: Number(data.id),
                            emitter: decodedClose.args[0].emitter,
                            srcNID: decodedClose.args[0].src_nid,
                            dstNID: decodedClose.args[0].dst_nid,
                            creator: decodedClose.args[0].creator,
                            destinationAddress: decodedClose.args[0].destination_address,
                            token: decodedClose.args[0].token,
                            amount: Number(decodedClose.args[0].amount).toString(),
                            toToken: decodedClose.args[0].to_token,
                            toAmount: Number(decodedClose.args[0].to_amount).toString(),
                            data: decodedClose.args[0].data,

                            solverAddress: decodedClose.args[1]
                        }
                    }

                    break
                case INTENTS_EVENT.OrderCancelled:
                    // TODO
                    logger.error(`StellarDecoder: INTENTS_EVENT.OrderCancelled data ${JSON.stringify(data)}`)
                    rs = {
                        id: Number(data.id),
                        srcNID: data.srcNID
                    } as IntentsEventLogData

                    break
                case INTENTS_EVENT.Message:
                    // TODO
                    logger.error(`StellarDecoder: INTENTS_EVENT.Message data ${JSON.stringify(data)}`)
                    rs = {} as IntentsEventLogData

                    break
                default:
                    break
            }
        }

        return rs
    }
}

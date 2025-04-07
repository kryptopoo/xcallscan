import { ethers } from 'ethers'
import { EVENT, INTENTS_EVENT } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLogData, IntentsEventLogData } from '../../types/EventLog'

export class SuiDecoder implements IDecoder {
    async decodeEventLog(parsedJson: any, eventName: string): Promise<EventLogData | IntentsEventLogData | undefined> {
        let rs: EventLogData | IntentsEventLogData | undefined = {}

        if (parsedJson) {
            // xcall
            switch (eventName) {
                case EVENT.CallMessageSent:
                    rs = {} as EventLogData
                    rs._from = parsedJson.from
                    rs._to = parsedJson.to
                    rs._sn = Number(parsedJson.sn)
                    rs._nsn = parsedJson?.nsn
                    rs._decodedFrom = parsedJson.from
                    rs._decodedTo = parsedJson.to

                    break
                case EVENT.ResponseMessage:
                    rs = {} as EventLogData
                    rs._sn = Number(parsedJson.sn)
                    rs._code = parsedJson?.response_code

                    break
                case EVENT.RollbackMessage:
                    rs = {} as EventLogData
                    rs._sn = Number(parsedJson.sn)
                    if (parsedJson?.data) {
                        const dataHex = ethers.utils.hexlify(parsedJson?.data)
                        rs._data = dataHex
                    }

                    break
                case EVENT.RollbackExecuted:
                    rs = {} as EventLogData
                    rs._sn = Number(parsedJson.sn)
                    if (parsedJson.code) rs._code = parsedJson.code
                    if (parsedJson.msg) rs._msg = parsedJson.msg
                    if (parsedJson.err_msg) rs._msg = parsedJson.err_msg

                    break
                case EVENT.MessageReceived:
                    rs = {} as EventLogData
                    console.log(eventName, parsedJson)

                    // // TODO: parse here
                    // rs._from =
                    // rs._data =
                    // rs._decodedFrom =

                    break
                case EVENT.CallMessage:
                    rs = {} as EventLogData
                    rs._sn = Number(parsedJson.sn)
                    rs._from = parsedJson?.from ? `${parsedJson?.from.net_id}/${parsedJson?.from.addr}` : undefined
                    rs._decodedFrom = rs._from
                    rs._to = parsedJson?.to
                    rs._decodedTo = parsedJson?.to
                    rs._reqId = Number(parsedJson?.req_id)

                    const data = parsedJson?.data
                    if (data) {
                        const dataHex = ethers.utils.hexlify(data)
                        rs._data = dataHex
                    }
                    break

                case EVENT.CallExecuted:
                    rs = {} as EventLogData
                    rs._reqId = Number(parsedJson.req_id)
                    if (parsedJson.code) rs._code = parsedJson.code
                    if (parsedJson.err_msg) rs._msg = parsedJson.err_msg

                    break

                default:
                    break
            }

            // intents
            switch (eventName) {
                case INTENTS_EVENT.SwapOrder:
                    rs = {
                        id: Number(parsedJson.id),
                        emitter: parsedJson.emitter,
                        srcNID: parsedJson.src_nid,
                        dstNID: parsedJson.dst_nid,
                        creator: parsedJson.creator,
                        destinationAddress: parsedJson.destination_address,
                        token: parsedJson.token,
                        amount: parsedJson.amount,
                        toToken: parsedJson.to_token,
                        toAmount: parsedJson.to_amount,
                        data: parsedJson.data
                    }

                    if (parsedJson.data) {
                        const dataHex = ethers.utils.hexlify(parsedJson.data)
                        rs.data = dataHex
                    }

                    break
                case INTENTS_EVENT.OrderFilled:
                    rs = {
                        id: Number(parsedJson.id),
                        srcNID: parsedJson.src_nid,
                        toAmount: parsedJson.to_amount,
                        solverAddress: parsedJson.solver
                    }
                    break

                case INTENTS_EVENT.OrderClosed:
                    rs = {
                        id: Number(parsedJson.id)
                    }
                    break
                case INTENTS_EVENT.OrderCancelled:
                    rs = {
                        id: Number(parsedJson.id),
                        srcNID: parsedJson.srcNID
                    }
                    break
                case INTENTS_EVENT.Message:
                    rs = {
                        sn: Number(parsedJson.conn_sn),
                        dstNID: parsedJson.to.toString(),
                        msg: parsedJson.msg.toString()
                    }
                    break
                default:
                    break
            }
        }

        return rs
    }
}

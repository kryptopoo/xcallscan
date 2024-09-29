import { ethers } from 'ethers'
import { EVENT } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLogData } from '../../types/EventLog'

export class SuiDecoder implements IDecoder {
    async decodeEventLog(parsedJson: any, eventName: string): Promise<EventLogData | undefined> {
        let rs: EventLogData | undefined = undefined

        if (parsedJson) {
            rs = {} as EventLogData
            switch (eventName) {
                case EVENT.CallMessageSent:
                    rs._from = parsedJson.from
                    rs._to = parsedJson.to
                    rs._sn = Number(parsedJson.sn)
                    rs._nsn = parsedJson?.nsn
                    rs._decodedFrom = parsedJson.from
                    rs._decodedTo = parsedJson.to

                    break
                case EVENT.ResponseMessage:
                    rs._sn = Number(parsedJson.sn)
                    rs._code = parsedJson?.response_code

                    break
                case EVENT.RollbackMessage:
                    rs._sn = Number(parsedJson.sn)
                    if (parsedJson?.data) {
                        const dataHex = ethers.utils.hexlify(parsedJson?.data)
                        rs._data = dataHex
                    }

                    break
                case EVENT.RollbackExecuted:
                    rs._sn = Number(parsedJson.sn)
                    if (parsedJson.code) rs._code = parsedJson.code
                    if (parsedJson.msg) rs._msg = parsedJson.msg
                    if (parsedJson.err_msg) rs._msg = parsedJson.err_msg

                    break
                case EVENT.MessageReceived:
                    console.log(eventName, parsedJson)

                    // // TODO: parse here
                    // rs._from =
                    // rs._data =
                    // rs._decodedFrom =

                    break
                case EVENT.CallMessage:
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
                    rs._reqId = Number(parsedJson.req_id)
                    if (parsedJson.code) rs._code = parsedJson.code
                    if (parsedJson.err_msg) rs._msg = parsedJson.err_msg

                    break
                default:
                    break
            }
        }

        return rs
    }
}

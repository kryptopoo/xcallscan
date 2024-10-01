import { ethers } from 'ethers'
import { EVENT } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLogData } from '../../types/EventLog'
import logger from '../logger/logger'

export class StellarDecoder implements IDecoder {
    async decodeEventLog(data: any, eventName: string): Promise<EventLogData | undefined> {
        let rs: EventLogData | undefined = undefined

        if (data) {
            rs = {} as EventLogData
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
        }

        return rs
    }
}

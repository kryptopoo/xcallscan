import { ethers } from 'ethers'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLogData } from '../../types/EventLog'

export class IbcDecoder implements IDecoder {
    async decodeEventLog(eventLogs: any, eventName: string): Promise<EventLogData | undefined> {
        const getEventLogValue = (eventLog: any, key: string) => {
            return eventLog?.attributes?.find((a: { key: string; value: string }) => a.key == key)?.value
        }

        const eventLog: any = eventLogs.find((ev: any) => {
            return ev.type == `wasm-${eventName}`
        })

        if (eventLog) {
            let rs: EventLogData = {}
            const sn = getEventLogValue(eventLog, 'sn')
            const nsn = getEventLogValue(eventLog, 'nsn')
            const from = getEventLogValue(eventLog, 'from')
            const to = getEventLogValue(eventLog, 'to')
            const reqId = getEventLogValue(eventLog, 'reqId')
            const data = getEventLogValue(eventLog, 'data')
            const code = getEventLogValue(eventLog, 'code')
            const msg = getEventLogValue(eventLog, 'msg')
            if (sn) rs._sn = sn
            if (nsn) rs._nsn = nsn
            if (from) {
                rs._from = from
                rs._decodedFrom = from
            }
            if (to) {
                rs._to = to
                rs._decodedTo = to
            }
            if (reqId) rs._reqId = reqId
            if (data && data != '' && data != '[]') {
                if (data.toString().startsWith('[') && data.toString().endsWith(']')) {
                    const bytesArr = data
                        .replace(/[\[\]]/g, '')
                        .split(',')
                        .map((x: any) => Number(x))
                    const dataHex = ethers.utils.hexlify(bytesArr)
                    rs._data = dataHex
                } else {
                    rs._data = data
                }
            }
            if (code) rs._code = code
            if (msg) rs._msg = msg

            return rs
        }

        return undefined
    }
}

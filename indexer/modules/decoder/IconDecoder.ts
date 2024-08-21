import { IDecoder } from '../../interfaces/IDecoder'
import IconService from 'icon-sdk-js'
import { API_URL, EVENT, NETWORK, CONTRACT } from '../../common/constants'
import { EventLog, EventLogData } from '../../types/EventLog'

export class IconDecoder implements IDecoder {
    async decodeEventLog(eventLog: any, eventName: string): Promise<EventLogData | undefined> {
        let rs: EventLogData = {}

        if (typeof eventLog.indexed !== 'string') eventLog.indexed = JSON.stringify(eventLog.indexed)
        if (typeof eventLog.data !== 'string') eventLog.data = JSON.stringify(eventLog.data)
        let eventData = [...JSON.parse(eventLog.indexed), ...JSON.parse(eventLog.data == 'null' ? '[]' : eventLog.data)]

        switch (eventName) {
            case EVENT.CallMessageSent:
                rs._from = eventData[1]
                rs._to = eventData[2]
                if (eventData[3]) rs._sn = IconService.IconConverter.toNumber(eventData[3])
                if (eventData[4]) rs._nsn = IconService.IconConverter.toNumber(eventData[4])

                // icon always decode string
                rs._decodedFrom = eventData[1]
                rs._decodedTo = eventData[2]

                break
            case EVENT.ResponseMessage:
                rs._sn = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) rs._code = IconService.IconConverter.toNumber(eventData[2])
                rs._msg = eventData[3]
                break
            case EVENT.RollbackMessage:
                rs._sn = IconService.IconConverter.toNumber(eventData[1])
                break
            case EVENT.RollbackExecuted:
                rs._sn = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) rs._code = IconService.IconConverter.toNumber(eventData[2])
                if (eventData[3]) rs._msg = eventData[3]
                break
            case EVENT.MessageReceived:
                rs._from = eventData[1]
                rs._data = eventData[2]

                rs._decodedFrom = eventData[1]
                break
            case EVENT.CallMessage:
                rs._from = eventData[1]
                rs._to = eventData[2]
                if (eventData[3]) rs._sn = IconService.IconConverter.toNumber(eventData[3])
                if (eventData[4]) rs._reqId = IconService.IconConverter.toNumber(eventData[4])
                if (eventData[5]) rs._data = eventData[5]

                rs._decodedFrom = eventData[1]
                rs._decodedTo = eventData[2]
                break

            case EVENT.CallExecuted:
                rs._reqId = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) rs._code = IconService.IconConverter.toNumber(eventData[2])
                if (eventData[3]) rs._msg = eventData[3]
                break
            default:
                break
        }

        return rs
    }
}

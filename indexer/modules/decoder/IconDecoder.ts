import { IDecoder } from '../../interfaces/IDecoder'
import IconService from 'icon-sdk-js'
import { API_URL, EVENT, NETWORK, CONTRACT, INTENTS_EVENT } from '../../common/constants'
import { EventLog, EventLogData, IntentsEventLogData } from '../../types/EventLog'

export class IconDecoder implements IDecoder {
    private getEventName(log: string) {
        // xcall
        if (log.includes('CallMessageSent(Address,str,int)')) return EVENT.CallMessageSent
        if (log.includes('CallMessage(str,str,int,int,bytes)')) return EVENT.CallMessage
        if (log.includes('CallExecuted(int,int,str)')) return EVENT.CallExecuted
        if (log.includes('ResponseMessage(int,int)')) return EVENT.ResponseMessage
        if (log.includes('RollbackMessage(int)')) return EVENT.RollbackMessage
        if (log.includes('RollbackExecuted(int)')) return EVENT.RollbackExecuted

        // intent
        if (log.includes('SwapIntent(int,str,str,str,str,str,str,int,str,int,bytes)')) return INTENTS_EVENT.SwapIntent
        if (log.includes('OrderFilled(int,str)')) return INTENTS_EVENT.OrderFilled
        if (log.includes('OrderClosed(int)')) return INTENTS_EVENT.OrderClosed
        if (log.includes('Message(str,int,bytes)')) return INTENTS_EVENT.Message
        if (log.includes('OrderCancelled(int,str)')) return INTENTS_EVENT.OrderCancelled

        return ''
    }

    async decodeEventLog(eventLog: any, eventName: string): Promise<EventLogData | IntentsEventLogData | undefined> {
        let rs: EventLogData | IntentsEventLogData | undefined = undefined

        if (typeof eventLog.indexed !== 'string') eventLog.indexed = JSON.stringify(eventLog.indexed)
        if (typeof eventLog.data !== 'string') eventLog.data = JSON.stringify(eventLog.data)
        let eventData = [...JSON.parse(eventLog.indexed), ...JSON.parse(eventLog.data == 'null' ? '[]' : eventLog.data)]

        if (this.getEventName(eventLog.indexed) != eventName) return undefined

        switch (eventName) {
            case EVENT.CallMessageSent:
                rs = {} as EventLogData

                rs._from = eventData[1]
                rs._to = eventData[2]
                if (eventData[3]) rs._sn = IconService.IconConverter.toNumber(eventData[3])
                if (eventData[4]) rs._nsn = IconService.IconConverter.toNumber(eventData[4])

                // icon always decode string
                rs._decodedFrom = eventData[1]
                rs._decodedTo = eventData[2]

                break
            case EVENT.ResponseMessage:
                rs = {} as EventLogData

                rs._sn = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) rs._code = IconService.IconConverter.toNumber(eventData[2])
                rs._msg = eventData[3]
                break
            case EVENT.RollbackMessage:
                rs = {} as EventLogData

                rs._sn = IconService.IconConverter.toNumber(eventData[1])
                break
            case EVENT.RollbackExecuted:
                rs = {} as EventLogData

                rs._sn = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) rs._code = IconService.IconConverter.toNumber(eventData[2])
                if (eventData[3]) rs._msg = eventData[3]
                break
            case EVENT.MessageReceived:
                rs = {} as EventLogData

                rs._from = eventData[1]
                rs._data = eventData[2]

                rs._decodedFrom = eventData[1]
                break
            case EVENT.CallMessage:
                rs = {} as EventLogData

                rs._from = eventData[1]
                rs._to = eventData[2]
                if (eventData[3]) rs._sn = IconService.IconConverter.toNumber(eventData[3])
                if (eventData[4]) rs._reqId = IconService.IconConverter.toNumber(eventData[4])
                if (eventData[5]) rs._data = eventData[5]

                rs._decodedFrom = eventData[1]
                rs._decodedTo = eventData[2]
                break
            case EVENT.CallExecuted:
                rs = {} as EventLogData

                rs._reqId = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) rs._code = IconService.IconConverter.toNumber(eventData[2])
                if (eventData[3]) rs._msg = eventData[3]
                break

            case INTENTS_EVENT.SwapIntent:
                rs = {} as IntentsEventLogData
                rs = {
                    id: IconService.IconConverter.toNumber(eventData[1]),
                    emitter: eventData[2],
                    srcNID: eventData[3],
                    dstNID: eventData[4],
                    creator: eventData[5],
                    destinationAddress: eventData[6],
                    token: eventData[7],
                    amount: IconService.IconConverter.toNumber(eventData[8]).toString(),
                    toToken: eventData[9],
                    toAmount: IconService.IconConverter.toNumber(eventData[10]).toString(),
                    data: eventData[11]
                }

                break
            case INTENTS_EVENT.OrderFilled:
                rs = {} as IntentsEventLogData
                rs.id = IconService.IconConverter.toNumber(eventData[1])
                if (eventData[2]) rs.srcNID = eventData[2]

                break

            case INTENTS_EVENT.OrderClosed:
                rs = {} as IntentsEventLogData
                rs.id = IconService.IconConverter.toNumber(eventData[1])

                break
            case INTENTS_EVENT.OrderCancelled:
                // TODO

                break
            case INTENTS_EVENT.Message:
                rs = {} as IntentsEventLogData
                rs = {
                    sn: IconService.IconConverter.toNumber(eventData[2]),
                    dstNID: eventData[1],
                    msg: eventData[3]
                }

                break

            default:
                break
        }

        return rs
    }
}

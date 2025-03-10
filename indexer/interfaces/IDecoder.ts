import { EventLogData, IntentsEventLogData } from '../types/EventLog'

export interface IDecoder {
    decodeEventLog(eventLog: any, eventName: string): Promise<EventLogData | IntentsEventLogData | undefined>
}

import { EventLogData } from '../types/EventLog'

export interface IDecoder {
    decodeEventLog(eventLog: any, eventName: string): Promise<EventLogData | undefined>
}

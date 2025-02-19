import { EventLogData, IntentsEventLogData } from '../types/EventLog'

export interface IDecoder {
    // decoding for xcall contract
    decodeEventLog(eventLog: any, eventName: string): Promise<EventLogData | IntentsEventLogData | undefined>

    // // decoding for intents contract
    // decodeIntentsEventLog(eventLog: any, eventName: string): Promise<IntentsEventLogData | undefined>
}

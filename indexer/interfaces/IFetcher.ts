import { EventLog } from "../types/EventLog"

export interface IFetcher {
    storeDb(eventLog: EventLog): Promise<void>
    fetchEvents(eventNames: string[], blockNumber: string, updateCounter: boolean): Promise<boolean>
}

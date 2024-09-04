import { EventModel } from "../types/DataModels"
import { EventLog } from "../types/EventLog"

export interface IFetcher {
    storeDb(eventLog: EventLog): Promise<EventModel>
    fetchEvents(eventNames: string[], blockNumber: string, updateCounter: boolean): Promise<boolean>
}

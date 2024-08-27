import { EventLog } from "../types/EventLog"

export interface ISubscriberCallback {
    (data: EventLog): void
}

export interface ISubscriber {
    subscribe(callback: ISubscriberCallback): void
}

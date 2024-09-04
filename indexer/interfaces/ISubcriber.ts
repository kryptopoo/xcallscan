import { EventLog } from '../types/EventLog'

export interface ISubscriberCallback {
    (data: EventLog): void
}

export interface ISubscriber {
    network: string
    subscribe(callback: ISubscriberCallback): void
}

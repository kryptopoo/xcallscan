export interface ISubscriberCallback {
    (data: any): void
}

export interface ISubscriber {
    subscribe(callback: ISubscriberCallback): void
}

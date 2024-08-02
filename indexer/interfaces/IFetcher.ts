export interface IFetcher {
    fetchEvents(eventNames: string[], blockNumber: string, updateCounter: boolean): Promise<boolean>
}

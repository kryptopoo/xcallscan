export interface IFetcher {
    fetchEvents(eventNames: string[], blockNumber: number, updateCounter: boolean): Promise<boolean>
}

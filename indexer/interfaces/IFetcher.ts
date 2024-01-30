export interface IFetcher {
    fetchEvents(eventNames: string[], blockNumber: number): Promise<boolean>
}

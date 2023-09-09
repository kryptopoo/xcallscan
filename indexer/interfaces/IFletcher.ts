export interface IFletcher {
    fletchEvents(eventNames: string[], blockNumber: number): Promise<boolean>
}

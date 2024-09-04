export interface ISourceSyncer {
    syncReceivedMessages(sn: number, srcNetworks: string[]): Promise<void>
    syncSentMessages(sn: number, destNetworks: string[]): Promise<void>
}

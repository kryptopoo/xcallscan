import { EventModel } from "../data/Db"

export interface ISourceSyncer {
    getPendingMessageSns(destNetwork: string) : Promise<number[]>
    getNotSyncedMessages(): Promise<number[]>
    // syncMessages(sn: number): Promise<void>

    syncReceivedMessages(sn: number): Promise<void>
    syncSentMessages(sn: number): Promise<void>
}

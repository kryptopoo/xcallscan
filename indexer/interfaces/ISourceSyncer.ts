import { EventModel } from "../data/Db"

export interface ISourceSyncer {
    syncReceivedMessages(sn: number): Promise<void>
    syncSentMessages(sn: number): Promise<void>
}

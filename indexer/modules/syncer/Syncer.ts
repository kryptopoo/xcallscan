import { NETWORK } from '../../common/constants'
import { Db } from '../../data/Db'
import { SourceSyncer } from './SourceSyncer'

export class Syncer {
    protected _db = new Db()

    sourceSyncers: SourceSyncer[]

    constructor() {
        const iconSyncer = new SourceSyncer(NETWORK.ICON)
        const eth2Syncer = new SourceSyncer(NETWORK.ETH2)
        const bscSyncer = new SourceSyncer(NETWORK.BSC)
        const havahSyncer = new SourceSyncer(NETWORK.HAVAH)
        this.sourceSyncers = [iconSyncer, eth2Syncer, bscSyncer, havahSyncer]
    }

    async syncMessage(sn: number) {
        // sync sent messages
        for (let i = 0; i < this.sourceSyncers.length; i++) {
            const sourceSyncer = this.sourceSyncers[i]
            await sourceSyncer.syncSentMessages(sn)
        }

        // sync received messages
        for (let i = 0; i < this.sourceSyncers.length; i++) {
            const sourceSyncer = this.sourceSyncers[i]
            await sourceSyncer.syncReceivedMessages(sn)
        }
    }

    async syncNewMessages() {
        const maxSnIcon = await this._db.getMaxEventSn(NETWORK.ICON)
        const maxSnHavah = await this._db.getMaxEventSn(NETWORK.HAVAH)
        const maxSnEth2 = await this._db.getMaxEventSn(NETWORK.ETH2)
        const maxSnBsc = await this._db.getMaxEventSn(NETWORK.BSC)

        const maxSnMsg = await this._db.getMaxMessageSn()
        const maxSnEvent = Math.max(...[maxSnIcon, maxSnHavah, maxSnEth2, maxSnBsc])
        console.log('maxSnMsg', maxSnMsg)
        console.log('maxSnEvent', maxSnEvent)

        // sync sent messages
        for (let i = 0; i < this.sourceSyncers.length; i++) {
            const sourceSyncer = this.sourceSyncers[i]
            for (let sn = maxSnMsg; sn <= maxSnEvent; sn++) {
                await sourceSyncer.syncSentMessages(sn)
            }
        }

        // sync received messages
        for (let i = 0; i < this.sourceSyncers.length; i++) {
            const sourceSyncer = this.sourceSyncers[i]
            for (let sn = maxSnMsg; sn <= maxSnEvent; sn++) {
                await sourceSyncer.syncReceivedMessages(sn)
            }
        }
    }
}

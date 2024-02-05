import { CONTRACT, NETWORK } from '../../common/constants'
import { Db } from '../../data/Db'
import logger from '../logger/logger'
import { SourceSyncer } from './SourceSyncer'

export class Syncer {
    protected _db = new Db()

    sourceSyncers: { [network: string]: SourceSyncer } = {}

    constructor(public networks: string[] = []) {
        this.networks = networks.length == 0 ? Object.values(NETWORK) : networks

        // in case of one contract only
        if (this.networks.includes(NETWORK.IBC_ICON) && CONTRACT[NETWORK.IBC_ICON].xcall == CONTRACT[NETWORK.ICON].xcall) {
            const foundIndex = this.networks.findIndex(x => x == NETWORK.IBC_ICON);
            this.networks[foundIndex] = NETWORK.ICON;
        }

        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = new SourceSyncer(network)
            this.sourceSyncers[network] = sourceSyncer
        }
    }

    async syncMessage(sn: number) {
        // sync sent messages
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]
            await sourceSyncer.syncSentMessages(sn)
        }

        // sync received messages
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]
            await sourceSyncer.syncReceivedMessages(sn)
        }
    }

    async syncNewMessages() {
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]

            const maxMsgSn = await this._db.getMaxMessageSn(network)
            const maxEventSn = await this._db.getMaxEventSn(network)
            const syncFrom = maxMsgSn < maxEventSn ? maxMsgSn : maxEventSn
            const syncTo = maxMsgSn > maxEventSn ? maxMsgSn : maxEventSn
            const newMsgCount = maxEventSn - maxMsgSn
            logger.info(`${network} syncing ${newMsgCount > 0 ? newMsgCount : 0} new messages fromSn:${syncFrom} toSn:${syncTo}`)

            if (newMsgCount > 0) {
                // sync sent messages
                for (let sn = syncFrom; sn <= syncTo; sn++) {
                    await sourceSyncer.syncSentMessages(sn)
                }
                // sync received messages
                for (let sn = syncFrom; sn <= syncTo; sn++) {
                    await sourceSyncer.syncReceivedMessages(sn)
                }
            }
        }
    }

    async syncPendingMessages() {
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]

            const pendingMsgs = await this._db.getPendingMessages(network)
            logger.info(`${network} syncing ${pendingMsgs.length} pending messages ${pendingMsgs.map((m) => m.sn).join(', ')}`)

            // sync received messages
            for (let i = 0; i < pendingMsgs.length; i++) {
                const sn = pendingMsgs[i].sn
                await sourceSyncer.syncReceivedMessages(sn)
            }
        }
    }

    async syncUnfinishedMessages() {
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]

            const pendingMsgs = await this._db.getNotSyncedMessages(network)
            logger.info(`${network} syncing ${pendingMsgs.length} unfinished messages ${pendingMsgs.map((m) => m.sn).join(', ')}`)

            // sync received messages
            for (let i = 0; i < pendingMsgs.length; i++) {
                const sn = pendingMsgs[i].sn
                await sourceSyncer.syncSentMessages(sn)
                await sourceSyncer.syncReceivedMessages(sn)
            }
        }
    }
}

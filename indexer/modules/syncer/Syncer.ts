import { NETWORK } from '../../common/constants'
import { Db } from '../../data/Db'
import logger from '../logger/logger'
import { SourceSyncer } from './SourceSyncer'

export class Syncer {
    protected _db = new Db()

    sourceSyncers: { [network: string]: SourceSyncer } = {}
    networks: string[] = []

    constructor() {
        this.networks = Object.values(NETWORK)
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
            logger.info(`${network} syncing ${Math.abs(maxEventSn - maxMsgSn)} new messages fromSn:${maxMsgSn} toSn:${maxEventSn}`)

            // sync sent messages
            for (let sn = maxMsgSn; sn <= maxEventSn; sn++) {
                await sourceSyncer.syncSentMessages(sn)
            }
            // sync received messages
            for (let sn = maxMsgSn; sn <= maxEventSn; sn++) {
                await sourceSyncer.syncReceivedMessages(sn)
            }
        }
    }

    async syncPendingMessages() {
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]

            const pendingMsgs = await this._db.getPendingMessages(network, '')
            logger.info(`${network} syncing ${pendingMsgs.length} pending messages ${pendingMsgs.map((m) => m.sn).join(', ')}`)

            // sync received messages
            for (let i = 0; i < pendingMsgs.length; i++) {
                const sn = pendingMsgs[i].sn
                await sourceSyncer.syncReceivedMessages(sn)
            }
        }
    }
}

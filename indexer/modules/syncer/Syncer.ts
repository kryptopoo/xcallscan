import { CONTRACT, EVENT, NETWORK } from '../../common/constants'
import { Db } from '../../data/Db'
import { Fetcher } from '../fetcher/Fetcher'
import logger from '../logger/logger'
import { SourceSyncer } from './SourceSyncer'

export class Syncer {
    protected _db = new Db()

    sourceSyncers: { [network: string]: SourceSyncer } = {}

    constructor(public networks: string[] = []) {
        this.networks = networks.length == 0 ? Object.values(NETWORK) : networks

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
            await sourceSyncer.syncSentMessages(sn, this.networks)
        }

        // sync received messages
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]
            await sourceSyncer.syncReceivedMessages(sn, this.networks)
        }
    }

    async syncNewMessages() {
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const sourceSyncer = this.sourceSyncers[network]

            // // Detect new messages by sn number
            // const maxMsgSn = await this._db.getMaxMessageSn(network)
            // const maxEventSn = await this._db.getMaxEventSn(network)
            // const syncFrom = maxMsgSn < maxEventSn ? maxMsgSn : maxEventSn
            // const syncTo = maxMsgSn > maxEventSn ? maxMsgSn : maxEventSn
            // const newMsgCount = maxEventSn - maxMsgSn
            // logger.info(`${network} syncing ${newMsgCount > 0 ? newMsgCount : 0} new messages fromSn:${syncFrom} toSn:${syncTo}`)
            // if (newMsgCount > 0) {
            //     // sync sent messages
            //     for (let sn = syncFrom; sn <= syncTo; sn++) {
            //         await sourceSyncer.syncSentMessages(sn)
            //     }
            //     // sync received messages
            //     for (let sn = syncFrom; sn <= syncTo; sn++) {
            //         await sourceSyncer.syncReceivedMessages(sn)
            //     }
            // }

            // // Detect new messages by block number
            const maxMsgBlockNumber = await this._db.getMaxMessageBlockNumber(network)
            const maxEventBlockNumber = await this._db.getMaxEventBlockNumber(network)
            const snList = await this._db.getNewSnList(network, maxMsgBlockNumber, maxEventBlockNumber)
            const newMsgCount = snList.length
            logger.info(`${network} syncing ${newMsgCount > 0 ? newMsgCount : 0} new messages ${snList.map((it) => it.sn).join(', ')}`)
            if (newMsgCount > 0) {
                // sync sent messages
                for (let i = 0; i < newMsgCount; i++) {
                    await sourceSyncer.syncSentMessages(snList[i].sn)
                }
                // sync received messages
                for (let i = 0; i < newMsgCount; i++) {
                    await sourceSyncer.syncReceivedMessages(snList[i].sn)
                }
            }
        }
    }

    async syncUnfinishedMessages() {
        for (let i = 0; i < this.networks.length; i++) {
            const network = this.networks[i]
            const pendingMsgs = await this._db.getNotSyncedMessages(network)
            logger.info(`${network} syncing ${pendingMsgs.length} unfinished messages ${pendingMsgs.map((m) => m.sn).join(', ')}`)

            // sync received messages
            for (let i = 0; i < pendingMsgs.length; i++) {
                const sn = pendingMsgs[i].sn
                const srcNetwork = pendingMsgs[i].src_network
                const destNetwork = pendingMsgs[i].dest_network

                const srcSyncer = this.sourceSyncers[srcNetwork]
                await srcSyncer.syncSentMessages(sn)

                // handle missing CallExecuted event
                let destEvents = await this._db.getEventsBySn(destNetwork, sn)
                if (destEvents.length == 1) {
                    // try fetching again
                    logger.info(`${destNetwork} try fetching events ${EVENT.CallExecuted} sn:${sn}`)

                    try {
                        const fromBlockNumber = destEvents[0].block_number
                        const fetcher = new Fetcher(destNetwork)
                        await fetcher.fetchEvents([EVENT.CallExecuted], fromBlockNumber.toString(), false)
                    } catch (error: any) {
                        logger.error(`${destNetwork} try fetching events sn:${sn} failed ${error.message}`)
                    }
                }

                const destSyncer = this.sourceSyncers[destNetwork]
                await destSyncer.syncReceivedMessages(sn)
            }
        }
    }
}

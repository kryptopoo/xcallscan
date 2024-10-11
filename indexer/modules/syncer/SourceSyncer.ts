import { ethers } from 'ethers'
import logger from '../logger/logger'
import { BTP_NETWORK_ID, CONTRACT, EVENT, MSG_STATUS, NETWORK } from '../../common/constants'
import { Db } from '../../data/Db'
import { ISourceSyncer } from '../../interfaces/ISourceSyncer'
import { EventModel, MessageModel } from '../../types/DataModels'

export class SourceSyncer implements ISourceSyncer {
    protected _db = new Db()

    constructor(public network: string) {}

    protected getNetwork(btpAddress: string) {
        const networks = Object.values(NETWORK)
        for (let i = 0; i < networks.length; i++) {
            let network = networks[i]
            if (btpAddress && btpAddress.indexOf(BTP_NETWORK_ID[network]) > -1) return network
        }

        return undefined
    }

    protected buildBtpAddress(network: string, address: string) {
        // TODO: review btp address if having 'btp://' prefix
        // return `btp://${BTP_NETWORK_ID[network]}/${address}`
        return `${BTP_NETWORK_ID[network]}/${address}`
    }

    protected getAddress(btpAddress: string) {
        if (btpAddress) {
            const parts = btpAddress.split('/')
            return parts[parts.length - 1]
        }

        return undefined
    }

    protected parseCallMessageSentEvent(event: EventModel) {
        if (!event.to_decoded) return undefined

        // skip if cannot detect network
        const destNetwork = this.getNetwork(event.to_decoded as string)
        if (!destNetwork) {
            let destBtpNetworkId = ''
            if (event.to_decoded && event.to_decoded.split('/').length > 0) {
                destBtpNetworkId = event.to_decoded.split('/')[0]
            }

            logger.info(`cannot detect network ${this.network}->${destBtpNetworkId} event:${event.event} sn:${event.sn}`)
            return undefined
        }

        const msg: MessageModel = {
            sn: event.sn,
            status: MSG_STATUS.Pending,

            src_network: this.network,
            src_app: event.from_decoded,

            src_block_number: event.block_number,
            src_block_timestamp: event.block_timestamp,
            src_tx_hash: event.tx_hash,

            dest_network: destNetwork,
            dest_app: this.getAddress(event.to_decoded as string),

            fee: event.tx_fee,
            value: event.tx_value,

            synced: false
        }

        return msg
    }

    protected async findSourceNetwork(fromRaw: string) {
        // try detect if fromRaw is not encoded
        let srcNetwork = this.getNetwork(fromRaw)
        if (srcNetwork) {
            const srcDapp = this.getAddress(fromRaw)
            return { srcNetwork, srcDapp }
        }

        // find the source network of message
        const srcNetworks = Object.values(NETWORK).filter((n) => {
            return n != this.network
        })

        for (let i = 0; i < srcNetworks.length; i++) {
            srcNetwork = srcNetworks[i]

            const srcDapps = await this._db.getDAppAddresses(srcNetwork)

            for (let j = 0; j < srcDapps.length; j++) {
                const srcDapp = srcDapps[j]

                const decodedFrom = this.buildBtpAddress(srcNetwork, srcDapp)
                const encodedFrom = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(decodedFrom))

                if (fromRaw == encodedFrom) {
                    return { srcNetwork, srcDapp }
                }
            }
        }

        return { srcNetwork: undefined, srcDapp: undefined }
    }

    async syncSentMessages(sn: number, destNetworks: string[] = []): Promise<void> {
        const events = await this._db.getEventsBySn(this.network, sn)

        for (let i = 0; i < events.length; i++) {
            const event = events[i]

            // SENDING
            if (event.event == EVENT.CallMessageSent) {
                const msg = this.parseCallMessageSentEvent(event)
                if (!msg) continue

                // skip if not in destNetworks
                if (destNetworks.length > 0 && !destNetworks.includes(msg.dest_network ?? '')) continue

                const insertCount = await this._db.insertMessage(msg)
                if (insertCount > 0) {
                    logger.info(`synced ${msg.src_network}->${msg.dest_network} event:${event.event} sn:${msg.sn} status:${msg.status}`)
                }
            }
            if (event.event == EVENT.ResponseMessage) {
                const callMsgSentEvent = events.find((e) => e.event == EVENT.CallMessageSent)
                if (callMsgSentEvent) {
                    const msg = this.parseCallMessageSentEvent(callMsgSentEvent)
                    if (!msg) continue

                    // skip if not in destNetworks
                    if (destNetworks.length > 0 && !destNetworks.includes(msg.dest_network ?? '')) continue

                    // skip updating status if it's executed/rollbacked
                    const msgStatus = await this._db.getMessageStatus(
                        event.sn,
                        msg.src_network as string,
                        msg.dest_network as string,
                        msg.src_app as string
                    )
                    const status = msgStatus == MSG_STATUS.Rollbacked || msgStatus == MSG_STATUS.Executed ? msgStatus : MSG_STATUS.Delivered

                    const updateCount = await this._db.updateResponseMessage(
                        msg.sn,
                        msg.src_network as string,
                        msg.dest_network as string,
                        msg.src_app as string,
                        event.block_number,
                        event.block_timestamp,
                        event.tx_hash,
                        event.msg,
                        status
                    )

                    // event.code == -1
                    // msg response failed, it would emit RollbackMessage
                    // msg response succeeded, it wouldn't emit RollbackMessage
                    if (updateCount > 0) {
                        logger.info(`synced ${msg.src_network}->${msg.dest_network} event:${event.event} sn:${msg.sn} status:${status}`)

                        // if error
                        if (event.code == 0) {
                            // stop sync
                            await this._db.updateMessageSynced(
                                msg.sn,
                                msg.src_network as string,
                                msg.dest_network as string,
                                msg.src_app as string,
                                true
                            )
                        }
                    }
                }
            }
            if (event.event == EVENT.RollbackMessage) {
                const callMsgSentEvent = events.find((e) => e.event == EVENT.CallMessageSent)
                if (callMsgSentEvent) {
                    const msg = this.parseCallMessageSentEvent(callMsgSentEvent)
                    if (!msg) continue

                    // skip if not in destNetworks
                    if (destNetworks.length > 0 && !destNetworks.includes(msg.dest_network ?? '')) continue

                    const updateCount = await this._db.updateRollbackMessage(
                        msg.sn,
                        msg.src_network as string,
                        msg.dest_network as string,
                        msg.src_app as string,
                        event.block_number,
                        event.block_timestamp,
                        event.tx_hash,
                        event.msg,
                        MSG_STATUS.Delivered
                    )

                    if (updateCount > 0) {
                        logger.info(`synced ${msg.src_network}->${msg.dest_network} event:${event.event} sn:${msg.sn} status:${MSG_STATUS.Delivered}`)
                    }
                }
            }
            if (event.event == EVENT.RollbackExecuted) {
                const callMsgSentEvent = events.find((e) => e.event == EVENT.CallMessageSent)
                if (callMsgSentEvent) {
                    const msg = this.parseCallMessageSentEvent(callMsgSentEvent)
                    if (!msg) continue

                    // skip if not in destNetworks
                    if (destNetworks.length > 0 && !destNetworks.includes(msg.dest_network ?? '')) continue

                    const updateCount = await this._db.updateRollbackMessage(
                        msg.sn,
                        msg.src_network as string,
                        msg.dest_network as string,
                        msg.src_app as string,
                        event.block_number,
                        event.block_timestamp,
                        event.tx_hash,
                        event.msg,
                        MSG_STATUS.Rollbacked
                    )

                    if (updateCount > 0) {
                        // stop sync
                        await this._db.updateMessageSynced(msg.sn, msg.src_network as string, msg.dest_network as string, msg.src_app as string, true)

                        logger.info(
                            `synced ${msg.src_network}->${msg.dest_network} event:${event.event} sn:${msg.sn} status:${MSG_STATUS.Rollbacked}`
                        )
                    }
                }
            }
        }
    }

    async syncReceivedMessages(sn: number, srcNetworks: string[] = []): Promise<void> {
        const events = await this._db.getEventsBySn(this.network, sn)
        const destNetwork = this.network

        for (let i = 0; i < events.length; i++) {
            const event = events[i]

            // RECEIVING
            if (event.event == EVENT.CallMessage) {
                // find the source network of message
                let { srcNetwork, srcDapp } = await this.findSourceNetwork(event.from_raw ?? '')
                if (srcNetwork && srcDapp) {
                    // skip if not in srcNetworks
                    if (srcNetworks.length > 0 && !srcNetworks.includes(srcNetwork)) continue

                    // update status Delivered for the source network
                    const updateCount = await this._db.updateSentMessage(
                        event.sn,
                        srcNetwork,
                        destNetwork,
                        srcDapp,
                        event.block_number,
                        event.block_timestamp,
                        event.tx_hash,
                        MSG_STATUS.Delivered
                    )
                    if (updateCount > 0) {
                        logger.info(`synced ${this.network}<-${srcNetwork} event:${event.event} sn:${event.sn} status:${MSG_STATUS.Delivered}`)
                    }
                }
            }
            if (event.event == EVENT.CallExecuted) {
                // find the source network of message
                let { srcNetwork, srcDapp } = await this.findSourceNetwork(event.from_raw ?? '')
                if (srcNetwork && srcDapp) {
                    // skip if not in srcNetworks
                    if (srcNetworks.length > 0 && !srcNetworks.includes(srcNetwork)) continue

                    // check if msg rollbacked
                    const isRollbacked = await this._db.validateRollbackedStatus(event.sn, srcNetwork, destNetwork, srcDapp)
                    let status = isRollbacked ? MSG_STATUS.Rollbacked : MSG_STATUS.Executed

                    // exception case: no rollback, should be failed
                    if (status == MSG_STATUS.Executed && event.msg != undefined && event.msg != '' && event.msg != 'success')
                        status = MSG_STATUS.Failed

                    const updateCount = await this._db.updateExecutedMessage(
                        event.sn,
                        srcNetwork,
                        destNetwork,
                        srcDapp,
                        undefined,
                        event.block_number,
                        event.block_timestamp,
                        event.tx_hash,
                        MSG_STATUS.Executed ? undefined : event.msg,
                        status
                    )
                    if (updateCount > 0) {
                        // stop sync
                        await this._db.updateMessageSynced(event.sn, srcNetwork, this.network, srcDapp, true)

                        logger.info(`synced ${this.network}<-${srcNetwork} event:${event.event} sn:${event.sn} status:${status}`)
                    }
                }
            }
        }
    }
}

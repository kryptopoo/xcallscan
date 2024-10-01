import logger from '../logger/logger'
import { Db } from '../../data/Db'
import { CONTRACT, EVENT, NETWORK } from '../../common/constants'
import { IFetcher } from '../../interfaces/IFetcher'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import { EventModel } from '../../types/DataModels'
import { ScanFactory } from '../scan/ScanFactory'
import { shortAddress } from '../../common/helper'

export class Fetcher implements IFetcher {
    private _db = new Db()

    scan: IScan

    constructor(public network: string) {
        this.scan = ScanFactory.createScan(network)
    }

    public async storeDb(eventLog: EventLog): Promise<EventModel> {
        let eventModel: EventModel = {
            event: eventLog.eventName,
            sn: eventLog.eventData._sn,
            nsn: eventLog.eventData?._nsn,
            reqId: eventLog.eventData?._reqId,
            msg: eventLog.eventData?._msg,
            code: eventLog.eventData?._code,
            data: eventLog.eventData?._data,
            from_raw: eventLog.eventData?._from,
            to_raw: eventLog.eventData?._to,
            from_decoded: eventLog.eventData?._decodedFrom,
            to_decoded: eventLog.eventData?._decodedTo,
            block_number: eventLog.blockNumber,
            block_timestamp: eventLog.blockTimestamp,
            tx_hash: eventLog.txHash,
            tx_from: eventLog.txFrom,
            tx_to: eventLog.txTo,
            tx_fee: eventLog.txFee,
            tx_value: eventLog.txValue
        }

        // fulfill data to special events
        if (eventLog.eventName == EVENT.CallExecuted) {
            const callMessageEvent = await this._db.getEventByReqId(this.scan.network, EVENT.CallMessage, eventLog.eventData?._reqId)
            if (callMessageEvent) {
                eventModel.sn = callMessageEvent.sn
                eventModel.from_raw = callMessageEvent.from_raw
                eventModel.to_raw = callMessageEvent.to_raw
                eventModel.from_decoded = callMessageEvent.from_decoded
                eventModel.to_decoded = callMessageEvent.to_decoded
            }
        }
        if (
            eventLog.eventName == EVENT.ResponseMessage ||
            eventLog.eventName == EVENT.RollbackMessage ||
            eventLog.eventName == EVENT.RollbackExecuted
        ) {
            const callMessageSentEvent = await this._db.getEventBySn(this.scan.network, EVENT.CallMessageSent, eventModel.sn)
            if (callMessageSentEvent) {
                eventModel.sn = callMessageSentEvent.sn
                eventModel.from_raw = callMessageSentEvent.from_raw
                eventModel.to_raw = callMessageSentEvent.to_raw
                eventModel.from_decoded = callMessageSentEvent.from_decoded
                eventModel.to_decoded = callMessageSentEvent.to_decoded
            }
        }

        if (eventLog.eventName == EVENT.CallMessage) {
            // update sn to CallExecuted event
            const callExecutedEvent = await this._db.getEventByReqId(this.scan.network, EVENT.CallExecuted, eventLog.eventData?._reqId)
            if (callExecutedEvent) {
                await this._db.updateEventById(
                    this.scan.network,
                    callExecutedEvent.id,
                    eventModel.sn,
                    eventModel.from_raw as string,
                    eventModel.to_raw as string,
                    eventModel.from_decoded as string,
                    eventModel.to_decoded as string
                )
            }
        }

        await this._db.insertEvent(this.scan.network, eventModel)

        return eventModel
    }

    private async getCounter(xcallAddress: string, eventName: string) {
        let flagName = this.scan.countName

        let counterName =
            CONTRACT[this.scan.network].xcall.length <= 1
                ? `${this.scan.network}_${eventName}_${flagName}`
                : `${this.scan.network}_${shortAddress(xcallAddress, '_')}_${eventName}_${flagName}`
        let counter = await this._db.getCounterByName(counterName)
        return counter
    }

    async fetchEvents(eventNames: string[], flagNumber: string = '0', updateCounter: boolean = true) {
        // fetch each xcall address
        const _this = this
        let fetchTasks = []
        for (let index = 0; index < CONTRACT[this.scan.network].xcall.length; index++) {
            const xcallAddress = CONTRACT[this.scan.network].xcall[index]

            fetchTasks.push(
                new Promise(async function (resolve) {
                    // await new Promise((res) => setTimeout(res, delay))
                    let result = await _this.fetchEventsByAddress(xcallAddress, eventNames, flagNumber, updateCounter)
                    resolve(result)
                })
            )
        }

        const results = await Promise.all(fetchTasks)
        const finished = results.every((r) => r == true)

        return finished
    }

    private async fetchEventsByAddress(xcallAddress: string, eventNames: string[], flagNumber: string = '0', updateCounter: boolean = true) {
        // fetch all events once
        if (
            this.network == NETWORK.STELLAR ||
            this.network == NETWORK.SUI ||
            this.network == NETWORK.HAVAH ||
            this.network == NETWORK.IBC_ARCHWAY ||
            this.network == NETWORK.IBC_NEUTRON ||
            this.network == NETWORK.IBC_INJECTIVE
        ) {
            let finished = true
            finished &&= await this.fetchEventByAddress(xcallAddress, '', flagNumber, updateCounter)
            return finished
        } else {
            // fetch each event
            const _this = this
            let promiseTasks = []
            for (let i = 0; i < eventNames.length; i++) {
                // promiseTasks.push(this.fetchEvent(eventNames[i], flagNumber))

                // delay to prevent API rate limit
                const delay = 500 * i
                promiseTasks.push(
                    new Promise(async function (resolve) {
                        await new Promise((res) => setTimeout(res, delay))
                        let result = await _this.fetchEventByAddress(xcallAddress, eventNames[i], flagNumber, updateCounter)
                        resolve(result)
                    })
                )
            }
            const results = await Promise.all(promiseTasks)
            const finished = results.every((r) => r == true)

            if (finished) logger.info(`${this.scan.network} has no new events`)
            // await new Promise((f) => setTimeout(f, 1000))

            return finished
        }
    }

    private async fetchEventByAddress(xcallAddress: string, eventName: string, flagNumber: string = '0', updateCounter: boolean = true) {
        // skip if contract address is not configured
        if (xcallAddress == '0x0' || xcallAddress == '') {
            logger.info(`${this.scan.network} skip fetching because xcall contract is not configured`)
            return true
        }

        const counter = await this.getCounter(xcallAddress, eventName)
        let fromFlagNumber = flagNumber !== '0' ? flagNumber : counter.value

        logger.info(`${this.scan.network} fetching events ${counter.name} ${fromFlagNumber}`)

        let { lastFlag, eventLogs } = await this.scan.getEventLogs(fromFlagNumber, eventName, xcallAddress)

        for (let i = 0; i < eventLogs.length; i++) {
            let eventLog = eventLogs[i]

            if (eventLog.eventData) {
                await this.storeDb(eventLog)

                logger.info(
                    `${this.scan.network} fetched block:${eventLog.blockNumber} event:${eventLog.eventName} sn:${eventLog.eventData._sn ?? ''} nsn:${
                        eventLog.eventData._nsn ?? ''
                    } reqId:${eventLog.eventData._reqId ?? ''}`
                )
            }
        }

        const finished = lastFlag == counter.value
        if (!finished && updateCounter && lastFlag) await this._db.updateCounter(counter.name, lastFlag)

        return finished
    }
}

import logger from '../logger/logger'
import { Db } from '../../data/Db'
import { EVENT, NETWORK } from '../../common/constants'
import { IFletcher } from '../../interfaces/IFletcher'
import { IScan } from '../../interfaces/IScan'
import { EventLog } from '../../types/EventLog'
import { IconScan } from '../scan/IconScan'
import { HavahScan } from '../scan/HavahScan'
import { EvmScan } from '../scan/EvmScan'
import { EventModel } from '../../types/DataModels'
import { CosmosScan } from '../scan/CosmosScan'

export class Fletcher implements IFletcher {
    private _db = new Db()

    scan: IScan

    constructor(network: string) {
        this.scan = new IconScan(network)
        if (network == NETWORK.HAVAH) {
            this.scan = new HavahScan()
        }
        if (network == NETWORK.BSC || network == NETWORK.ETH2) {
            this.scan = new EvmScan(network)
        }
        if (network == NETWORK.IBC_ARCHWAY) {
            this.scan = new CosmosScan(network)
        }
    }

    private async storeDb(eventLog: EventLog) {
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
            // update sn to CallExecuted event
            const callMessageEvent = await this._db.getEventByReqId(this.scan.network, EVENT.CallMessage, eventLog.eventData?._reqId)
            if (callMessageEvent) {
                eventModel.sn = callMessageEvent.sn
                eventModel.from_raw = callMessageEvent.from_raw
                eventModel.to_raw = callMessageEvent.to_raw
                eventModel.from_decoded = callMessageEvent.from_decoded
                eventModel.to_decoded = callMessageEvent.to_decoded
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
    }

    async fletchEvents(eventNames: string[], flagNumber: number = 0) {
        // work arround to prevent api block
        if (this.scan.network == NETWORK.IBC_ARCHWAY) {
            // let finished = true
            // for (let i = 0; i < eventNames.length; i++) {
            //     finished &&= await this.fletchEvent(eventNames[i], flagNumber)
            //     await new Promise((f) => setTimeout(f, 1000 * 10))
            // }
            // return finished

            let finished = true
            finished &&= await this.fletchEvent('', flagNumber)
            return finished
        } else {
            let promiseTasks = []
            for (let i = 0; i < eventNames.length; i++) {
                promiseTasks.push(this.fletchEvent(eventNames[i], flagNumber))
            }
            const results = await Promise.all(promiseTasks)
            const finished = results.every((r) => r == true)

            if (finished) logger.info(`${this.scan.network} has no new events`)

            return finished
        }
    }

    async fletchEvent(eventName: string, flagNumber: number = 0) {
        const counter = await this.getCounter(eventName)
        let fromFlagNumber = flagNumber > 0 ? flagNumber : counter.value

        logger.info(`${this.scan.network} fetching events ${counter.name} ${fromFlagNumber}`)

        let { lastFlagNumber, eventLogs } = await this.scan.getEventLogs(fromFlagNumber, eventName)

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

        const finished = lastFlagNumber == counter.value
        if (!finished) await this._db.updateCounter(counter.name, lastFlagNumber)

        return finished
    }

    private async getCounter(eventName: string) {
        let counterName = `${this.scan.network}_${eventName}_${
            this.scan.network == NETWORK.HAVAH ? 'CountNumber' : this.scan.network == NETWORK.IBC_ARCHWAY ? 'BlockTimestamp' : 'BlockNumber'
        }`
        let counter = await this._db.getCounterByName(counterName)
        return counter
    }
}

import { EVENT, NETWORK } from './common/constants'
import { Db } from './data/Db'
import { IFletcher } from './interfaces/IFletcher'
import { IScan } from './interfaces/IScan'
import { EvmScan } from './modules/scan/EvmScan'
import { HavahScan } from './modules/scan/HavahScan'
import { IconScan } from './modules/scan/IconScan'
import { Fletcher } from './modules/fletcher/Fletcher'
import { Syncer } from './modules/syncer/Syncer'

const runCmd = async () => {
    // handle arguments
    const args = require('minimist')(process.argv.slice(2))?._
    console.log('args', args)
    const cmd = args[0]
    const network = args[1]

    let scan: IScan = new IconScan()
    if (network == NETWORK.HAVAH) {
        scan = new HavahScan()
    }
    if (network == NETWORK.BSC || network == NETWORK.ETH2) {
        scan = new EvmScan(network)
    }

    let fletcher: IFletcher = new Fletcher(network)

    // command
    if (cmd == 'initdb') {
        const db = new Db()
        const rs = await db.init()
        if (rs.rowCount > 0) console.log('init database successfully')
    }
    if (cmd == 'scan') {
        const event = args[2]
        const { lastFlagNumber, eventLogs } = await scan.getEventLogs(0, event)
        console.log('eventLogs', eventLogs)
    }
    if (cmd == 'fletch') {
        const event = args[2]

        if (event) {
            let fletched = false
            while (!fletched) {
                fletched = await fletcher.fletchEvents([event], 0)
            }
        } else {
            let fletched = false
            while (!fletched) {
                fletched = await fletcher.fletchEvents(
                    [
                        EVENT.CallMessageSent,
                        EVENT.ResponseMessage,
                        EVENT.RollbackMessage,
                        EVENT.RollbackExecuted,
                        EVENT.CallMessage,
                        EVENT.CallExecuted
                    ],
                    0
                )
            }
        }
    }
    if (cmd == 'sync') {
        const snFrom = args[1]
        const snTo = args[2] ?? snFrom
        const syncer = new Syncer()

        for (let sn = snFrom; sn <= snTo; sn++) {
            await syncer.syncMessage(sn)
        }
    }
}

runCmd()

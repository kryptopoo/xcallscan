import { EVENT, NETWORK } from './common/constants'
import { Db } from './data/Db'
import { IFletcher } from './interfaces/IFletcher'
import { IScan } from './interfaces/IScan'
import { EvmScan } from './modules/scan/EvmScan'
import { HavahScan } from './modules/scan/HavahScan'
import { IconScan } from './modules/scan/IconScan'
import { Fletcher } from './modules/fletcher/Fletcher'
import { Syncer } from './modules/syncer/Syncer'
import { CosmosScan } from './modules/scan/CosmosScan'

const runCmd = async () => {
    // handle arguments
    const args = require('minimist')(process.argv.slice(2))?._
    console.log('args', args)
    const cmd = args[0]

    // command
    if (cmd == 'db') {
        const act = args[1]
        const filename = args[2]
        const db = new Db()
        if (act == 'init') {
            const rs = await db.init()
            if (rs) console.log('init database successfully')
        }
        if (act == 'migrate') {
            const rs = await db.migrate(filename)
            if (rs) console.log('migrate database successfully')
        }
    }

    if (cmd == 'scan') {
        const network = args[1]

        let scan: IScan = new IconScan(network)
        if (network == NETWORK.HAVAH) {
            scan = new HavahScan()
        }
        if (network == NETWORK.BSC || network == NETWORK.ETH2) {
            scan = new EvmScan(network)
        }
        if (network == NETWORK.IBC_ARCHWAY) {
            scan = new CosmosScan(network)
        }

        const event = args[2]
        const { lastFlagNumber, eventLogs } = await scan.getEventLogs(0, event)
    }
    if (cmd == 'fletch') {
        const network = args[1]
        const event = args[2]
        let fletcher: IFletcher = new Fletcher(network)

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
        const networks = args[3] ? args[3].split(',') : []

        const syncer = new Syncer(networks)

        for (let sn = snFrom; sn <= snTo; sn++) {
            await syncer.syncMessage(sn)
        }
    }
}

runCmd()

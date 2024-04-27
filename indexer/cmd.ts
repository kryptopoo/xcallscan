import { EVENT, NETWORK } from './common/constants'
import { Db } from './data/Db'
import { IFetcher } from './interfaces/IFetcher'
import { IScan } from './interfaces/IScan'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'
import { ScanFactory } from './modules/scan/ScanFactory'

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
        const event = args[2]

        if (network == NETWORK.ICON || network == NETWORK.IBC_ICON || network == NETWORK.ETH2 || network == NETWORK.BSC || network == NETWORK.AVAX) {
            if (!event) {
                console.log('eventName is required')
                return
            }
        }

        let scan: IScan = ScanFactory.createScan(network)

        const { lastFlagNumber, eventLogs } = await scan.getEventLogs(0, event)
        console.log(eventLogs)
    }
    if (cmd == 'fetch') {
        const network = args[1]
        const event = args[2]
        let fetcher: IFetcher = new Fetcher(network)

        if (event) {
            let fetched = false
            while (!fetched) {
                fetched = await fetcher.fetchEvents([event], 0)
            }
        } else {
            let fetched = false
            while (!fetched) {
                fetched = await fetcher.fetchEvents(
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

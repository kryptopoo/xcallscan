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
        const flagNumber = args[3] ?? 0

        if (network == NETWORK.ICON || network == NETWORK.ETH2 || network == NETWORK.BSC || network == NETWORK.AVAX) {
            if (!event) {
                console.log('eventName is required')
                return
            }
        }

        let scan: IScan = ScanFactory.createScan(network)

        const { lastFlagNumber, eventLogs } = await scan.getEventLogs(flagNumber, event)
        console.log(
            eventLogs.map(function (item) {
                delete item.txRaw
                return item
            })
        )
    }
    if (cmd == 'fetch') {
        const network = args[1]
        const event = args[2].split(',')
        const flagNumber = args[3] ?? 0

        let fetcher: IFetcher = new Fetcher(network)

        if (event) {
            let fetched = false
            while (!fetched) {
                fetched = await fetcher.fetchEvents(event, flagNumber)
                if (flagNumber > 0) fetched = true
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
                    flagNumber
                )

                if (flagNumber > 0) fetched = true
            }
        }
    }
    if (cmd == 'sync') {
        const snFrom = args[1]
        const snTo = args[2] ?? snFrom
        const networks = args[3] ? args[3].split(',') : []
        const syncer = new Syncer(networks)

        if (snFrom > 0 && snTo > 0) {
            for (let sn = snFrom; sn <= snTo; sn++) {
                await syncer.syncMessage(sn)
            }
        } else {
            await syncer.syncNewMessages()
        }
    }
}

runCmd()

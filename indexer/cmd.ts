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
        const event = args[2]?.split(',')
        const flagNumber = args[3] ?? 0
        const updateCounter = false

        let fetcher: IFetcher = new Fetcher(network)

        if (event) {
            let fetched = false
            while (!fetched) {
                fetched = await fetcher.fetchEvents(event, flagNumber, updateCounter)
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
                    flagNumber,
                    updateCounter
                )

                if (flagNumber > 0) fetched = true
            }
        }
    }
    if (cmd == 'sync') {
        let snList = []
        if (args[1].indexOf(',') > 0) {
            snList = args[1].split(',')
        }
        if (args[1].indexOf('-') > 0) {
            const snFromTo = args[1].split('-')
            const snFrom = Number(snFromTo[0])
            const snTo = Number(snFromTo[1])
            for (let index = snFrom; index <= snTo; index++) {
                const sn = index;
                snList.push(sn)
            }
        }
        const networks = args[2] ? args[2].split(',') : []
        const syncer = new Syncer(networks)

        if (snList.length > 0) {
            for (let index = 0; index < snList.length; index++) {
                const sn = Number(snList[index]);
                await syncer.syncMessage(sn)
            }
        } else {
            await syncer.syncNewMessages()
        }
    }
}

runCmd()

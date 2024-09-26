import { CONTRACT, EVENT, NETWORK } from './common/constants'
import { Db } from './data/Db'
import { IFetcher } from './interfaces/IFetcher'
import { IScan } from './interfaces/IScan'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'
import { ScanFactory } from './modules/scan/ScanFactory'
import { MsgActionParser } from './modules/parser/MsgActionParser'

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
        const flagNumber = args[3] ?? '0'
        const xcallAddress = args[4] ?? CONTRACT[network].xcall[0]

        if (network == NETWORK.ICON || network == NETWORK.ETH2 || network == NETWORK.BSC || network == NETWORK.AVAX || network == NETWORK.POLYGON) {
            if (!event) {
                console.log('eventName is required')
                return
            }
        }

        let scan: IScan = ScanFactory.createScan(network)

        const { lastFlag, eventLogs } = await scan.getEventLogs(flagNumber, event, xcallAddress)
        console.log(
            'eventLogs',
            eventLogs.map(function (item) {
                delete item.txRaw
                return item
            })
        )
        console.log('lastFlag', lastFlag)
    }
    if (cmd == 'fetch') {
        const network = args[1]
        const event = args[2]?.split(',')
        const flagNumber = args[3] ?? 0
        const updateCounter = args[4] ? Boolean(args[4]) : false

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
        if (args[1].toString().indexOf(',') > 0) {
            snList = args[1].split(',')
        } else if (args[1].toString().indexOf('-') > 0) {
            const snFromTo = args[1].split('-')
            const snFrom = Number(snFromTo[0])
            const snTo = Number(snFromTo[1])
            for (let index = snFrom; index <= snTo; index++) {
                const sn = index
                snList.push(sn)
            }
        } else {
            const sn = Number(args[1])
            snList.push(sn)
        }
        const networks = args[2] ? args[2].split(',') : []
        const syncer = new Syncer(networks)

        if (snList.length > 0) {
            for (let index = 0; index < snList.length; index++) {
                const sn = Number(snList[index])
                await syncer.syncMessage(sn)
            }
        } else {
            await syncer.syncNewMessages()
        }
    }

    if (cmd == 'analyze') {
        const sn = args[1]
        const srcNetwork = args[2] ?? ''
        const destNetwork = args[3] ?? ''
        const storedb = args[4] ? Boolean(args[4]) : false
        const db = new Db()
        const actionParser = new MsgActionParser()

        db.getMessages(sn, srcNetwork, destNetwork).then((msgs) => {
            for (let index = 0; index < msgs.length; index++) {
                const msg = msgs[index]

                if (msg.src_tx_hash && msg.dest_tx_hash) {
                    console.log(`id:${msg.id} sn:${msg.sn} ${msg.src_network} ${msg.src_tx_hash} -> ${msg.dest_network} ${msg.dest_tx_hash}`)
                    actionParser.parseMgsAction(msg.src_network, msg.src_tx_hash, msg.dest_network, msg.dest_tx_hash).then((act) => {
                        console.log(`id:${msg.id} sn:${msg.sn} msg_action`, act)

                        if (act && storedb) {
                            db.updateMessageAction(msg.sn, msg.src_network, msg.dest_network, act.type, JSON.stringify(act.detail), act.amount_usd)
                        }
                    })
                }
            }
        })
    }
}

runCmd()

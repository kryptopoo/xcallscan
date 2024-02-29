import cron from 'node-cron'
import { EVENT, NETWORK } from './common/constants'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'

async function run() {
    // fetch data between networks
    cron.schedule('0 */2 * * * *', async () => {
        await Promise.all([
            fetch(NETWORK.ICON),
            fetch(NETWORK.HAVAH),
            fetch(NETWORK.BSC),
            fetch(NETWORK.ETH2),
            fetch(NETWORK.IBC_ARCHWAY),
            fetch(NETWORK.IBC_NEUTRON),
            fetch(NETWORK.IBC_INJECTIVE)
        ])
    })

    // sync new messages
    cron.schedule('30 */2 * * * *', async () => {
        const syncer = new Syncer([
            NETWORK.ICON,
            NETWORK.HAVAH,
            NETWORK.BSC,
            NETWORK.ETH2,
            NETWORK.IBC_ARCHWAY,
            NETWORK.IBC_NEUTRON,
            NETWORK.IBC_INJECTIVE
        ])
        await syncer.syncNewMessages()
    })

    // sync pending/unfinished messages
    cron.schedule('55 */2 * * * *', async () => {
        const syncer = new Syncer([
            NETWORK.ICON,
            NETWORK.HAVAH,
            NETWORK.BSC,
            NETWORK.ETH2,
            NETWORK.IBC_ARCHWAY,
            NETWORK.IBC_NEUTRON,
            NETWORK.IBC_INJECTIVE
        ])
        await syncer.syncUnfinishedMessages()
    })
}

const fetch = async (network: string) => {
    let fetcher = new Fetcher(network)
    let fetched = false
    while (!fetched) {
        fetched = await fetcher.fetchEvents([
            EVENT.CallMessageSent,
            EVENT.ResponseMessage,
            EVENT.RollbackMessage,
            EVENT.RollbackExecuted,
            EVENT.CallMessage,
            EVENT.CallExecuted
        ])
    }
}

run()

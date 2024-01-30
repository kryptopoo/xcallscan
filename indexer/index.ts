import cron from 'node-cron'
import { EVENT, NETWORK } from './common/constants'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'

async function run() {
    // ICON <-> EVM
    // fetch data between ICON <-> EVM  networks
    cron.schedule('0 * * * * *', async () => {
        await Promise.all([fetch(NETWORK.ICON), fetch(NETWORK.HAVAH), fetch(NETWORK.BSC), fetch(NETWORK.ETH2)])
    })
    // sync new messages
    cron.schedule('45 * * * * *', async () => {
        const syncer = new Syncer([NETWORK.ICON, NETWORK.HAVAH, NETWORK.BSC, NETWORK.ETH2])
        await syncer.syncNewMessages()
    })
    // sync pending/unfinished messages
    cron.schedule('15 */10 * * * *', async () => {
        const syncer = new Syncer([NETWORK.ICON, NETWORK.HAVAH, NETWORK.BSC, NETWORK.ETH2])
        await syncer.syncUnfinishedMessages()
    })

    // ICON <-> COSMOS
    // fetch data between ICON <-> COSMOS networks
    cron.schedule('0 */5 * * * *', async () => {
        await Promise.all([fetch(NETWORK.IBC_ICON), fetch(NETWORK.IBC_ARCHWAY), fetch(NETWORK.IBC_NEUTRON)])
    })
    // sync new messages
    cron.schedule('45 */5 * * * *', async () => {
        const syncer = new Syncer([NETWORK.IBC_ICON, NETWORK.IBC_ARCHWAY, NETWORK.IBC_NEUTRON])
        await syncer.syncNewMessages()
    })
    // sync pending/unfinished messages
    cron.schedule('15 */15 * * * *', async () => {
        const syncer = new Syncer([NETWORK.IBC_ICON, NETWORK.IBC_ARCHWAY, NETWORK.IBC_NEUTRON])
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

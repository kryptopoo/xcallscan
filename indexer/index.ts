import cron from 'node-cron'
import { EVENT, NETWORK } from './common/constants'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'

async function run() {
    const networks = Object.values(NETWORK)
    console.log('start indexing networks', networks)

    // fetch data between networks
    cron.schedule('0 */2 * * * *', async () => {
        await Promise.all(
            networks.map((network) => {
                return fetch(network)
            })
        )
    })

    // sync new messages
    cron.schedule('30 */2 * * * *', async () => {
        const syncer = new Syncer(networks)
        await syncer.syncNewMessages()
    })

    // sync pending/unfinished messages
    cron.schedule('55 */2 * * * *', async () => {
        const syncer = new Syncer(networks)
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

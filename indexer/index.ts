import cron from 'node-cron'
import { EVENT, NETWORK } from './common/constants'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'
import logger from './modules/logger/logger'

async function run() {
    const networks = Object.values(NETWORK)
    logger.info('start indexing networks', networks)

    // fetch data between networks
    // fetch ICON networks
    cron.schedule('0 */1 * * * *', async () => {
        await Promise.all(
            [NETWORK.ICON, NETWORK.HAVAH].map((network) => {
                return fetch(network)
            })
        )
    })
    // fetch evm networks
    cron.schedule('15 */1 * * * *', async () => {
        await Promise.all(
            [NETWORK.AVAX, NETWORK.BSC, NETWORK.BASE, NETWORK.ARBITRUM, NETWORK.OPTIMISM, NETWORK.ETH2].map((network) => {
                return fetch(network)
            })
        )
    })
    // fetch ibc networks
    cron.schedule('30 */1 * * * *', async () => {
        await Promise.all(
            [NETWORK.IBC_ARCHWAY, NETWORK.IBC_INJECTIVE, NETWORK.IBC_NEUTRON].map((network) => {
                return fetch(network)
            })
        )
    })

    // sync new messages
    cron.schedule('45 */1 * * * *', async () => {
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

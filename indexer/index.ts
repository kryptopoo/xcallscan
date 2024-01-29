import cron from 'node-cron'
import { EVENT, NETWORK } from './common/constants'
import { Fletcher } from './modules/fletcher/Fletcher'
import { Syncer } from './modules/syncer/Syncer'

async function run() {
    // ICON <-> EVM
    // fletch data between ICON <-> EVM  networks
    cron.schedule('0 * * * * *', async () => {
        await Promise.all([fletch(NETWORK.ICON), fletch(NETWORK.HAVAH), fletch(NETWORK.BSC), fletch(NETWORK.ETH2)])
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
    // fletch data between ICON <-> COSMOS networks
    cron.schedule('0 */5 * * * *', async () => {
        await Promise.all([fletch(NETWORK.IBC_ICON), fletch(NETWORK.IBC_ARCHWAY)])
    })
    // sync new messages
    cron.schedule('45 */5 * * * *', async () => {
        const syncer = new Syncer([NETWORK.IBC_ICON, NETWORK.IBC_ARCHWAY])
        await syncer.syncNewMessages()
    })
    // sync pending/unfinished messages
    cron.schedule('15 */15 * * * *', async () => {
        const syncer = new Syncer([NETWORK.IBC_ICON, NETWORK.IBC_ARCHWAY])
        await syncer.syncUnfinishedMessages()
    })
}

const fletch = async (network: string) => {
    let fletcher = new Fletcher(network)
    let fletched = false
    while (!fletched) {
        fletched = await fletcher.fletchEvents([
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

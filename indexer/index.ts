import cron from 'node-cron'
import { EVENT, NETWORK } from './common/constants'
import { Fletcher } from './modules/fletcher/Fletcher'
import { Syncer } from './modules/syncer/Syncer'

async function run() {
    // fletch data all networks
    cron.schedule('0 * * * * *', async () => {
        await Promise.all([fletch(NETWORK.ICON), fletch(NETWORK.HAVAH), fletch(NETWORK.BSC), fletch(NETWORK.ETH2)])
    })

    // sync new messages
    cron.schedule('45 * * * * *', async () => {
        const syncer = new Syncer()
        await syncer.syncNewMessages()
    })

    // sync pending/unfinished messages
    cron.schedule('15 */10 * * * *', async () => {
        const syncer = new Syncer()
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

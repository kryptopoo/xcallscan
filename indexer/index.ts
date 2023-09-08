import cron from 'node-cron'
import logger from './modules/logger/logger'
import { CONTRACT, EVENT, NETWORK } from './common/constants'
import { Fletcher } from './modules/fletcher/Fletcher'
import { SourceSyncer } from './modules/syncer/SourceSyncer'
import { IconScan } from './modules/scan/IconScan'
import { HavahScan } from './modules/scan/HavahScan'
import { EvmScan } from './modules/scan/EvmScan'
import { IFletcher } from './interfaces/IFletcher'

async function run() {
    // fletch data all networks
    cron.schedule('* * * * *', async () => {
        await Promise.all([fletch(NETWORK.ICON), fletch(NETWORK.HAVAH), fletch(NETWORK.BSC), fletch(NETWORK.ETH2)])
    })

    // TODO: sync messages
}

const fletch = async (network: string) => {
    let fletcher = new Fletcher(new IconScan())
    if (network == NETWORK.ICON) {
        fletcher = new Fletcher(new IconScan())
    }
    if (network == NETWORK.HAVAH) {
        fletcher = new Fletcher(new HavahScan())
    }
    if (network == NETWORK.BSC || network == NETWORK.ETH2) {
        fletcher = new Fletcher(new EvmScan(network))
    }

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

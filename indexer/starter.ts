import cron from 'node-cron'
import { CONTRACT, EVENT, NETWORK, USE_MAINNET } from './common/constants'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'
import logger, { subscriberLogger as ssLogger } from './modules/logger/logger'
import { Ws } from './modules/ws/ws'
import dotenv from 'dotenv'
import { IconDecoder } from './modules/decoder/IconDecoder'
import { IconSubscriber } from './modules/subscriber/IconSubscriber'
import { EvmSubscriber } from './modules/subscriber/EvmSubscriber'
import { IbcSubscriber } from './modules/subscriber/IbcSubscriber'
import { EvmDecoder } from './modules/decoder/EvmDecoder'
dotenv.config()

const startIndexer = async () => {
    logger.info('start indexer...')

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

    const interval = USE_MAINNET ? 1 : 5 // in minutes
    const networks = Object.values(NETWORK)
    const syncer = new Syncer(networks)
    logger.info('start indexing networks', networks)

    // fetch data between networks
    // fetch ICON networks
    cron.schedule(`*/30 * * * * *`, async () => {
        await fetch(NETWORK.ICON)
    })

    // fetch evm networks
    cron.schedule(`30 */${interval} * * * *`, async () => {
        await Promise.all(
            [NETWORK.AVAX, NETWORK.BSC, NETWORK.BASE, NETWORK.ARBITRUM, NETWORK.OPTIMISM, NETWORK.ETH2, NETWORK.HAVAH, NETWORK.POLYGON].map(
                (network) => {
                    return fetch(network)
                }
            )
        )
    })

    // fetch ibc networks
    cron.schedule(`30 */${interval} * * * *`, async () => {
        await Promise.all(
            [NETWORK.IBC_ARCHWAY, NETWORK.IBC_INJECTIVE, NETWORK.IBC_NEUTRON].map((network) => {
                return fetch(network)
            })
        )
    })

    // fetch sui network
    cron.schedule(`30 */${interval} * * * *`, async () => {
        await Promise.all(
            [NETWORK.SUI].map((network) => {
                return fetch(network)
            })
        )
    })

    // sync messages
    cron.schedule(`15,45 * * * * *`, async () => {
        await syncer.syncNewMessages()
    })
    cron.schedule(`20,50 * * * * *`, async () => {
        await syncer.syncUnfinishedMessages()
    })
}

const startWs = () => {
    logger.info('start websocket...')

    const wsPort = process.env.WS_PORT ?? 8080
    const ws = new Ws(Number(wsPort))
    ws.start()
}

const startSubscriber = () => {
    logger.info('start subscriber...')

    const subscribers = [
        // ICON
        new IconSubscriber(NETWORK.ICON),

        // EVM
        new EvmSubscriber(NETWORK.ARBITRUM),
        new EvmSubscriber(NETWORK.BASE),
        new EvmSubscriber(NETWORK.OPTIMISM),
        new EvmSubscriber(NETWORK.AVAX),
        new EvmSubscriber(NETWORK.ETH2),
        new EvmSubscriber(NETWORK.BSC),

        // IBC
        new IbcSubscriber(NETWORK.IBC_INJECTIVE),
        new IbcSubscriber(NETWORK.IBC_ARCHWAY)
    ]

    for (let i = 0; i < subscribers.length; i++) {
        const subscriber = subscribers[i]
        subscriber.subscribe((data: any) => {
            ssLogger.info(`${subscriber.network} subscribe data ${JSON.stringify(data)}`)
        })
    }
}

export default { startIndexer, startWs, startSubscriber }

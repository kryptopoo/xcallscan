import cron from 'node-cron'
import { CONTRACT, EVENT, NETWORK, USE_MAINNET } from './common/constants'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'
import logger from './modules/logger/logger'
import { Ws } from './modules/ws/ws'
import dotenv from 'dotenv'
import { IconDecoder } from './modules/decoder/IconDecoder'
import { IconSubscriber } from './modules/subscriber/IconSubscriber'
import { EvmSubscriber } from './modules/subscriber/EvmSubscriber'
import { IbcSubscriber } from './modules/subscriber/IbcSubscriber'
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

    const abi = require('./abi/xcall.abi.json')

    // ICON
    const iconSubscriber = new IconSubscriber(NETWORK.ICON, CONTRACT[NETWORK.ICON].xcall[0], new IconDecoder())
    iconSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${iconSubscriber.network} callback ${JSON.stringify(data)}`)
    })

    // ARBITRUM
    const arbSubscriber = new EvmSubscriber(NETWORK.ARBITRUM, CONTRACT[NETWORK.ARBITRUM].xcall[0], abi)
    arbSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${arbSubscriber.network} callback ${JSON.stringify(data)}`)
    })

    // AVAX
    const avaxSubscriber = new EvmSubscriber(NETWORK.AVAX, CONTRACT[NETWORK.AVAX].xcall[0], abi)
    avaxSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${avaxSubscriber.network} callback ${JSON.stringify(data)}`)
    })

    // IBC_INJECTIVE
    const injSubscriber = new IbcSubscriber(NETWORK.IBC_INJECTIVE, CONTRACT[NETWORK.IBC_INJECTIVE].xcall[0])
    injSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${injSubscriber.network} callback ${JSON.stringify(data)}`)
    })

    // IBC_ARCHWAY
    const archSubscriber = new IbcSubscriber(NETWORK.IBC_ARCHWAY, CONTRACT[NETWORK.IBC_ARCHWAY].xcall[0])
    archSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${archSubscriber.network} callback ${JSON.stringify(data)}`)
    })
}

export default { startIndexer, startWs, startSubscriber }

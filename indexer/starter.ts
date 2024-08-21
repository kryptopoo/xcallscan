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

    // ICON
    const iconSubscriber = new IconSubscriber(NETWORK.ICON)
    iconSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${iconSubscriber.network} callback ${JSON.stringify(data)}`)
    })

    // ARBITRUM
    const arbSubscriber = new EvmSubscriber(NETWORK.ARBITRUM)
    arbSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${arbSubscriber.network} callback ${JSON.stringify(data)}`)
    })
    // BASE
    const baseSubscriber = new EvmSubscriber(NETWORK.BASE)
    baseSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${baseSubscriber.network} callback ${JSON.stringify(data)}`)
    })
    // // OP
    // const opSubscriber = new EvmSubscriber(NETWORK.OPTIMISM)
    // opSubscriber.subscribe((data: any) => {
    //     logger.info(`[subscriber] ${opSubscriber.network} callback ${JSON.stringify(data)}`)
    // })

    // AVAX
    const avaxSubscriber = new EvmSubscriber(NETWORK.AVAX)
    avaxSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${avaxSubscriber.network} callback ${JSON.stringify(data)}`)
    })
    // BSC
    const bscSubscriber = new EvmSubscriber(NETWORK.BSC)
    bscSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${bscSubscriber.network} callback ${JSON.stringify(data)}`)
    })
    // // ETH
    // const ethSubscriber = new EvmSubscriber(NETWORK.ETH2)
    // ethSubscriber.subscribe((data: any) => {
    //     logger.info(`[subscriber] ${ethSubscriber.network} callback ${JSON.stringify(data)}`)
    // })

    // IBC_INJECTIVE
    const injSubscriber = new IbcSubscriber(NETWORK.IBC_INJECTIVE)
    injSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${injSubscriber.network} callback ${JSON.stringify(data)}`)
    })
    // IBC_ARCHWAY
    const archSubscriber = new IbcSubscriber(NETWORK.IBC_ARCHWAY)
    archSubscriber.subscribe((data: any) => {
        logger.info(`[subscriber] ${archSubscriber.network} callback ${JSON.stringify(data)}`)
    })
}

export default { startIndexer, startWs, startSubscriber }

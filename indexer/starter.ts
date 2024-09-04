import cron from 'node-cron'
import { CONTRACT, EVENT, NETWORK, SUBSCRIBER_NETWORKS, USE_MAINNET } from './common/constants'
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
import { IFetcher } from './interfaces/IFetcher'
import { HavahSubscriber } from './modules/subscriber/HavahSubscriber'
import { ISubscriber } from './interfaces/ISubcriber'
import { sleep } from './common/helper'

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

    const subscribers: { [network: string]: ISubscriber } = {
        // ICON
        [NETWORK.ICON]: new IconSubscriber(NETWORK.ICON, CONTRACT[NETWORK.ICON].xcall[0]),

        // EVM
        [NETWORK.ARBITRUM]: new EvmSubscriber(NETWORK.ARBITRUM),
        [NETWORK.BASE]: new EvmSubscriber(NETWORK.BASE),
        [NETWORK.OPTIMISM]: new EvmSubscriber(NETWORK.OPTIMISM),
        [NETWORK.AVAX]: new EvmSubscriber(NETWORK.AVAX),
        [NETWORK.BSC]: new EvmSubscriber(NETWORK.BSC),
        [NETWORK.ETH2]: new EvmSubscriber(NETWORK.ETH2),
        [NETWORK.POLYGON]: new EvmSubscriber(NETWORK.POLYGON),

        // IBC
        [NETWORK.IBC_INJECTIVE]: new IbcSubscriber(NETWORK.IBC_INJECTIVE),
        [NETWORK.IBC_ARCHWAY]: new IbcSubscriber(NETWORK.IBC_ARCHWAY),
        [NETWORK.IBC_NEUTRON]: new IbcSubscriber(NETWORK.IBC_NEUTRON)
    }
    // havah is an exception case
    for (let index = 0; index < CONTRACT[NETWORK.HAVAH].xcall.length; index++) {
        subscribers[NETWORK.HAVAH] = new HavahSubscriber(NETWORK.HAVAH, CONTRACT[NETWORK.HAVAH].xcall[index])
    }

    const fetchers: { [network: string]: IFetcher } = {
        // ICON
        [NETWORK.ICON]: new Fetcher(NETWORK.ICON),
        [NETWORK.HAVAH]: new Fetcher(NETWORK.HAVAH),

        // EVM
        [NETWORK.ARBITRUM]: new Fetcher(NETWORK.ARBITRUM),
        [NETWORK.BASE]: new Fetcher(NETWORK.BASE),
        [NETWORK.OPTIMISM]: new Fetcher(NETWORK.OPTIMISM),
        [NETWORK.AVAX]: new Fetcher(NETWORK.AVAX),
        [NETWORK.BSC]: new Fetcher(NETWORK.BSC),
        [NETWORK.ETH2]: new Fetcher(NETWORK.ETH2),
        [NETWORK.POLYGON]: new Fetcher(NETWORK.POLYGON),

        // IBC
        [NETWORK.IBC_INJECTIVE]: new Fetcher(NETWORK.IBC_INJECTIVE),
        [NETWORK.IBC_ARCHWAY]: new Fetcher(NETWORK.IBC_ARCHWAY),
        [NETWORK.IBC_NEUTRON]: new Fetcher(NETWORK.IBC_NEUTRON)
    }

    const syncers: { [network: string]: Syncer } = {
        // ICON
        [NETWORK.ICON]: new Syncer([
            NETWORK.ICON,
            NETWORK.HAVAH,
            NETWORK.ARBITRUM,
            NETWORK.BASE,
            NETWORK.OPTIMISM,
            NETWORK.AVAX,
            NETWORK.BSC,
            NETWORK.ETH2,
            NETWORK.POLYGON,
            NETWORK.IBC_INJECTIVE,
            NETWORK.IBC_ARCHWAY,
            NETWORK.IBC_NEUTRON
        ]),
        [NETWORK.HAVAH]: new Syncer([NETWORK.ICON, NETWORK.HAVAH]),

        // EVM
        [NETWORK.ARBITRUM]: new Syncer([NETWORK.ICON, NETWORK.ARBITRUM]),
        [NETWORK.BASE]: new Syncer([NETWORK.ICON, NETWORK.BASE]),
        [NETWORK.OPTIMISM]: new Syncer([NETWORK.ICON, NETWORK.OPTIMISM]),
        [NETWORK.AVAX]: new Syncer([NETWORK.ICON, NETWORK.AVAX]),
        [NETWORK.BSC]: new Syncer([NETWORK.ICON, NETWORK.BSC]),
        [NETWORK.ETH2]: new Syncer([NETWORK.ICON, NETWORK.ETH2]),
        [NETWORK.POLYGON]: new Syncer([NETWORK.ICON, NETWORK.POLYGON]),

        // IBC
        [NETWORK.IBC_INJECTIVE]: new Syncer([NETWORK.ICON, NETWORK.IBC_INJECTIVE]),
        [NETWORK.IBC_ARCHWAY]: new Syncer([NETWORK.ICON, NETWORK.IBC_ARCHWAY]),
        [NETWORK.IBC_NEUTRON]: new Syncer([NETWORK.ICON, NETWORK.IBC_NEUTRON])
    }

    for (let i = 0; i < SUBSCRIBER_NETWORKS.length; i++) {
        const network = SUBSCRIBER_NETWORKS[i]
        const subscriber = subscribers[network]
        if (subscriber) {
            subscriber.subscribe(async (data) => {
                ssLogger.info(`${subscriber.network} subscribe data ${JSON.stringify(data)}`)

                try {
                    // this event should be come after CallMessage
                    if (data.eventName == EVENT.CallExecuted) await sleep(1000)
                    await fetchers[subscriber.network].storeDb(data)
                    const sn = data.eventData._sn
                    if (sn) {
                        await syncers[subscriber.network].syncMessage(sn)
                        ssLogger.info(`${subscriber.network} syncMessage ${sn}`)
                    } else {
                        await syncers[subscriber.network].syncNewMessages()
                        ssLogger.info(`${subscriber.network} syncNewMessages`)
                    }
                } catch (error) {
                    ssLogger.error(`${subscriber.network} error ${JSON.stringify(error)}`)
                }
            })
        }
    }
}

export default { startIndexer, startWs, startSubscriber }

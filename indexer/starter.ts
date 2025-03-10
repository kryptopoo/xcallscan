import cron from 'node-cron'
import { BTP_NETWORK_ID, CONTRACT, EVENT, INTENTS_EVENT, MSG_STATUS, NETWORK, SUBSCRIBER_NETWORKS, USE_MAINNET } from './common/constants'
import { Fetcher } from './modules/fetcher/Fetcher'
import { Syncer } from './modules/syncer/Syncer'
import { getNetwork, sleep } from './common/helper'
import { Ws } from './modules/ws/ws'
import { IFetcher } from './interfaces/IFetcher'
import { SubscriberFactory } from './modules/subscriber/SubscriberFactory'
import { Analyzer } from './modules/analyzer/Analyzer'
import logger from './modules/logger/logger'
import { Db } from './data/Db'
import { IntentsFetcher } from './modules/fetcher/IntentsFetcher'

import dotenv from 'dotenv'
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
    logger.info(`start indexing networks ${JSON.stringify(networks)}`)

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

    // fetch others network
    cron.schedule(`30 */${interval} * * * *`, async () => {
        await Promise.all(
            [NETWORK.SUI, NETWORK.STELLAR, NETWORK.SOLANA].map((network) => {
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

    // only subscribe networks in .env
    const subscribers = SUBSCRIBER_NETWORKS.map((network) => SubscriberFactory.createSubscriber(network))

    // xcall fetcher
    const fetchers: { [network: string]: IFetcher } = {}
    SUBSCRIBER_NETWORKS.forEach((network) => {
        fetchers[network] = new Fetcher(network)
    })

    // intents fetcher
    const intentsFetcher = new IntentsFetcher()

    for (let i = 0; i < subscribers.length; i++) {
        const subscriber = subscribers[i]
        if (subscriber) {
            // xcall
            if (CONTRACT[subscriber.network].xcall.length > 0) {
                subscriber.subscribe(CONTRACT[subscriber.network].xcall, Object.values(EVENT), [], async (data) => {
                    subscriber.logger.info(`${subscriber.network} subscribe data ${JSON.stringify(data)}`)

                    try {
                        // this event should be come after CallMessage
                        if (data.eventName == EVENT.CallExecuted) await sleep(1000)

                        // store db
                        const eventModel = await fetchers[subscriber.network].storeDb(data)
                        subscriber.logger.info(`${subscriber.network} storeDb ${JSON.stringify(eventModel)}`)

                        // init syncer corresponding networks
                        const syncerNetworks = subscriber.network != NETWORK.ICON ? [NETWORK.ICON, subscriber.network] : [NETWORK.ICON]
                        const srcNetwork = getNetwork(eventModel.from_decoded || '')
                        const destNetwork = getNetwork(eventModel.to_decoded || '')
                        if (srcNetwork && !syncerNetworks.includes(srcNetwork)) syncerNetworks.push(srcNetwork)
                        if (destNetwork && !syncerNetworks.includes(destNetwork)) syncerNetworks.push(destNetwork)
                        const syncer = new Syncer(syncerNetworks)

                        // sync message with specific networks
                        const sn = eventModel.sn
                        if (sn) {
                            await syncer.syncMessage(sn)
                            subscriber.logger.info(
                                `${subscriber.network} syncMessage networks:${JSON.stringify(syncerNetworks)} event:${data.eventName} sn:${sn}`
                            )
                        } else {
                            await syncer.syncNewMessages()
                            subscriber.logger.info(
                                `${subscriber.network} syncNewMessages networks:${JSON.stringify(syncerNetworks)} event:${data.eventName}`
                            )
                        }
                    } catch (error) {
                        subscriber.logger.error(`${subscriber.network} error ${JSON.stringify(error)}`)
                    }
                })
            }

            // intents
            if (CONTRACT[subscriber.network].intents.length > 0) {
                subscriber.subscribe(CONTRACT[subscriber.network].intents, Object.values(INTENTS_EVENT), [], async (data) => {
                    subscriber.logger.info(`${subscriber.network} subscribe data ${JSON.stringify(data)}`)

                    await intentsFetcher.storeDb(subscriber.network, data)
                })
            }
        }
    }
}

const startAnalyzer = () => {
    logger.info('start analyzer...')

    const analyzer = new Analyzer()
    analyzer.start()
}

export default { startIndexer, startWs, startSubscriber, startAnalyzer }

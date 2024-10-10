import TestnetDeployment from '../configs/testnet_deployment.json'
import MainnetDeployment from '../configs/mainnet_deployment.json'
import dotenv from 'dotenv'
dotenv.config()

const USE_MAINNET = process.env.USE_MAINNET == 'true'
const CONFIG_NETWORKS = USE_MAINNET ? MainnetDeployment.networks : TestnetDeployment.networks
const CONFIG_CONTRACTS = USE_MAINNET ? MainnetDeployment.contracts : TestnetDeployment.contracts

const WEB3_ALCHEMY_API_KEY = process.env.WEB3_ALCHEMY_API_KEY
const WEB3_BLAST_API_KEY = process.env.WEB3_BLAST_API_KEY
const WEB3_CHAINSTACK_API_KEY = process.env.WEB3_CHAINSTACK_API_KEY
const WEB3_BLOCKVISION_API_KEY = process.env.WEB3_BLOCKVISION_API_KEY
const WEB3_ANKR_API_KEY = process.env.WEB3_ANKR_API_KEY
const WEB3_INSTANTNODES_API_KEY = process.env.WEB3_INSTANTNODES_API_KEY

const NETWORK = {
    ICON: 'icon',
    BSC: 'bsc',
    ETH2: 'eth2',
    HAVAH: 'havah',
    IBC_ARCHWAY: 'ibc_archway',
    IBC_NEUTRON: 'ibc_neutron',
    IBC_INJECTIVE: 'ibc_injective',
    AVAX: 'avax',
    BASE: 'base',
    ARBITRUM: 'arbitrum',
    OPTIMISM: 'optimism',
    SUI: 'sui',
    POLYGON: 'polygon',
    STELLAR: 'stellar',
    SOLANA: 'solana'
}

const buildRpcUrls = (rpcUrls: string[]) => {
    const correctRpcUrls: string[] = []
    rpcUrls.forEach((rpcUrl) => {
        if (rpcUrl.includes('blockvision')) correctRpcUrls.push(`${rpcUrl}/${WEB3_BLOCKVISION_API_KEY}`)
        else if (rpcUrl.includes('alchemy')) correctRpcUrls.push(`${rpcUrl}/${WEB3_ALCHEMY_API_KEY}`)
        else if (rpcUrl.includes('chainstack')) correctRpcUrls.push(`${rpcUrl}/${WEB3_CHAINSTACK_API_KEY}`)
        else if (rpcUrl.includes('blastapi')) correctRpcUrls.push(`${rpcUrl}/${WEB3_BLAST_API_KEY}`)
        else if (rpcUrl.includes('ankr')) correctRpcUrls.push(`${rpcUrl}/${WEB3_ANKR_API_KEY}`)
        else if (rpcUrl.includes('instantnodes')) correctRpcUrls.push(`${rpcUrl}/token-${WEB3_INSTANTNODES_API_KEY}`)
        else correctRpcUrls.push(rpcUrl)
    })

    return correctRpcUrls
}

const RPC_URLS: { [network: string]: string[] } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.rpcs,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.rpcs,

    [NETWORK.BSC]: buildRpcUrls(CONFIG_NETWORKS.bsc.rpcs),
    [NETWORK.ETH2]: buildRpcUrls(CONFIG_NETWORKS.eth2.rpcs),
    [NETWORK.AVAX]: buildRpcUrls(CONFIG_NETWORKS.avax.rpcs),
    [NETWORK.BASE]: buildRpcUrls(CONFIG_NETWORKS.base.rpcs),
    [NETWORK.ARBITRUM]: buildRpcUrls(CONFIG_NETWORKS.arbitrum.rpcs),
    [NETWORK.OPTIMISM]: buildRpcUrls(CONFIG_NETWORKS.optimism.rpcs),
    [NETWORK.POLYGON]: buildRpcUrls(CONFIG_NETWORKS.polygon.rpcs),

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.rpcs,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.rpcs,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.rpcs,

    [NETWORK.SUI]: buildRpcUrls(CONFIG_NETWORKS.sui.rpcs),
    [NETWORK.STELLAR]: buildRpcUrls(CONFIG_NETWORKS.stellar.rpcs),
    [NETWORK.SOLANA]: buildRpcUrls(CONFIG_NETWORKS.solana.rpcs)
}

const WSS_URLS: { [network: string]: string[] } = {
    // https will be auto replaced wss in iconService
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.wss,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.wss,

    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.wss,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.wss,
    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.wss,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.wss,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.wss,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.wss,
    [NETWORK.POLYGON]: CONFIG_NETWORKS.polygon.wss,

    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.wss,
    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.wss,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.wss,

    [NETWORK.SUI]: CONFIG_NETWORKS.solana.wss,
    [NETWORK.STELLAR]: CONFIG_NETWORKS.stellar.wss,
    [NETWORK.SOLANA]: CONFIG_NETWORKS.solana.wss
}

const SUBSCRIBER_NETWORKS = process.env.SUBSCRIBER_NETWORKS ? process.env.SUBSCRIBER_NETWORKS.split(',') : []
const SUBSCRIBER_INTERVAL = process.env.SUBSCRIBER_INTERVAL ? Number(process.env.SUBSCRIBER_INTERVAL) : 4000

const API_URL: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.api,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.api,

    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.api,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.api,
    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.api,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.api,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.api,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.api,
    [NETWORK.POLYGON]: CONFIG_NETWORKS.polygon.api,

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.api,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.api,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.api,

    [NETWORK.SUI]: CONFIG_NETWORKS.sui.api,
    [NETWORK.STELLAR]: CONFIG_NETWORKS.stellar.api,
    [NETWORK.SOLANA]: CONFIG_NETWORKS.solana.api
}

const BTP_NETWORK_ID: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.btp_network_id,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.btp_network_id,

    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.btp_network_id,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.btp_network_id,
    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.btp_network_id,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.btp_network_id,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.btp_network_id,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.btp_network_id,
    [NETWORK.POLYGON]: CONFIG_NETWORKS.polygon.btp_network_id,

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.btp_network_id,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.btp_network_id,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.btp_network_id,

    [NETWORK.SUI]: CONFIG_NETWORKS.sui.btp_network_id,
    [NETWORK.STELLAR]: CONFIG_NETWORKS.stellar.btp_network_id,
    [NETWORK.SOLANA]: CONFIG_NETWORKS.solana.btp_network_id
}

const API_KEY: { [network: string]: string } = {
    [NETWORK.ICON]: '',
    [NETWORK.HAVAH]: '',

    [NETWORK.BSC]: process.env.SCAN_BSC_API_KEY ?? '',
    [NETWORK.ETH2]: process.env.SCAN_ETH_API_KEY ?? '',
    [NETWORK.BASE]: process.env.SCAN_BASE_API_KEY ?? '',
    [NETWORK.ARBITRUM]: process.env.SCAN_ARBITRUM_API_KEY ?? '',
    [NETWORK.OPTIMISM]: process.env.SCAN_OPTIMISM_API_KEY ?? '',
    [NETWORK.POLYGON]: process.env.SCAN_POLYGON_API_KEY ?? '',

    [NETWORK.IBC_ARCHWAY]: process.env.SCAN_MINTSCAN_API_KEY ?? '',
    [NETWORK.IBC_NEUTRON]: '',
    [NETWORK.IBC_INJECTIVE]: ''
}

const SERVICE_API_KEY = {
    SCRAPING_ANT: process.env.SCRAPING_ANT_API_KEY ?? ''
}

const CONTRACT: { [network: string]: { xcall: string[] } } = {
    [NETWORK.ICON]: {
        xcall: CONFIG_CONTRACTS.icon.xcall
    },
    [NETWORK.HAVAH]: {
        xcall: CONFIG_CONTRACTS.havah.xcall
    },

    // EVM
    [NETWORK.BSC]: {
        xcall: CONFIG_CONTRACTS.bsc.xcall
    },
    [NETWORK.ETH2]: {
        xcall: CONFIG_CONTRACTS.eth2.xcall
    },
    [NETWORK.AVAX]: {
        xcall: CONFIG_CONTRACTS.avax.xcall
    },
    [NETWORK.POLYGON]: {
        xcall: CONFIG_CONTRACTS.polygon.xcall
    },
    [NETWORK.BASE]: {
        xcall: CONFIG_CONTRACTS.base.xcall
    },
    [NETWORK.ARBITRUM]: {
        xcall: CONFIG_CONTRACTS.arbitrum.xcall
    },
    [NETWORK.OPTIMISM]: {
        xcall: CONFIG_CONTRACTS.optimism.xcall
    },

    // IBC
    [NETWORK.IBC_ARCHWAY]: {
        xcall: CONFIG_CONTRACTS.ibc_archway.xcall
    },
    [NETWORK.IBC_NEUTRON]: {
        xcall: CONFIG_CONTRACTS.ibc_neutron.xcall
    },
    [NETWORK.IBC_INJECTIVE]: {
        xcall: CONFIG_CONTRACTS.ibc_injective.xcall
    },

    // SUI
    [NETWORK.SUI]: {
        xcall: CONFIG_CONTRACTS.sui.xcall
    },
    // STELLAR
    [NETWORK.STELLAR]: {
        xcall: CONFIG_CONTRACTS.stellar.xcall
    },
    // SOLANA
    [NETWORK.SOLANA]: {
        xcall: CONFIG_CONTRACTS.solana.xcall
    }
}

const SCAN_FROM_FLAG_NUMBER: { [network: string]: number } = {
    [NETWORK.ICON]: 0,
    [NETWORK.BSC]: 0,
    [NETWORK.ETH2]: 0,
    [NETWORK.HAVAH]: 0,

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.block_timestamp,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.block_timestamp,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.block_timestamp
}

const EVENT = {
    // xcall source events
    CallMessageSent: 'CallMessageSent',
    ResponseMessage: 'ResponseMessage',
    RollbackMessage: 'RollbackMessage',
    RollbackExecuted: 'RollbackExecuted',

    // xcall destination events
    CallMessage: 'CallMessage',
    CallExecuted: 'CallExecuted',

    // dapp
    MessageReceived: 'MessageReceived'
}

const MSG_STATUS = {
    Pending: 'pending',
    Delivered: 'delivered',
    Executed: 'executed',
    Rollbacked: 'rollbacked',
    Failed: 'failed'
}

export {
    USE_MAINNET,
    NETWORK,
    API_URL,
    API_KEY,
    CONTRACT,
    EVENT,
    MSG_STATUS,
    RPC_URLS,
    BTP_NETWORK_ID,
    SERVICE_API_KEY,
    SCAN_FROM_FLAG_NUMBER,
    WSS_URLS,
    SUBSCRIBER_NETWORKS,
    SUBSCRIBER_INTERVAL,
    WEB3_ALCHEMY_API_KEY,
    WEB3_CHAINSTACK_API_KEY,
    WEB3_BLAST_API_KEY,
    WEB3_BLOCKVISION_API_KEY,
    WEB3_ANKR_API_KEY
}

import TestnetDeployment from '../configs/testnet_deployment.json'
import MainnetDeployment from '../configs/mainnet_deployment.json'
import dotenv from 'dotenv'
dotenv.config()

const USE_MAINNET = process.env.USE_MAINNET == 'true'
const CONFIG_NETWORKS = USE_MAINNET ? MainnetDeployment.networks : TestnetDeployment.networks
const CONFIG_CONTRACTS = USE_MAINNET ? MainnetDeployment.contracts : TestnetDeployment.contracts

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
    POLYGON: 'polygon'
}

const RPC_URL: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.uri,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.uri,

    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.uri,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.uri,
    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.uri,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.uri,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.uri,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.uri,
    [NETWORK.POLYGON]: CONFIG_NETWORKS.polygon.uri,

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.uri,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.uri,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.uri,

    
}

const RPC_URLS: { [network: string]: string[] } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.uris,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.uris,

    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.uris,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.uris,
    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.uris,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.uris,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.uris,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.uris,
    [NETWORK.POLYGON]: CONFIG_NETWORKS.polygon.uris,

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.uris,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.uris,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.uris,
}

const WEB3_ALCHEMY_API_KEY = process.env.WEB3_ALCHEMY_API_KEY
const WEB3_BLAST_API_KEY = process.env.WEB3_BLAST_API_KEY
const WEB3_CHAINSTACK_API_KEY = process.env.WEB3_CHAINSTACK_API_KEY
const WSS: { [network: string]: string[] } = {
    [NETWORK.ICON]: ['https://ctz.solidwallet.io/api/v3/icon_dex'],
    [NETWORK.HAVAH]: ['https://ctz.havah.io/api/v3/icon_dex'],

    [NETWORK.BSC]: [`https://bnb-mainnet.g.alchemy.com/v2/${WEB3_ALCHEMY_API_KEY}`],
    [NETWORK.ETH2]: [`https://eth-mainnet.g.alchemy.com/v2/${WEB3_ALCHEMY_API_KEY}`],
    // [NETWORK.AVAX]: [`https://avax-mainnet.g.alchemy.com/v2/${WEB3_ALCHEMY_API_KEY}`],
    [NETWORK.AVAX]: [`https://avalanche-mainnet.core.chainstack.com/ext/bc/C/rpc/${WEB3_CHAINSTACK_API_KEY}`],
    [NETWORK.BASE]: [`https://base-mainnet.g.alchemy.com/v2/${WEB3_ALCHEMY_API_KEY}`],
    [NETWORK.ARBITRUM]: [`https://arb-mainnet.g.alchemy.com/v2/${WEB3_ALCHEMY_API_KEY}`],
    [NETWORK.OPTIMISM]: [`https://opt-mainnet.g.alchemy.com/v2/${WEB3_ALCHEMY_API_KEY}`],
    [NETWORK.POLYGON]: [`https://polygon-mainnet.g.alchemy.com/v2/${WEB3_ALCHEMY_API_KEY}`],

    [NETWORK.IBC_INJECTIVE]: [
        'wss://sentry.tm.injective.network:443/websocket',
        'wss://rpc-injective.whispernode.com:443/websocket',
        'wss://injective-rpc.lavenderfive.com:443/websocket',
        'wss://rpc-injective.ecostake.com:443/websocket',
        'wss://injective-rpc.highstakes.ch:443/websocket'
    ],
    [NETWORK.IBC_ARCHWAY]: [
        'wss://rpc.mainnet.archway.io:443/websocket',
        'wss://rpc-archway.mzonder.com:443/websocket',
        'wss://archway-mainnet.rpc.l0vd.com:443/websocket',
        'wss://rpc-archway.whispernode.com:443/websocket',
        'wss://archway-rpc.lavenderfive.com:443/websocket'
    ],
    [NETWORK.IBC_NEUTRON]: [
        'wss://rpc.neutron.quokkastake.io:443/websocket',
        'wss://neutron-rpc.publicnode.com:443/websocket',
        'wss://rpc-neutron.whispernode.com:443/websocket'
    ]
}

const SUBSCRIBER_NETWORKS = process.env.SUBSCRIBER_NETWORKS ? process.env.SUBSCRIBER_NETWORKS.split(',') : []
const SUBSCRIBER_INTERVAL = process.env.SUBSCRIBER_INTERVAL ? Number(process.env.SUBSCRIBER_INTERVAL) : 4000

const API_URL: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.api,
    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.api,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.api,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.api,

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.api,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.api,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.api,

    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.api,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.api,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.api,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.api,
    [NETWORK.SUI]: CONFIG_NETWORKS.sui.api,
    [NETWORK.POLYGON]: CONFIG_NETWORKS.polygon.api
}

const BTP_NETWORK_ID: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.btp_network_id,
    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.btp_network_id,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.btp_network_id,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.btp_network_id,

    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.btp_network_id,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.btp_network_id,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.btp_network_id,

    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.btp_network_id,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.btp_network_id,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.btp_network_id,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.btp_network_id,
    [NETWORK.POLYGON]: CONFIG_NETWORKS.polygon.btp_network_id,

    [NETWORK.SUI]: CONFIG_NETWORKS.sui.btp_network_id
}

const API_KEY: { [network: string]: string } = {
    [NETWORK.ICON]: '',
    [NETWORK.BSC]: process.env.SCAN_BSC_API_KEY ?? '',
    [NETWORK.ETH2]: process.env.SCAN_ETH_API_KEY ?? '',
    [NETWORK.HAVAH]: '',

    [NETWORK.IBC_ARCHWAY]: process.env.SCAN_MINTSCAN_API_KEY ?? '',
    [NETWORK.IBC_NEUTRON]: '',
    [NETWORK.IBC_INJECTIVE]: '',

    [NETWORK.BASE]: process.env.SCAN_BASE_API_KEY ?? '',
    [NETWORK.ARBITRUM]: process.env.SCAN_ARBITRUM_API_KEY ?? '',
    [NETWORK.OPTIMISM]: process.env.SCAN_OPTIMISM_API_KEY ?? '',
    [NETWORK.POLYGON]: process.env.SCAN_POLYGON_API_KEY ?? ''
}

const SERVICE_API_KEY = {
    SCRAPING_ANT: process.env.SCRAPING_ANT_API_KEY ?? ''
}

const CONTRACT: { [network: string]: { xcall: string[] } } = {
    [NETWORK.ICON]: {
        xcall: CONFIG_CONTRACTS.icon.xcall
    },
    [NETWORK.BSC]: {
        xcall: CONFIG_CONTRACTS.bsc.xcall
    },
    [NETWORK.ETH2]: {
        xcall: CONFIG_CONTRACTS.eth2.xcall
    },
    [NETWORK.HAVAH]: {
        xcall: CONFIG_CONTRACTS.havah.xcall
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

    // AVAX
    [NETWORK.AVAX]: {
        xcall: CONFIG_CONTRACTS.avax.xcall
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

    [NETWORK.SUI]: {
        xcall: CONFIG_CONTRACTS.sui.xcall
    },
    [NETWORK.POLYGON]: {
        xcall: CONFIG_CONTRACTS.polygon.xcall
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
    Rollbacked: 'rollbacked'
}

export {
    USE_MAINNET,
    NETWORK,
    API_URL,
    API_KEY,
    CONTRACT,
    EVENT,
    MSG_STATUS,
    RPC_URL,
    RPC_URLS,
    BTP_NETWORK_ID,
    SERVICE_API_KEY,
    SCAN_FROM_FLAG_NUMBER,
    WSS,
    SUBSCRIBER_NETWORKS,
    SUBSCRIBER_INTERVAL
}

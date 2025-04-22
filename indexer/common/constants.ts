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
const WEB3_QUICKNODE_API_KEY = process.env.WEB3_QUICKNODE_API_KEY
const WEB3_VALIDATIONCLOUD_API_KEY = process.env.WEB3_VALIDATIONCLOUD_API_KEY

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

const buildProviderUrls = (urls: string[]) => {
    const correctUrls: string[] = []
    urls.forEach((url) => {
        // trim /
        url = url.replace(/\/+$/, '')

        if (url.includes('blockvision')) correctUrls.push(`${url}/${WEB3_BLOCKVISION_API_KEY}`)
        else if (url.includes('alchemy')) correctUrls.push(`${url}/${WEB3_ALCHEMY_API_KEY}`)
        else if (url.includes('chainstack')) correctUrls.push(`${url}/${WEB3_CHAINSTACK_API_KEY}`)
        else if (url.includes('blastapi')) correctUrls.push(`${url}/${WEB3_BLAST_API_KEY}`)
        else if (url.includes('ankr')) correctUrls.push(`${url}/${WEB3_ANKR_API_KEY}`)
        else if (url.includes('instantnodes')) correctUrls.push(`${url}/token-${WEB3_INSTANTNODES_API_KEY}`)
        else if (url.includes('quiknode')) correctUrls.push(`${url}/${WEB3_QUICKNODE_API_KEY}`)
        else if (url.includes('validationcloud')) correctUrls.push(`${url}/${WEB3_VALIDATIONCLOUD_API_KEY}`)
        else correctUrls.push(url)
    })

    return correctUrls
}

const RPC_URLS: { [network: string]: string[] } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.rpcs,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.rpcs,

    [NETWORK.BSC]: buildProviderUrls(CONFIG_NETWORKS.bsc.rpcs),
    [NETWORK.ETH2]: buildProviderUrls(CONFIG_NETWORKS.eth2.rpcs),
    [NETWORK.AVAX]: buildProviderUrls(CONFIG_NETWORKS.avax.rpcs),
    [NETWORK.BASE]: buildProviderUrls(CONFIG_NETWORKS.base.rpcs),
    [NETWORK.ARBITRUM]: buildProviderUrls(CONFIG_NETWORKS.arbitrum.rpcs),
    [NETWORK.OPTIMISM]: buildProviderUrls(CONFIG_NETWORKS.optimism.rpcs),
    [NETWORK.POLYGON]: buildProviderUrls(CONFIG_NETWORKS.polygon.rpcs),

    [NETWORK.IBC_ARCHWAY]: buildProviderUrls(CONFIG_NETWORKS.ibc_archway.rpcs),
    [NETWORK.IBC_NEUTRON]: buildProviderUrls(CONFIG_NETWORKS.ibc_neutron.rpcs),
    [NETWORK.IBC_INJECTIVE]: buildProviderUrls(CONFIG_NETWORKS.ibc_injective.rpcs),

    [NETWORK.SUI]: buildProviderUrls(CONFIG_NETWORKS.sui.rpcs),
    [NETWORK.STELLAR]: buildProviderUrls(CONFIG_NETWORKS.stellar.rpcs),
    [NETWORK.SOLANA]: buildProviderUrls(CONFIG_NETWORKS.solana.rpcs)
}

const WSS_URLS: { [network: string]: string[] } = {
    // https will be auto replaced wss in iconService
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.wss,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.wss,

    [NETWORK.BSC]: buildProviderUrls(CONFIG_NETWORKS.bsc.wss),
    [NETWORK.ETH2]: buildProviderUrls(CONFIG_NETWORKS.eth2.wss),
    [NETWORK.AVAX]: buildProviderUrls(CONFIG_NETWORKS.avax.wss),
    [NETWORK.BASE]: buildProviderUrls(CONFIG_NETWORKS.base.wss),
    [NETWORK.ARBITRUM]: buildProviderUrls(CONFIG_NETWORKS.arbitrum.wss),
    [NETWORK.OPTIMISM]: buildProviderUrls(CONFIG_NETWORKS.optimism.wss),
    [NETWORK.POLYGON]: buildProviderUrls(CONFIG_NETWORKS.polygon.wss),

    [NETWORK.IBC_INJECTIVE]: buildProviderUrls(CONFIG_NETWORKS.ibc_injective.wss),
    [NETWORK.IBC_ARCHWAY]: buildProviderUrls(CONFIG_NETWORKS.ibc_archway.wss),
    [NETWORK.IBC_NEUTRON]: buildProviderUrls(CONFIG_NETWORKS.ibc_neutron.wss),

    [NETWORK.SUI]: buildProviderUrls(CONFIG_NETWORKS.solana.wss),
    [NETWORK.STELLAR]: buildProviderUrls(CONFIG_NETWORKS.stellar.wss),
    [NETWORK.SOLANA]: buildProviderUrls(CONFIG_NETWORKS.solana.wss)
}

const SUBSCRIBER_NETWORKS = process.env.SUBSCRIBER_NETWORKS ? process.env.SUBSCRIBER_NETWORKS.split(',') : []
const SUBSCRIBER_INTERVAL = process.env.SUBSCRIBER_INTERVAL ? process.env.SUBSCRIBER_INTERVAL : '*:6000'

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

const CONTRACT: { [network: string]: { xcall: string[]; intents: string[] } } = {
    [NETWORK.ICON]: {
        xcall: CONFIG_CONTRACTS.icon.xcall,
        intents: CONFIG_CONTRACTS.icon.intents
    },
    [NETWORK.HAVAH]: {
        xcall: CONFIG_CONTRACTS.havah.xcall,
        intents: CONFIG_CONTRACTS.havah.intents
    },

    // EVM
    [NETWORK.BSC]: {
        xcall: CONFIG_CONTRACTS.bsc.xcall,
        intents: CONFIG_CONTRACTS.bsc.intents
    },
    [NETWORK.ETH2]: {
        xcall: CONFIG_CONTRACTS.eth2.xcall,
        intents: CONFIG_CONTRACTS.eth2.intents
    },
    [NETWORK.AVAX]: {
        xcall: CONFIG_CONTRACTS.avax.xcall,
        intents: CONFIG_CONTRACTS.avax.intents
    },
    [NETWORK.POLYGON]: {
        xcall: CONFIG_CONTRACTS.polygon.xcall,
        intents: CONFIG_CONTRACTS.polygon.intents
    },
    [NETWORK.BASE]: {
        xcall: CONFIG_CONTRACTS.base.xcall,
        intents: CONFIG_CONTRACTS.base.intents
    },
    [NETWORK.ARBITRUM]: {
        xcall: CONFIG_CONTRACTS.arbitrum.xcall,
        intents: CONFIG_CONTRACTS.arbitrum.intents
    },
    [NETWORK.OPTIMISM]: {
        xcall: CONFIG_CONTRACTS.optimism.xcall,
        intents: CONFIG_CONTRACTS.optimism.intents
    },

    // IBC
    [NETWORK.IBC_ARCHWAY]: {
        xcall: CONFIG_CONTRACTS.ibc_archway.xcall,
        intents: CONFIG_CONTRACTS.ibc_archway.intents
    },
    [NETWORK.IBC_NEUTRON]: {
        xcall: CONFIG_CONTRACTS.ibc_neutron.xcall,
        intents: CONFIG_CONTRACTS.ibc_neutron.intents
    },
    [NETWORK.IBC_INJECTIVE]: {
        xcall: CONFIG_CONTRACTS.ibc_injective.xcall,
        intents: CONFIG_CONTRACTS.ibc_injective.intents
    },

    // SUI
    [NETWORK.SUI]: {
        xcall: CONFIG_CONTRACTS.sui.xcall,
        intents: CONFIG_CONTRACTS.sui.intents
    },
    // STELLAR
    [NETWORK.STELLAR]: {
        xcall: CONFIG_CONTRACTS.stellar.xcall,
        intents: CONFIG_CONTRACTS.stellar.intents
    },
    // SOLANA
    [NETWORK.SOLANA]: {
        xcall: CONFIG_CONTRACTS.solana.xcall,
        intents: CONFIG_CONTRACTS.solana.intents
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

const INTENTS_EVENT = {
    SwapIntent: 'SwapIntent',
    SwapOrder: 'SwapOrder', // the same with SwapIntent
    OrderFilled: 'OrderFilled',
    OrderClosed: 'OrderClosed',
    OrderCancelled: 'OrderCancelled',
    Message: 'Message'
}

const MSG_STATUS = {
    Pending: 'pending',
    Delivered: 'delivered',
    Executed: 'executed',
    Rollbacked: 'rollbacked',
    Failed: 'failed'
}

const MSG_ACTION_TYPES = {
    SendMsg: 'SendMsg',
    Transfer: 'Transfer',
    Swap: 'Swap',
    Loan: 'Loan',
    SwapIntent: 'SwapIntent'
}

// map native tokens to wrapped tokens
// using for price calculation and asset info
const ASSET_MAP: { [symbol: string]: { symbols: string[]; decimals: number; priceUsd: string; denom?: string; cmcId?: number } } = {
    SOL: {
        symbols: ['SOL', 'JitoSOL'],
        decimals: 9,
        priceUsd: '',
        cmcId: 5426
    },
    XLM: {
        symbols: ['XLM'],
        decimals: 7,
        priceUsd: '',
        cmcId: 512
    },
    POL: {
        symbols: ['POL'],
        decimals: 18,
        priceUsd: '',
        cmcId: 3890
    },
    SUI: {
        symbols: ['SUI', 'afSUI', 'haSUI', 'vSUI', 'mSUI'],
        decimals: 18,
        priceUsd: '',
        cmcId: 20947
    },
    ICX: {
        symbols: ['ICX', 'sICX', 'wICX'],
        decimals: 18,
        priceUsd: '',
        cmcId: 2099
    },
    HVH: {
        symbols: ['HVH'],
        decimals: 18,
        priceUsd: '',
        cmcId: 23633
    },
    INJ: {
        symbols: ['INJ'],
        decimals: 18,
        priceUsd: '',
        cmcId: 7226,
        denom: 'inj'
    },
    ARCH: {
        symbols: ['ARCH', 'sARCH'],
        decimals: 18,
        priceUsd: '',
        cmcId: 27358,
        denom: 'aarch'
    },
    NTRN: {
        symbols: ['NTRN'],
        decimals: 6,
        priceUsd: '',
        cmcId: 26680,
        denom: 'untrn'
    },
    AVAX: {
        symbols: ['AVAX'],
        decimals: 18,
        priceUsd: '',
        cmcId: 5805
    },
    bnUSD: {
        symbols: ['bnUSD'],
        decimals: 18,
        priceUsd: '1'
    },
    USDC: {
        symbols: ['USDC', 'archUSDC'],
        decimals: 6,
        priceUsd: '1'
    },
    USDT: {
        symbols: ['USDT', 'archUSDT', 'USDt', 'USD₮0'],
        decimals: 6,
        priceUsd: '1'
    },
    BTC: {
        symbols: ['BTC', 'WBTC', 'tBTC', 'BTCB'],
        decimals: 18,
        priceUsd: '',
        cmcId: 1
    },
    ETH: {
        symbols: ['ETH', 'WETH', 'weETH'],
        decimals: 18,
        priceUsd: '',
        cmcId: 1027
    },
    BNB: {
        symbols: ['BNB', 'WBNB'],
        decimals: 18,
        priceUsd: '',
        cmcId: 1839
    },
    BALN: {
        symbols: ['BALN'],
        decimals: 18,
        priceUsd: '',
        cmcId: 11262
    }
}

// native assets
const NATIVE_ASSETS: { [network: string]: string } = {
    [NETWORK.ICON]: 'ICX',
    [NETWORK.BSC]: 'BNB',
    [NETWORK.ETH2]: 'ETH',
    [NETWORK.HAVAH]: 'HVH',
    [NETWORK.IBC_ARCHWAY]: 'ARCH',
    [NETWORK.IBC_NEUTRON]: 'NTRN',
    [NETWORK.IBC_INJECTIVE]: 'INJ',
    [NETWORK.AVAX]: 'AVAX',
    [NETWORK.BASE]: 'ETH',
    [NETWORK.ARBITRUM]: 'ETH',
    [NETWORK.OPTIMISM]: 'ETH',
    [NETWORK.SUI]: 'SUI',
    [NETWORK.POLYGON]: 'POL',
    [NETWORK.SOLANA]: 'SOL',
    [NETWORK.STELLAR]: 'XLM'
}

export {
    USE_MAINNET,
    NETWORK,
    API_URL,
    API_KEY,
    CONTRACT,
    EVENT,
    INTENTS_EVENT,
    MSG_STATUS,
    MSG_ACTION_TYPES,
    RPC_URLS,
    BTP_NETWORK_ID,
    SERVICE_API_KEY,
    SCAN_FROM_FLAG_NUMBER,
    WSS_URLS,
    SUBSCRIBER_NETWORKS,
    SUBSCRIBER_INTERVAL,
    ASSET_MAP,
    NATIVE_ASSETS
}

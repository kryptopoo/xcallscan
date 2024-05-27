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
    IBC_ICON: 'ibc_icon',
    IBC_ARCHWAY: 'ibc_archway',
    IBC_NEUTRON: 'ibc_neutron',
    IBC_INJECTIVE: 'ibc_injective',
    AVAX: 'avax',
    BASE: 'base',
    ARBITRUM: 'arbitrum',
    OPTIMISM: 'optimism'
}

const RPC_URL: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.uri,
    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.uri,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.uri,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.uri,
    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.uri,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.uri,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.uri,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.uri
}

const API_URL: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.api,
    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.api,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.api,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.api,

    [NETWORK.IBC_ICON]: CONFIG_NETWORKS.ibc_icon.api,
    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.api,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.api,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.api,

    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.api,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.api,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.api,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.api
}

const BTP_NETWORK_ID: { [network: string]: string } = {
    [NETWORK.ICON]: CONFIG_NETWORKS.icon.btp_network_id,
    [NETWORK.BSC]: CONFIG_NETWORKS.bsc.btp_network_id,
    [NETWORK.ETH2]: CONFIG_NETWORKS.eth2.btp_network_id,
    [NETWORK.HAVAH]: CONFIG_NETWORKS.havah.btp_network_id,

    [NETWORK.IBC_ICON]: CONFIG_NETWORKS.ibc_icon.btp_network_id,
    [NETWORK.IBC_ARCHWAY]: CONFIG_NETWORKS.ibc_archway.btp_network_id,
    [NETWORK.IBC_NEUTRON]: CONFIG_NETWORKS.ibc_neutron.btp_network_id,
    [NETWORK.IBC_INJECTIVE]: CONFIG_NETWORKS.ibc_injective.btp_network_id,

    [NETWORK.AVAX]: CONFIG_NETWORKS.avax.btp_network_id,
    [NETWORK.BASE]: CONFIG_NETWORKS.base.btp_network_id,
    [NETWORK.ARBITRUM]: CONFIG_NETWORKS.arbitrum.btp_network_id,
    [NETWORK.OPTIMISM]: CONFIG_NETWORKS.optimism.btp_network_id
}

const API_KEY: { [network: string]: string } = {
    [NETWORK.ICON]: '',
    [NETWORK.BSC]: process.env.SCAN_BSC_API_KEY ?? '',
    [NETWORK.ETH2]: process.env.SCAN_ETH_API_KEY ?? '',
    [NETWORK.HAVAH]: '',

    [NETWORK.IBC_ICON]: '',
    [NETWORK.IBC_ARCHWAY]: process.env.SCAN_MINTSCAN_API_KEY ?? '',
    [NETWORK.IBC_NEUTRON]: '',
    [NETWORK.IBC_INJECTIVE]: '',

    [NETWORK.BASE]: process.env.SCAN_BASE_API_KEY ?? '',
    [NETWORK.ARBITRUM]: process.env.SCAN_ARBITRUM_API_KEY ?? '',
    [NETWORK.OPTIMISM]: process.env.SCAN_OPTIMISM_API_KEY ?? ''
}

const SERVICE_API_KEY = {
    SCRAPING_ANT: process.env.SCRAPING_ANT_API_KEY ?? ''
}

const CONTRACT: { [network: string]: { xcall: string; bmc: string } } = {
    [NETWORK.ICON]: {
        xcall: CONFIG_CONTRACTS.icon.xcall,
        bmc: CONFIG_CONTRACTS.icon.bmc
    },
    [NETWORK.BSC]: {
        xcall: CONFIG_CONTRACTS.bsc.xcall,
        bmc: CONFIG_CONTRACTS.bsc.bmc
    },
    [NETWORK.ETH2]: {
        xcall: CONFIG_CONTRACTS.eth2.xcall,
        bmc: CONFIG_CONTRACTS.eth2.bmc
    },
    [NETWORK.HAVAH]: {
        xcall: CONFIG_CONTRACTS.havah.xcall,
        bmc: CONFIG_CONTRACTS.havah.bmc
    },

    // IBC
    [NETWORK.IBC_ICON]: {
        xcall: CONFIG_CONTRACTS.ibc_icon.xcall,
        bmc: ''
    },
    [NETWORK.IBC_ARCHWAY]: {
        xcall: CONFIG_CONTRACTS.ibc_archway.xcall,
        bmc: ''
    },
    [NETWORK.IBC_NEUTRON]: {
        xcall: CONFIG_CONTRACTS.ibc_neutron.xcall,
        bmc: ''
    },
    [NETWORK.IBC_INJECTIVE]: {
        xcall: CONFIG_CONTRACTS.ibc_injective.xcall,
        bmc: ''
    },

    // AVAX
    [NETWORK.AVAX]: {
        xcall: CONFIG_CONTRACTS.avax.xcall,
        bmc: ''
    },

    [NETWORK.BASE]: {
        xcall: CONFIG_CONTRACTS.base.xcall,
        bmc: ''
    },
    [NETWORK.ARBITRUM]: {
        xcall: CONFIG_CONTRACTS.arbitrum.xcall,
        bmc: ''
    },
    [NETWORK.OPTIMISM]: {
        xcall: CONFIG_CONTRACTS.optimism.xcall,
        bmc: ''
    }
}

const SCAN_FROM_FLAG_NUMBER: { [network: string]: number } = {
    [NETWORK.ICON]: 0,
    [NETWORK.BSC]: 0,
    [NETWORK.ETH2]: 0,
    [NETWORK.HAVAH]: 0,

    [NETWORK.IBC_ICON]: 0,
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

export { USE_MAINNET, NETWORK, API_URL, API_KEY, CONTRACT, EVENT, MSG_STATUS, RPC_URL, BTP_NETWORK_ID, SERVICE_API_KEY, SCAN_FROM_FLAG_NUMBER }

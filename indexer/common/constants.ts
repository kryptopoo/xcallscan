import TestnetDeployment from '../configs/testnet_deployment.json'
import MainnetDeployment from '../configs/mainnet_deployment.json'
import dotenv from 'dotenv'
dotenv.config()

const USE_MAINNET = process.env.USE_MAINNET == 'true'

const NETWORK = {
    ICON: 'icon',
    BSC: 'bsc',
    ETH2: 'eth2',
    HAVAH: 'havah',
    IBC_ICON: 'ibc_icon',
    IBC_ARCHWAY: 'ibc_archway',
    IBC_NEUTRON: 'ibc_neutron',
    IBC_INJECTIVE: 'ibc_injective'
}

const RPC_URL: { [network: string]: string } = {
    [NETWORK.ICON]: USE_MAINNET ? MainnetDeployment.networks.icon.uri : TestnetDeployment.networks.icon.uri,
    [NETWORK.BSC]: USE_MAINNET ? MainnetDeployment.networks.bsc.uri : TestnetDeployment.networks.bsc.uri,
    [NETWORK.ETH2]: USE_MAINNET ? MainnetDeployment.networks.eth2.uri : TestnetDeployment.networks.eth2.uri,
    [NETWORK.HAVAH]: USE_MAINNET ? MainnetDeployment.networks.havah.uri : TestnetDeployment.networks.havah.uri
}

const API_URL: { [network: string]: string } = {
    [NETWORK.ICON]: USE_MAINNET ? 'https://tracker.icon.community/api/v1' : 'https://tracker.berlin.icon.community/api/v1',
    [NETWORK.BSC]: USE_MAINNET ? 'https://api.bscscan.com/api' : 'https://api-testnet.bscscan.com/api',
    [NETWORK.ETH2]: USE_MAINNET ? 'https://api.etherscan.io/api' : 'https://api-sepolia.etherscan.io/api',
    [NETWORK.HAVAH]: USE_MAINNET ? 'https://scan.havah.io/v3' : 'https://scan.altair.havah.io/v3',

    [NETWORK.IBC_ICON]: USE_MAINNET ? 'https://tracker.icon.community/api/v1' : 'https://tracker.berlin.icon.community/api/v1',
    [NETWORK.IBC_ARCHWAY]: USE_MAINNET ? 'https://front.api.mintscan.io/v1/archway' : 'https://front.api.mintscan.io/v1/archway-testnet',
    [NETWORK.IBC_NEUTRON]: USE_MAINNET
        ? 'https://celatone-api-prod.alleslabs.dev/v1/neutron/neutron-1'
        : 'https://celatone-api-prod.alleslabs.dev/v1/neutron/pion-1',
    [NETWORK.IBC_INJECTIVE]: USE_MAINNET
        ? 'https://sentry.exchange.grpc-web.injective.network/api/explorer/v1'
        : 'https://testnet.sentry.exchange.grpc-web.injective.network/api/explorer/v1'
}

const BTP_NETWORK_ID: { [network: string]: string } = {
    [NETWORK.ICON]: USE_MAINNET ? MainnetDeployment.networks.icon.btp_network_id : TestnetDeployment.networks.icon.btp_network_id,
    [NETWORK.BSC]: USE_MAINNET ? MainnetDeployment.networks.bsc.btp_network_id : TestnetDeployment.networks.bsc.btp_network_id,
    [NETWORK.ETH2]: USE_MAINNET ? MainnetDeployment.networks.eth2.btp_network_id : TestnetDeployment.networks.eth2.btp_network_id,
    [NETWORK.HAVAH]: USE_MAINNET ? MainnetDeployment.networks.havah.btp_network_id : TestnetDeployment.networks.havah.btp_network_id,

    [NETWORK.IBC_ICON]: USE_MAINNET ? MainnetDeployment.networks.ibc_icon.btp_network_id : TestnetDeployment.networks.ibc_icon.btp_network_id,
    [NETWORK.IBC_ARCHWAY]: USE_MAINNET
        ? MainnetDeployment.networks.ibc_archway.btp_network_id
        : TestnetDeployment.networks.ibc_archway.btp_network_id,
    [NETWORK.IBC_NEUTRON]: USE_MAINNET ? MainnetDeployment.networks.ibc_neutron.btp_network_id : TestnetDeployment.networks.ibc_neutron.btp_network_id,
    [NETWORK.IBC_INJECTIVE]: USE_MAINNET ? MainnetDeployment.networks.ibc_injective.btp_network_id : TestnetDeployment.networks.ibc_injective.btp_network_id
}

const API_KEY: { [network: string]: string } = {
    [NETWORK.ICON]: '',
    [NETWORK.BSC]: process.env.SCAN_BSC_API_KEY ?? '',
    [NETWORK.ETH2]: process.env.SCAN_ETH_API_KEY ?? '',
    [NETWORK.HAVAH]: '',

    [NETWORK.IBC_ICON]: '',
    [NETWORK.IBC_ARCHWAY]: '',
    [NETWORK.IBC_NEUTRON]: '',
    [NETWORK.IBC_INJECTIVE]: ''
}

const SERVICE_API_KEY = {
    SCRAPING_ANT: process.env.SCRAPING_ANT_API_KEY ?? ''
}

const CONTRACT: { [network: string]: { xcall: string; dapp: string; bmc: string } } = {
    [NETWORK.ICON]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.icon.xcall : TestnetDeployment.contracts.icon.xcall,
        dapp: USE_MAINNET ? MainnetDeployment.contracts.icon.dapp : TestnetDeployment.contracts.icon.dapp,
        bmc: USE_MAINNET ? MainnetDeployment.contracts.icon.bmc : TestnetDeployment.contracts.icon.bmc
    },
    [NETWORK.BSC]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.bsc.xcall : TestnetDeployment.contracts.bsc.xcall,
        dapp: USE_MAINNET ? MainnetDeployment.contracts.bsc.dapp : TestnetDeployment.contracts.bsc.dapp,
        bmc: USE_MAINNET ? MainnetDeployment.contracts.bsc.bmc : TestnetDeployment.contracts.bsc.bmc
    },
    [NETWORK.ETH2]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.eth2.xcall : TestnetDeployment.contracts.eth2.xcall,
        dapp: USE_MAINNET ? MainnetDeployment.contracts.eth2.dapp : TestnetDeployment.contracts.eth2.dapp,
        bmc: USE_MAINNET ? MainnetDeployment.contracts.eth2.bmc : TestnetDeployment.contracts.eth2.bmc
    },
    [NETWORK.HAVAH]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.havah.xcall : TestnetDeployment.contracts.havah.xcall,
        dapp: USE_MAINNET ? MainnetDeployment.contracts.havah.dapp : TestnetDeployment.contracts.havah.dapp,
        bmc: USE_MAINNET ? MainnetDeployment.contracts.havah.bmc : TestnetDeployment.contracts.havah.bmc
    },

    // IBC
    [NETWORK.IBC_ICON]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.ibc_icon.xcall : TestnetDeployment.contracts.ibc_icon.xcall,
        dapp: '',
        bmc: ''
    },
    [NETWORK.IBC_ARCHWAY]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.ibc_archway.xcall : TestnetDeployment.contracts.ibc_archway.xcall,
        dapp: '',
        bmc: ''
    },
    [NETWORK.IBC_NEUTRON]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.ibc_neutron.xcall : TestnetDeployment.contracts.ibc_neutron.xcall,
        dapp: '',
        bmc: ''
    },
    [NETWORK.IBC_INJECTIVE]: {
        xcall: USE_MAINNET ? MainnetDeployment.contracts.ibc_injective.xcall : TestnetDeployment.contracts.ibc_injective.xcall,
        dapp: '',
        bmc: ''
    }
}

const SCAN_FROM_FLAG_NUMBER: { [network: string]: number } = {
    [NETWORK.ICON]: 0,
    [NETWORK.BSC]: 0,
    [NETWORK.ETH2]: 0,
    [NETWORK.HAVAH]: 0,

    [NETWORK.IBC_ICON]: 0,
    [NETWORK.IBC_ARCHWAY]: USE_MAINNET
        ? MainnetDeployment.networks.ibc_archway.block_timestamp
        : TestnetDeployment.networks.ibc_archway.block_timestamp,
    [NETWORK.IBC_NEUTRON]: USE_MAINNET
        ? MainnetDeployment.networks.ibc_neutron.block_timestamp
        : TestnetDeployment.networks.ibc_neutron.block_timestamp,
        [NETWORK.IBC_INJECTIVE]: USE_MAINNET
        ? MainnetDeployment.networks.ibc_injective.block_timestamp
        : TestnetDeployment.networks.ibc_injective.block_timestamp
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
    Executed: 'executed'
}

export { USE_MAINNET, NETWORK, API_URL, API_KEY, CONTRACT, EVENT, MSG_STATUS, RPC_URL, BTP_NETWORK_ID, SERVICE_API_KEY, SCAN_FROM_FLAG_NUMBER }

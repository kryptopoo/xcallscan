const dotenv = require('dotenv')
dotenv.config()

const TestnetDeployment = require('./configs/testnet_deployment.json')
const MainnetDeployment = require('./configs/mainnet_deployment.json')

const USE_MAINNET = process.env.USE_MAINNET == 'true'
const CONFIG_NETWORKS = USE_MAINNET ? MainnetDeployment.networks : TestnetDeployment.networks

const WEB3_ALCHEMY_API_KEY = process.env.WEB3_ALCHEMY_API_KEY
const WEB3_BLAST_API_KEY = process.env.WEB3_BLAST_API_KEY
const WEB3_CHAINSTACK_API_KEY = process.env.WEB3_CHAINSTACK_API_KEY
const WEB3_BLOCKVISION_API_KEY = process.env.WEB3_BLOCKVISION_API_KEY
const WEB3_ANKR_API_KEY = process.env.WEB3_ANKR_API_KEY
const WEB3_INSTANTNODES_API_KEY = process.env.WEB3_INSTANTNODES_API_KEY
const WEB3_QUICKNODE_API_KEY = process.env.WEB3_QUICKNODE_API_KEY

const NETWORK = {
    ICON: 'icon',
    HAVAH: 'havah',

    BSC: 'bsc',
    ETH2: 'eth2',
    AVAX: 'avax',
    BASE: 'base',
    ARBITRUM: 'arbitrum',
    OPTIMISM: 'optimism',
    POLYGON: 'polygon',

    IBC_ARCHWAY: 'ibc_archway',
    IBC_NEUTRON: 'ibc_neutron',
    IBC_INJECTIVE: 'ibc_injective',

    SUI: 'sui',
    STELLAR: 'stellar',
    SOLANA: 'solana'
}

const buildProviderUrls = (urls) => {
    const correctUrls = []
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
        else correctUrls.push(url)
    })

    return correctUrls
}


const RPC_URLS = {
    [NETWORK.ICON]: buildProviderUrls(CONFIG_NETWORKS.icon.rpcs),
    [NETWORK.HAVAH]: buildProviderUrls(CONFIG_NETWORKS.havah.rpcs),

    [NETWORK.BSC]: buildProviderUrls(CONFIG_NETWORKS.bsc.rpcs),
    [NETWORK.ETH2]:  buildProviderUrls(CONFIG_NETWORKS.eth2.rpcs),
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

const META_URLS = {
    tx: {
        [NETWORK.BSC]: USE_MAINNET ? 'https://bscscan.com/tx/' : 'https://testnet.bscscan.com/tx/',
        [NETWORK.ICON]: USE_MAINNET ? 'https://tracker.icon.community/transaction/' : 'https://tracker.lisbon.icon.community/transaction/',
        [NETWORK.ETH2]: USE_MAINNET ? 'https://etherscan.io/tx/' : 'https://sepolia.etherscan.io/tx/',
        [NETWORK.HAVAH]: USE_MAINNET ? 'https://scan.havah.io/txn/' : 'https://scan.vega.havah.io/txn/',
        [NETWORK.IBC_ARCHWAY]: USE_MAINNET ? 'https://mintscan.io/archway/txs/' : 'https://testnet.mintscan.io/archway-testnet/txs/',
        [NETWORK.IBC_NEUTRON]: USE_MAINNET ? 'https://neutron.celat.one/neutron-1/txs/' : 'https://neutron.celat.one/pion-1/txs/',
        [NETWORK.IBC_INJECTIVE]: USE_MAINNET
            ? 'https://explorer.injective.network/transaction/'
            : 'https://testnet.explorer.injective.network/transaction/',
        [NETWORK.AVAX]: USE_MAINNET ? 'https://snowtrace.io/tx/' : 'https://testnet.snowtrace.io/tx/',
        [NETWORK.BASE]: USE_MAINNET ? 'https://basescan.org/tx/' : 'https://sepolia.basescan.org/tx/',
        [NETWORK.ARBITRUM]: USE_MAINNET ? 'https://arbiscan.io/tx/' : 'https://sepolia.arbiscan.io/tx/',
        [NETWORK.OPTIMISM]: USE_MAINNET ? 'https://optimistic.etherscan.io/tx/' : 'https://sepolia-optimism.etherscan.io/tx/',
        [NETWORK.SUI]: USE_MAINNET ? 'https://suiscan.xyz/mainnet/tx/' : 'https://suiscan.xyz/testnet/tx/',
        [NETWORK.POLYGON]: USE_MAINNET ? 'https://polygonscan.com/tx/' : 'https://amoy.polygonscan.com/tx/',
        [NETWORK.STELLAR]: USE_MAINNET ? 'https://stellar.expert/explorer/public/tx/' : 'https://stellar.expert/explorer/testnet/tx/',
        [NETWORK.SOLANA]: USE_MAINNET ? 'https://explorer.solana.com/tx/{txHash}' : 'https://explorer.solana.com/tx/{txHash}?cluster=testnet'
    }
}

module.exports = {
    USE_MAINNET,
    NETWORK,
    RPC_URLS,
    META_URLS
}

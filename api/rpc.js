const axios = require('axios')
const { NETWORK, USE_MAINNET, RPC_URLS } = require('./constants')

const hexToNumber = (hex) => {
    return Number(hex)
}

const buildBlockHeightRequest = (network) => {
    if (network === NETWORK.ICON || network === NETWORK.HAVAH) {
        const req = axios.request({
            method: 'POST',
            url: RPC_URLS[network][0],
            headers: { 'content-type': 'application/json' },
            data: {
                id: 1,
                jsonrpc: '2.0',
                method: 'icx_getLastBlock'
            }
        })
        return req
    } else if (
        network === NETWORK.BSC ||
        network === NETWORK.ETH2 ||
        network === NETWORK.AVAX ||
        network === NETWORK.BASE ||
        network === NETWORK.ARBITRUM ||
        network === NETWORK.OPTIMISM ||
        network === NETWORK.POLYGON
    ) {
        const req = axios.request({
            method: 'POST',
            url: RPC_URLS[network][0],
            headers: { 'content-type': 'application/json' },
            data: {
                id: 1,
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: []
            }
        })
        return req
    } else if (network === NETWORK.IBC_ARCHWAY || network === NETWORK.IBC_NEUTRON || network === NETWORK.IBC_INJECTIVE) {
        const req = axios.request({
            method: 'GET',
            url: `${RPC_URLS[network][0]}/block`,
            headers: { 'content-type': 'application/json' }
        })

        return req
    } else if (network === NETWORK.SUI) {
        const req = axios.request({
            method: 'POST',
            url: RPC_URLS[network][0],
            headers: { 'content-type': 'application/json' },
            data: {
                id: 1,
                jsonrpc: '2.0',
                method: 'sui_getLatestCheckpointSequenceNumber',
                params: []
            }
        })
        return req
    } else if (network === NETWORK.STELLAR) {
        const req = axios.request({
            method: 'POST',
            url: RPC_URLS[network][0],
            headers: { 'content-type': 'application/json' },
            data: {
                id: 1,
                jsonrpc: '2.0',
                method: 'getLatestLedger'
            }
        })
        return req
    } else if (network === NETWORK.SOLANA) {
        const req = axios.request({
            method: 'POST',
            url: RPC_URLS[network][0],
            headers: { 'content-type': 'application/json' },
            data: {
                id: 1,
                jsonrpc: '2.0',
                method: 'getBlockHeight'
            }
        })
        return req
    }
}

const getBlockHeight = async (networks) => {
    const requests = []
    const networkIndexes = []
    const result = []

    // build requests
    for (let i = 0; i < networks.length; i++) {
        const network = networks[i]
        const req = buildBlockHeightRequest(network)
        networkIndexes.push(network)
        requests.push(req)
    }

    // get responses
    const responses = await axios.all(requests)
    for (let index = 0; index < networkIndexes.length; index++) {
        const network = networkIndexes[index]
        let blockHeight = 0
        if (network === NETWORK.ICON || network === NETWORK.HAVAH) {
            blockHeight = responses[index].data.result.height
        } else if (
            network === NETWORK.BSC ||
            network === NETWORK.ETH2 ||
            network === NETWORK.AVAX ||
            network === NETWORK.BASE ||
            network === NETWORK.ARBITRUM ||
            network === NETWORK.OPTIMISM ||
            network === NETWORK.POLYGON
        ) {
            blockHeight = hexToNumber(responses[index].data.result)
        } else if (network === NETWORK.IBC_ARCHWAY || network === NETWORK.IBC_NEUTRON || network === NETWORK.IBC_INJECTIVE) {
            blockHeight = Number(responses[index].data.result.block.header.height)
        } else if (network === NETWORK.SUI) {
            blockHeight = Number(responses[index].data.result)
        } else if (network === NETWORK.STELLAR) {
            blockHeight = Number(responses[index].data.result.sequence)
        } else if (network === NETWORK.SOLANA) {
            blockHeight = Number(responses[index].data.result)
        }

        if (blockHeight > 0) result.push({ network: network, block_height: blockHeight })
    }

    return result
}

module.exports = {
    getBlockHeight
}

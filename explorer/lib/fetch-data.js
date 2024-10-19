const getAssets = async () => {
    const assetIds = `icon,binancecoin,ethereum,bitcoin,havah,archway,neutron-3,injective-protocol,avalanche-2,arbitrum,optimism,matic-network,sui,stellar,solana`
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${assetIds}&order=market_cap_desc&per_page=100&page=1&sparkline=false`
    const res = await fetch(url, {
        next: { revalidate: 600 }
    })

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const getMessages = async (pageSize, pageNumber, status, srcNetwork, destNetwork, actionType) => {
    // await new Promise((r) => setTimeout(r, 1000))

    const skip = parseInt(pageSize) * (parseInt(pageNumber) - 1)
    const limit = parseInt(pageSize)

    const params = {
        skip,
        limit
    }

    if (status) params.status = status.toLowerCase()
    if (srcNetwork) params.src_network = srcNetwork.toLowerCase()
    if (destNetwork) params.dest_network = destNetwork.toLowerCase()
    if (actionType) params.action_type = actionType.toLowerCase()

    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/messages?${new URLSearchParams(params)}`, { cache: 'no-store' })

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const getMessageById = async (msgId) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/messages/${msgId}`, { cache: 'no-store' })

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const search = async (value) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/search?value=${value}`, { cache: 'no-store' })

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const getTotalMessages = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_API_URL}/statistics/total_messages`, { cache: 'no-store' })
    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

export default {
    getAssets,
    getMessages,
    getMessageById,
    search,
    getTotalMessages
}

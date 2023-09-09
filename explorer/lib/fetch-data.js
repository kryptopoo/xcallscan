const getAssets = async () => {
    const res = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=icon,binancecoin,ethereum,bitcoin,havah&order=market_cap_desc&per_page=100&page=1&sparkline=false`, {
        next: { revalidate: 600 }
    })

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const getMessages = async (pageSize, pageNumber) => {
    // await new Promise((r) => setTimeout(r, 1000))

    const skip = parseInt(pageSize) * (parseInt(pageNumber) - 1)
    const limit = parseInt(pageSize)

    // const res = await fetch(`${process.env.BASE_API_URL}/messages?skip=${skip}&limit=${limit}`, { cache: 'no-store' })
    const res = await fetch(`${process.env.BASE_API_URL}/messages?skip=${skip}&limit=${limit}`, { cache: 'no-store' })

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const getMessageById = async (msgId) => {
    const res = await fetch(`${process.env.BASE_API_URL}/messages/${msgId}`)

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const search = async (value) => {
    const res = await fetch(`${process.env.BASE_API_URL}/search?value=${value}`, { cache: 'no-store' })

    if (res.status !== 200) {
        throw new Error(`Status ${res.status}`)
    }
    return res.json()
}

const getStatistic = async () => {
    const res = await fetch(`${process.env.BASE_API_URL}/statistic`, { cache: 'no-store' })

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
    getStatistic
}

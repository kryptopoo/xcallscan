import { ASSET_MAP, BTP_NETWORK_ID, NETWORK } from './constants'
import { BigNumber, ethers } from 'ethers'

const nowTimestamp = () => {
    return Math.floor(Date.now() / 1000)
}

const lastWeekTimestamp = () => {
    const now = nowTimestamp()
    return now - 7 * 24 * 60 * 60
}

const lastDaysTimestamp = (days: number) => {
    const now = nowTimestamp()
    return now - days * 24 * 60 * 60
}

const toDateString = (timestamp: number) => {
    const dateString = new Date(timestamp * 1000).toISOString()
    return dateString
}

const toTimestamp = (date: Date) => {
    const timestamp = Math.floor(date.getTime() / 1000)
    return timestamp
}

const localDateToTimestamp = (localDateStr: string) => {
    const localDate = new Date(localDateStr)
    const offset = new Date().getTimezoneOffset()
    if (offset != 0) {
        const utcDate = new Date()
        utcDate.setTime(localDate.getTime() - offset * 60 * 1000)
        return toTimestamp(utcDate)
    }

    return toTimestamp(localDate)
}

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const shortAddress = (address: string, betweenString: string = '...') => {
    const shortAddr = `${address.substring(0, 5)}${betweenString}${address.substring(address.length - 4)}`
    return shortAddr
}

const cosmosHash = (hash: string) => {
    if (hash.startsWith('0x')) return hash.substring(2).toUpperCase()
    return hash
}

const getNetwork = (btpAddress: string) => {
    const networks = Object.values(NETWORK)
    for (let i = 0; i < networks.length; i++) {
        let network = networks[i]
        if (btpAddress && btpAddress.indexOf(BTP_NETWORK_ID[network]) > -1) return network
    }

    return undefined
}

const convertAssetAmount = (symbol: string, amount: string) => {
    let decimals = 18
    if (ASSET_MAP[symbol] && ASSET_MAP[symbol].decimals > 0) {
        decimals = ASSET_MAP[symbol].decimals
    }

    return ethers.utils.formatUnits(BigInt(Number(amount)), decimals)
}

const getAsset = (network: string, contractAddress: string) => {
    const data = require(`../configs/assets/${network}.json`)
    if (data) {
        return data.assets.find((a: any) => a.contract.toLowerCase() == contractAddress.toLowerCase())
    }

    return undefined
}

export {
    nowTimestamp,
    lastWeekTimestamp,
    lastDaysTimestamp,
    toDateString,
    toTimestamp,
    localDateToTimestamp,
    sleep,
    shortAddress,
    cosmosHash,
    getNetwork,
    convertAssetAmount,
    getAsset
}

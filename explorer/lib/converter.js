const toWei = (ether) => {
    return Number(ether * 1e18)
}

const fromWei = (wei, decimal = 18) => {
    return Number(wei / 10 ** decimal)
}

const fromWeiByAsset = (wei, asset) => {
    // decimal 6
    if (getAssetName(asset) == 'BUSD' || getAssetName(asset) == 'bnUSD') return Number(wei / 10 ** 6)
    else return Number(wei / 10 ** 18)
}

const formatCurrency = (number) => {
    return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(number)
}

export default {
    toWei,
    fromWei,
    fromWeiByAsset,
    formatCurrency
}

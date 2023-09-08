const toWei = (ether) => {
    return Number(ether * 1e18)
}

const fromWei = (wei, decimal = 18) => {
    return Number(wei / 10 ** decimal)
}

// assets: [
//     { name: 'btp-0x38.bsc-BNB', value: '50000000000000000' },
//     { name: 'btp-0x38.bsc-BTCB', value: '1603088000000000000' },
//     { name: 'btp-0x1.icon-bnUSD', value: '38600000000000000000' },
//     { name: 'ICX', value: '420216800000000000000' },
//     { name: 'btp-0x38.bsc-BUSD', value: '177626841100000000000000' },
//     { name: 'btp-0x38.bsc-ETH', value: '137700000000000000' },
//     { name: 'btp-0x38.bsc-USDT', value: '4700000000000000000' },
//     { name: 'ETH', value: '10' },
//     { name: 'btp-0x38.bsc-USDC', value: '2034100000000000000000' },
//     { name: 'btp-0x1.icon-sICX', value: '74700000000000000000' }
//   ]

const toAssetName = (fromBtpAssetName) => {
    if (fromBtpAssetName.toLowerCase() == 'btp-0x61.bsc-BUSD'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x38.bsc-BUSD'.toLowerCase()) return 'BUSD'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x61.bsc-BNB'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x38.bsc-BNB'.toLowerCase()) return 'BNB'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x2.icon-bnUSD'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x1.icon-bnUSD'.toLowerCase()) return 'bnUSD'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x2.icon-ICX'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x1.icon-ICX'.toLowerCase()) return 'ICX'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x2.icon-sICX'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x1.icon-sICX'.toLowerCase()) return 'sICX'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x2.icon-ETH'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x38.bsc-ETH'.toLowerCase()) return 'ETH'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x2.icon-USDT'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x38.bsc-USDT'.toLowerCase()) return 'USDT'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x2.icon-USDC'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x38.bsc-USDC'.toLowerCase()) return 'USDC'
    else if (fromBtpAssetName.toLowerCase() == 'btp-0x2.icon-BTCB'.toLowerCase() || fromBtpAssetName.toLowerCase() == 'btp-0x38.bsc-BTCB'.toLowerCase()) return 'BTCB'
    else return fromBtpAssetName
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
    toAssetName,
    toWei,
    fromWei,
    fromWeiByAsset,
    formatCurrency
}

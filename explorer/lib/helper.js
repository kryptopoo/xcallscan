const NATIVE_ASSET = {
    icon: 'ICX',
    eth2: 'ETH',
    bsc: 'BNB',
    havah: 'HVH'
}

const getNativeAsset = (network) => {
    return NATIVE_ASSET[network]
}

export default {
    getNativeAsset
}

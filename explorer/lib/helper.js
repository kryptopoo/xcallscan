const NETWORK = {
    ICON: 'icon',
    BSC: 'bsc',
    ETH2: 'eth2',
    HAVAH: 'havah',
    IBC_ICON: 'ibc_icon',
    IBC_ARCHWAY: 'ibc_archway',
    IBC_NEUTRON: 'ibc_neutron'
}

const NATIVE_ASSET = {
    [NETWORK.ICON]: 'ICX',
    [NETWORK.ETH2]: 'ETH',
    [NETWORK.BSC]: 'BNB',
    [NETWORK.HAVAH]: 'HVH',
    [NETWORK.IBC_ICON]: 'ICX',
    [NETWORK.IBC_ARCHWAY]: 'ARCH',
    [NETWORK.IBC_NEUTRON]: 'NTRN'
}

const getNativeAsset = (network) => {
    return NATIVE_ASSET[network]
}

export default {
    getNativeAsset
}

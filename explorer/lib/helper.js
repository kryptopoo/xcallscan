const NETWORK = {
    ICON: 'icon',
    BSC: 'bsc',
    ETH2: 'eth2',
    HAVAH: 'havah',
    IBC_ARCHWAY: 'ibc_archway',
    IBC_NEUTRON: 'ibc_neutron',
    IBC_INJECTIVE: 'ibc_injective',
    AVAX: 'avax',
    BASE: 'base',
    ARBITRUM: 'arbitrum',
    OPTIMISM: 'optimism'
}

const NATIVE_ASSET = {
    [NETWORK.ICON]: 'ICX',
    [NETWORK.ETH2]: 'ETH',
    [NETWORK.BSC]: 'BNB',
    [NETWORK.HAVAH]: 'HVH',
    [NETWORK.IBC_ARCHWAY]: 'ARCH',
    [NETWORK.IBC_NEUTRON]: 'NTRN',
    [NETWORK.IBC_INJECTIVE]: 'INJ',
    [NETWORK.AVAX]: 'AVAX',
    [NETWORK.BASE]: 'ETH',
    [NETWORK.ARBITRUM]: 'ETH',
    [NETWORK.OPTIMISM]: 'ETH'
}

const getNativeAsset = (network) => {
    return NATIVE_ASSET[network]
}

export default {
    getNativeAsset
}

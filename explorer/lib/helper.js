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
    OPTIMISM: 'optimism',
    SUI: 'sui',
    POLYGON: 'polygon'
}

const NETWORK_DETAILS  = {
    [NETWORK.ICON]: {
        id: NETWORK.ICON,
        name: 'Icon',
        logo: `/images/network-${NETWORK.ICON}.png`,
        nativeAsset: 'ICX'
    },
    [NETWORK.HAVAH]: {
        id: NETWORK.HAVAH,
        name: 'Havah',
        logo: `/images/network-${NETWORK.HAVAH}.png`,
        nativeAsset: 'HVH'
    },

    [NETWORK.ETH2]: {
        id: NETWORK.ETH2,
        name: 'Ethereum',
        logo: `/images/network-${NETWORK.ETH2}.png`,
        nativeAsset: 'ICX'
    },
    [NETWORK.BSC]: {
        id: NETWORK.BSC,
        name: 'Bsc',
        logo: `/images/network-${NETWORK.BSC}.png`,
        nativeAsset: 'BNB'
    },
    [NETWORK.AVAX]: {
        id: NETWORK.AVAX,
        name: 'Avax',
        logo: `/images/network-${NETWORK.AVAX}.png`,
        nativeAsset: 'AVAX'
    },
    [NETWORK.BASE]: {
        id: NETWORK.BASE,
        name: 'Base',
        logo: `/images/network-${NETWORK.BASE}.png`,
        nativeAsset: 'ETH'
    },
    [NETWORK.ARBITRUM]: {
        id: NETWORK.ARBITRUM,
        name: 'Arbitrum',
        logo: `/images/network-${NETWORK.ARBITRUM}.png`,
        nativeAsset: 'ETH'
    },
    [NETWORK.OPTIMISM]: {
        id: NETWORK.OPTIMISM,
        name: 'Optimism',
        logo: `/images/network-${NETWORK.OPTIMISM}.png`,
        nativeAsset: 'ETH'
    },
    [NETWORK.POLYGON]: {
        id: NETWORK.POLYGON,
        name: 'Polygon',
        logo: `/images/network-${NETWORK.POLYGON}.png`,
        nativeAsset: 'MATIC'
    },

    [NETWORK.IBC_ARCHWAY]: {
        id: NETWORK.IBC_ARCHWAY,
        name: 'Archway',
        logo: `/images/network-${NETWORK.IBC_ARCHWAY}.png`,
        nativeAsset: 'ARCH'
    },
    [NETWORK.IBC_NEUTRON]: {
        id: NETWORK.IBC_NEUTRON,
        name: 'Neutron',
        logo: `/images/network-${NETWORK.IBC_NEUTRON}.png`,
        nativeAsset: 'NTRN'
    },
    [NETWORK.IBC_INJECTIVE]: {
        id: NETWORK.IBC_INJECTIVE,
        name: 'Injective',
        logo: `/images/network-${NETWORK.IBC_INJECTIVE}.png`,
        nativeAsset: 'INJ'
    },
  
    [NETWORK.SUI]: {
        id: NETWORK.SUI,
        name: 'Sui',
        logo: `/images/network-${NETWORK.SUI}.png`,
        nativeAsset: 'SUI'
    },
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
    [NETWORK.OPTIMISM]: 'ETH',
    [NETWORK.SUI]: 'SUI',
    [NETWORK.POLYGON]: 'MATIC',
}

const MSG_ACTION_TYPES = {
    SendMsg: "SendMsg",
    Transfer: "Transfer",
    Swap: "Swap",
    Loan: "Loan",
}

const getNativeAsset = (network) => {
    return NATIVE_ASSET[network]
}

const getNetworks = () => {
    return Object.values(NETWORK_DETAILS)
}

const getMsgTypes = () => {
    return Object.values(MSG_ACTION_TYPES)
}

export default {
    getNativeAsset,
    getNetworks,
    getMsgTypes
}

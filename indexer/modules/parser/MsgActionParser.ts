import logger from '../logger/logger'
import { ethers } from 'ethers'
import axios from 'axios'
import { API_KEY, API_URL, NETWORK, RPC_URL, RPC_URLS, USE_MAINNET } from '../../common/constants'
import { cosmosAddress, sleep } from '../../common/helper'
import AxiosCustomInstance from '../scan/AxiosCustomInstance'

const ERC20_ABI = require('../../abi/Erc20.abi.json')

// TODO: map price usd
const ASSET_MAP: { [symbol: string]: { symbols: string[]; decimals: number; priceUsd: string; denom?: string; cmcId?: number } } = {
    MATIC: {
        symbols: ['MATIC'],
        decimals: 18,
        priceUsd: '',
        cmcId: 3890
    },
    SUI: {
        symbols: ['SUI'],
        decimals: 18,
        priceUsd: '',
        cmcId: 20947
    },
    ICX: {
        symbols: ['ICX', 'sICX'],
        decimals: 18,
        priceUsd: '',
        cmcId: 2099
    },
    HVH: {
        symbols: ['HVH'],
        decimals: 18,
        priceUsd: '',
        cmcId: 23633
    },
    INJ: {
        symbols: ['INJ'],
        decimals: 18,
        priceUsd: '',
        cmcId: 7226,
        denom: 'inj'
    },
    ARCH: {
        symbols: ['ARCH', 'sARCH'],
        decimals: 18,
        priceUsd: '',
        cmcId: 27358,
        denom: 'aarch'
    },
    NTRN: {
        symbols: ['NTRN'],
        decimals: 6,
        priceUsd: '',
        cmcId: 26680,
        denom: 'untrn'
    },
    AVAX: {
        symbols: ['AVAX'],
        decimals: 18,
        priceUsd: '',
        cmcId: 5805
    },
    bnUSD: {
        symbols: ['bnUSD'],
        decimals: 6,
        priceUsd: '1'
    },
    USDC: {
        symbols: ['USDC', 'archUSDC'],
        decimals: 6,
        priceUsd: '1'
    },
    BTC: {
        symbols: ['BTC', 'WBTC'],
        decimals: 18,
        priceUsd: '',
        cmcId: 1
    },
    ETH: {
        symbols: ['ETH', 'WETH'],
        decimals: 18,
        priceUsd: '',
        cmcId: 1027
    },
    BNB: {
        symbols: ['BNB', 'WBNB'],
        decimals: 18,
        priceUsd: '',
        cmcId: 1839
    }
}

const NATIVE_ASSET: { [network: string]: string } = {
    [NETWORK.ICON]: 'ICX',
    [NETWORK.BSC]: 'BNB',
    [NETWORK.ETH2]: 'ETH',
    [NETWORK.HAVAH]: 'HVH',
    [NETWORK.IBC_ARCHWAY]: 'ARCH',
    [NETWORK.IBC_NEUTRON]: 'NTRN',
    [NETWORK.IBC_INJECTIVE]: 'INJ',
    [NETWORK.AVAX]: 'AVAX',
    [NETWORK.BASE]: 'ETH',
    [NETWORK.ARBITRUM]: 'ETH',
    [NETWORK.OPTIMISM]: 'ETH',
    [NETWORK.SUI]: 'SUI',
    [NETWORK.POLYGON]: 'MATIC'
}

interface TokenInfo {
    name: string
    symbol: string
    contract?: string
    decimals?: number
}

interface TokenTransfer {
    asset: TokenInfo
    amount: string
}

interface MgsActionDetail {
    type: string
    src_network: string
    src_asset: TokenInfo
    src_amount: string
    dest_network: string
    dest_asset: TokenInfo
    dest_amount: string
}

interface MgsAction {
    type: string
    detail?: MgsActionDetail
    amount_usd: string
}

export class MsgActionParser {
    constructor() {}

    async callApi(apiUrl: string, params: any, apiKey: string = ''): Promise<any> {
        let errorCode = undefined
        try {
            const axiosInstance = AxiosCustomInstance.getInstance()
            let configs: any = {
                params: params
            }
            if (apiKey) {
                configs.headers = {
                    Authorization: `Bearer ${apiKey}`,
                    'X-CMC_PRO_API_KEY': apiKey
                }
            }

            const res = await axiosInstance.get(apiUrl, configs)
            return res
        } catch (error: any) {
            logger.error(`called api failed ${apiUrl} ${error.code}`)
            errorCode = error.code
        }

        return undefined
    }

    // For IBC networks
    private getAssets(network: string) {
        const assetData = require(`../../configs/assets/${network}.json`)
        return assetData.assets
    }

    private getAssetByContract(network: string, contract: string) {
        const assets = this.getAssets(network)
        const asset = assets.find((a: any) => a.denom == contract)
        return asset
            ? ({ name: asset.symbol, symbol: asset.symbol, decimals: asset.decimals } as TokenInfo)
            : ({ name: '', symbol: '', contract: contract } as TokenInfo)
    }

    private getNativeAssetSymbol(symbolA: string, symbolB: string) {
        for (const symbol in ASSET_MAP) {
            if (ASSET_MAP[symbol].symbols.includes(symbolA) && ASSET_MAP[symbol].symbols.includes(symbolB)) return symbol
        }

        return undefined
    }

    private isUsdAsset(symbol: string) {
        const usdAssets = ['USDC', 'bnUSD']
        for (let index = 0; index < usdAssets.length; index++) {
            const key = usdAssets[index]
            if (ASSET_MAP[key].symbols.includes(symbol)) return true
        }

        return false
    }

    async getPrice(symbol: string) {
        // // get cmc map data
        // const cmcMapRes = await axios.get('https://pro-api.coinmarketcap.com/v1/cryptocurrency/map', {
        //     headers: {
        //         'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
        //     }
        // })
        // const cmcMapData = cmcMapRes.data.data.filter((d: any) => ['MATIC', 'SUI'].includes(d.symbol))
        // console.log('cmcMapData', cmcMapData)

        let nativeSymbol = ''
        Object.keys(ASSET_MAP).forEach((assetNativeSymbol) => {
            if (ASSET_MAP[assetNativeSymbol]?.symbols.includes(symbol)) nativeSymbol = assetNativeSymbol
        })
        if (!nativeSymbol) {
            logger.error('Cannot found symbol', symbol)
            return '0'
        }

        if (ASSET_MAP[nativeSymbol].priceUsd === '') {
            const url = `https://pro-api.coinmarketcap.com/v2/cryptocurrency/quotes/latest?id=${ASSET_MAP[nativeSymbol].cmcId}`
            const priceRes = await axios.get(url, {
                headers: {
                    'X-CMC_PRO_API_KEY': process.env.COINMARKETCAP_API_KEY
                }
            })

            const priceData = priceRes.data.data[ASSET_MAP[nativeSymbol].cmcId || '']
            const priceUsd = priceData.quote.USD.price.toFixed(6)
            ASSET_MAP[nativeSymbol].priceUsd = priceUsd
        }

        return ASSET_MAP[nativeSymbol].priceUsd
    }

    async convertAmountUsd(amount: string, assetSymbol: string) {
        const priceUsd = await this.getPrice(assetSymbol)
        const amountNumber = Number(amount) * Number(priceUsd)
        return amountNumber.toFixed(6)
    }

    formatUnits(amount: string, decimals: number) {
        return ethers.utils.formatUnits(amount, decimals)
    }

    async parseTokenTransfers(network: string, txHash: string): Promise<TokenTransfer[] | undefined> {
        if (network == NETWORK.ICON) {
            const maxRetries = 3
            const retryDelay = 3000
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    const txHashRes = await this.callApi(`${API_URL[network]}/transactions/token-transfers`, { transaction_hash: txHash })
                    const rs = txHashRes.data

                    const groupBySymbol = rs.reduce((group: any, item: any) => {
                        const { token_contract_symbol } = item
                        group[token_contract_symbol] = group[token_contract_symbol] ?? []
                        group[token_contract_symbol].push(item)
                        return group
                    }, {})

                    let tokenTransfer: TokenTransfer[] = []
                    for (const symbol in groupBySymbol) {
                        tokenTransfer.push({
                            asset: {
                                name: symbol,
                                symbol: symbol
                                // decimals: 0
                            },
                            amount: groupBySymbol[symbol]
                                .sort((a: any, b: any) => a.value_decimal - b.value_decimal)
                                .pop()
                                ?.value_decimal?.toString()
                        })
                    }

                    return tokenTransfer
                } catch (error: any) {
                    logger.error(`${network} get token transfers error ${error.code}`)
                    if (attempt < maxRetries) {
                        await sleep(retryDelay)
                    } else {
                        logger.error(`${network} get token transfers failed ${txHash}`)
                    }
                }
            }

            return []
        }

        if (network == NETWORK.HAVAH) {
            const maxRetries = 3
            const retryDelay = 3000
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    let txHashRes = await this.callApi(`${API_URL[network]}/transaction/info`, {
                        txHash: txHash
                    })

                    // TODO: correct asset
                    return [
                        {
                            asset: {
                                name: NATIVE_ASSET[network],
                                symbol: NATIVE_ASSET[network]
                            },
                            amount: txHashRes.data.data.amount
                        } as TokenTransfer
                    ]
                } catch (error: any) {
                    logger.error(`${network} get transaction error ${error.code}`)
                    if (attempt < maxRetries) {
                        await sleep(retryDelay)
                    } else {
                        logger.error(`${network} get transaction failed ${txHash}`)
                    }
                }
            }

            return []
        }

        // EVM based
        if (
            network == NETWORK.BSC ||
            network == NETWORK.ETH2 ||
            network == NETWORK.BASE ||
            network == NETWORK.ARBITRUM ||
            network == NETWORK.OPTIMISM ||
            network == NETWORK.AVAX ||
            network == NETWORK.POLYGON
        ) {
            let provider = new ethers.providers.JsonRpcProvider(RPC_URL[network])

            const maxRetries = 5
            const retryDelay = 2000
            let retryProviderIndex = -1
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                // depositNative
                try {
                    const tx = await provider.getTransaction(txHash)

                    const assetManagerAbi = require('../../abi/AssetManager.abi.json')
                    const contractInterface = new ethers.utils.Interface(assetManagerAbi)
                    const parsedTx = contractInterface.parseTransaction(tx)
                    // console.log('parsedTx', parsedTx)

                    if (parsedTx.name == 'depositNative') {
                        return [
                            {
                                asset: {
                                    name: NATIVE_ASSET[network],
                                    symbol: NATIVE_ASSET[network]
                                },
                                amount: this.formatUnits(parsedTx.args?.amount?.toString(), 18)
                            } as TokenTransfer
                        ]
                    }
                } catch (error) {}

                // deposit tokens
                try {
                    const tx = await provider.getTransactionReceipt(txHash)

                    let tokenTransfers: TokenTransfer[] = []
                    for (let index = 0; index < tx.logs.length; index++) {
                        const log = tx.logs[index]
                        try {
                            const erc20Interface = new ethers.utils.Interface([
                                'event Transfer(address indexed from, address indexed to, uint256 value)'
                            ])
                            const parsedLog = erc20Interface.parseLog(log)
                            const amount = parsedLog.args.value.toString()
                            const assetAddress = log.address

                            const erc20 = new ethers.Contract(assetAddress, ERC20_ABI, provider)
                            const symbol = await erc20.symbol()
                            const decimals = await erc20.decimals()

                            tokenTransfers.push({
                                asset: {
                                    name: symbol.toString(),
                                    symbol: symbol.toString(),
                                    contract: assetAddress,
                                    decimals: decimals
                                },
                                amount: this.formatUnits(amount.toString(), decimals)
                            })
                        } catch (error) {}
                    }

                    return tokenTransfers
                } catch (error: any) {
                    logger.error(`${network} parseTokenTransfers error ${error.code}`)
                    if (attempt < maxRetries) {
                        // try change other provider
                        if (retryProviderIndex < RPC_URLS[network].length - 1) {
                            retryProviderIndex += 1
                            provider = new ethers.providers.JsonRpcProvider(RPC_URLS[network][retryProviderIndex])
                            logger.info(`${network} change provider uri ${RPC_URLS[network][retryProviderIndex]}`)
                        }

                        await sleep(retryDelay)
                    } else {
                        logger.error(`${network} parseTokenTransfers failed ${txHash}`)
                    }
                }
            }

            return []
        }

        // Cosmos IBC
        if (network == NETWORK.IBC_ARCHWAY || network == NETWORK.IBC_INJECTIVE || network == NETWORK.IBC_NEUTRON) {
            // oply support mainnet
            const MINTSCAN_BASE_API = 'https://apis.mintscan.io/v1'
            const MINTSCAN_API_KEY = process.env.SCAN_MINTSCAN_API_KEY
            const url = `${MINTSCAN_BASE_API}/${network.replace('ibc_', '')}/txs/${cosmosAddress(txHash)}`

            const txsRes = await this.callApi(url, {}, MINTSCAN_API_KEY)
            const data = txsRes.data[0]
            const msgExecuteContractItem = data.tx['/cosmos-tx-v1beta1-Tx'].body?.messages?.find(
                (t: any) => t['@type'] == '/cosmwasm.wasm.v1.MsgExecuteContract' || t['@type'] == '/injective.wasmx.v1.MsgExecuteContractCompat'
            )
            const msgExecuteContract = msgExecuteContractItem['/cosmwasm-wasm-v1-MsgExecuteContract']
            // console.log('msgExecuteContract', msgExecuteContract)

            // try get transfer info
            if (msgExecuteContract.funds.length == 0) {
                // assume transfer native

                const transferLog = data.logs[0].events.find((e: any) => e.type == 'transfer')
                if (!transferLog) {
                    return []
                }

                const transferAmount = transferLog.attributes?.find((a: any) => a.key == 'amount')?.value.toString()
                const nativeDenom = ASSET_MAP[NATIVE_ASSET[network]].denom
                const transferAssetDenom =
                    transferAmount.indexOf(nativeDenom) > 0 ? nativeDenom : transferAmount.substring(transferAmount.indexOf('ibc/'))
                const assetInfo =
                    transferAssetDenom == nativeDenom
                        ? ({ name: NATIVE_ASSET[network], symbol: NATIVE_ASSET[network] } as TokenInfo)
                        : this.getAssetByContract(network, transferAssetDenom)

                return [
                    {
                        asset: assetInfo,
                        amount: this.formatUnits(transferAmount.replace(transferAssetDenom, ''), ASSET_MAP[NATIVE_ASSET[network]].decimals)
                    } as TokenTransfer
                ]
            }

            return msgExecuteContract.funds.map((f: any) => {
                const assetInfo = this.getAssetByContract(network, f.denom)

                return {
                    asset: assetInfo,
                    amount: this.formatUnits(f.amount, assetInfo.decimals || 18)
                } as TokenTransfer
            })
        }
    }

    async getLoanTransfer(txHash: string) {
        const txHashRes = await this.callApi(`${API_URL[NETWORK.ICON]}/logs`, { transaction_hash: txHash })
        const data = txHashRes.data
        const loanData = data?.find(
            (item: any) => item.method == 'OriginateLoan' || item.method == 'CollateralReceived' || item.method == 'LoanRepaid'
        )
        return loanData?.method as string
    }

    async isSwapTransfer(txHash: string) {
        const txHashRes = await this.callApi(`${API_URL[NETWORK.ICON]}/logs`, { transaction_hash: txHash })
        const data = txHashRes.data
        const swapData = data?.find((item: any) => item.method == 'Swap')
        return swapData
    }

    async parseMgsAction(fromNetwork: string, fromHash: string, toNetwork: string, toHash: string) {
        const fromTokenTransfers = await this.parseTokenTransfers(fromNetwork, fromHash)
        const toTokenTransfers = await this.parseTokenTransfers(toNetwork, toHash)

        // console.log('fromTokenTransfers', fromTokenTransfers)
        // console.log('toTokenTransfers', toTokenTransfers)

        if (!fromTokenTransfers || !toTokenTransfers) {
            return undefined
        }

        // transfer
        if (fromTokenTransfers.length == 1 || toTokenTransfers.length == 1) {
            const msgAction: MgsAction = {
                type: 'transfer',
                detail: {
                    type: 'transfer',
                    src_network: fromNetwork,
                    src_asset: fromTokenTransfers[0] ? fromTokenTransfers[0].asset : ({ name: '', symbol: '' } as TokenInfo),
                    src_amount: fromTokenTransfers[0] ? fromTokenTransfers[0].amount : '0',
                    dest_network: toNetwork,
                    dest_asset: toTokenTransfers[0] ? toTokenTransfers[0].asset : ({ name: '', symbol: '' } as TokenInfo),
                    dest_amount: toTokenTransfers[0] ? toTokenTransfers[0].amount : '0'
                },
                // TODO: correct decimals
                amount_usd: '0'
            }
            const amountAsset = fromTokenTransfers[0] ?? toTokenTransfers[0]
            msgAction.amount_usd = await this.convertAmountUsd(amountAsset.amount, amountAsset.asset.symbol)

            if (fromNetwork == NETWORK.ICON || toNetwork == NETWORK.ICON) {
                const txHash = fromNetwork == NETWORK.ICON ? fromHash : toHash
                const txHashRes = await this.callApi(`${API_URL[NETWORK.ICON]}/logs`, { transaction_hash: txHash })
                const loanData = txHashRes.data?.find(
                    (item: any) => item.method == 'OriginateLoan' || item.method == 'CollateralReceived' || item.method == 'LoanRepaid'
                )
                const swapData = txHashRes.data?.find((item: any) => item.method == 'Swap')

                // LOAN
                if (loanData) {
                    msgAction.type = `loan-${loanData.method.toLowerCase()}`
                    msgAction.detail!.type = 'loan'
                }

                // SWAP
                if (swapData) {
                    msgAction.type = `swap`
                    msgAction.detail!.type = 'swap'

                    if (fromNetwork == NETWORK.ICON) {
                        for (let i = 0; i < fromTokenTransfers.length; i++) {
                            const tokenTransfer = fromTokenTransfers[i]
                            const destNativeAsset = this.getNativeAssetSymbol(tokenTransfer.asset.symbol, msgAction.detail!.dest_asset.symbol)
                            if (destNativeAsset) {
                                // correct dest_amount
                                msgAction.detail!.dest_amount = tokenTransfer.amount
                            }
                        }
                    }

                    if (toNetwork == NETWORK.ICON) {
                        for (let i = 0; i < toTokenTransfers.length; i++) {
                            const tokenTransfer = toTokenTransfers[i]
                            const fromNativeAsset = this.getNativeAssetSymbol(tokenTransfer.asset.symbol, msgAction.detail!.src_asset.symbol)
                            if (fromNativeAsset) {
                                // correct src_amount
                                msgAction.detail!.src_amount = tokenTransfer.amount
                            }
                        }
                    }

                    // correct amount
                    if (msgAction.detail && this.isUsdAsset(msgAction.detail.src_asset.symbol)) {
                        msgAction.amount_usd = Number(msgAction.detail.src_amount).toFixed(6)
                    } else if (msgAction.detail && this.isUsdAsset(msgAction.detail.dest_asset.symbol)) {
                        msgAction.amount_usd = Number(msgAction.detail.dest_amount).toFixed(6)
                    } else {
                        msgAction.amount_usd = await this.convertAmountUsd(msgAction.detail!.src_amount, msgAction.detail!.src_asset.symbol)
                    }
                }
            }

            return msgAction
        }

        // // swap
        // if (fromTokenTransfers.length == 2 || toTokenTransfers.length == 2) {
        //     const msgAction: MgsAction = {
        //         type: 'swap',
        //         detail: {
        //             type: 'swap',
        //             src_network: fromNetwork,
        //             src_asset: { name: '', symbol: '' },
        //             src_amount: '0',
        //             dest_network: toNetwork,
        //             dest_asset: { name: '', symbol: '' },
        //             dest_amount: '0'
        //         } as MgsActionDetail,
        //         amount_usd: '0'
        //     }

        //     if (fromNetwork == NETWORK.ICON) {
        //         msgAction.detail!.dest_asset = toTokenTransfers[0].asset
        //         msgAction.detail!.dest_amount = toTokenTransfers[0].amount

        //         for (let i = 0; i < fromTokenTransfers.length; i++) {
        //             const tokenTransfer = fromTokenTransfers[i]
        //             const nativeAssetSymbol = this.getNativeAssetSymbol(tokenTransfer.asset.symbol, msgAction.detail!.dest_asset.symbol)
        //             if (!nativeAssetSymbol) {
        //                 msgAction.detail!.src_asset = tokenTransfer.asset
        //                 msgAction.detail!.src_amount = tokenTransfer.amount

        //                 // TODO: correct decimals
        //                 msgAction.amount_usd = (
        //                     Number(msgAction.detail!.src_amount) * Number(this.getPrice(msgAction.detail!.src_asset.symbol))
        //                 ).toString()
        //             }
        //         }
        //     }

        //     if (toNetwork == NETWORK.ICON) {
        //         msgAction.detail!.src_asset = fromTokenTransfers[0].asset
        //         msgAction.detail!.src_amount = fromTokenTransfers[0].amount

        //         for (let i = 0; i < toTokenTransfers.length; i++) {
        //             const tokenTransfer = toTokenTransfers[i]
        //             const nativeAssetSymbol = this.getNativeAssetSymbol(tokenTransfer.asset.symbol, msgAction.detail!.src_asset.symbol)
        //             if (!nativeAssetSymbol) {
        //                 msgAction.detail!.dest_asset = tokenTransfer.asset
        //                 msgAction.detail!.dest_amount = tokenTransfer.amount

        //                 // TODO: correct decimals
        //                 msgAction.amount_usd = (
        //                     Number(msgAction.detail!.src_amount) * Number(this.getPrice(msgAction.detail!.src_asset.symbol))
        //                 ).toString()
        //             }
        //         }
        //     }

        //     return msgAction
        // }

        // default as sending message
        return {
            type: 'sendmsg',
            amount_usd: '0'
        } as MgsAction
    }
}

import logger from '../logger/logger'
import { BigNumber, ethers } from 'ethers'
import axios from 'axios'
import { API_KEY, API_URL, NETWORK, RPC_URL, RPC_URLS, USE_MAINNET, WEB3_ALCHEMY_API_KEY } from '../../common/constants'
import { cosmosHash, sleep } from '../../common/helper'
import AxiosCustomInstance from '../scan/AxiosCustomInstance'
import { retryAsync } from 'ts-retry'
import IconService from 'icon-sdk-js'
// import { Alchemy, AssetTransfersCategory, Network } from 'alchemy-sdk'

const ERC20_ABI = require('../../abi/Erc20.abi.json')

// map native tokens to wrapped tokens
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
    USDT: {
        symbols: ['USDT', 'archUSDT'],
        decimals: 6,
        priceUsd: '1'
    },
    BTC: {
        symbols: ['BTC', 'WBTC', 'tBTC'],
        decimals: 18,
        priceUsd: '',
        cmcId: 1
    },
    ETH: {
        symbols: ['ETH', 'WETH', 'weETH'],
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

// native assets
const NATIVE_ASSETS: { [network: string]: string[] } = {
    [NETWORK.ICON]: ['ICX', 'sICX'],
    [NETWORK.BSC]: ['BNB'],
    [NETWORK.ETH2]: ['ETH'],
    [NETWORK.HAVAH]: ['HVH'],
    [NETWORK.IBC_ARCHWAY]: ['ARCH'],
    [NETWORK.IBC_NEUTRON]: ['NTRN'],
    [NETWORK.IBC_INJECTIVE]: ['INJ'],
    [NETWORK.AVAX]: ['AVAX'],
    [NETWORK.BASE]: ['ETH'],
    [NETWORK.ARBITRUM]: ['ETH'],
    [NETWORK.OPTIMISM]: ['ETH'],
    [NETWORK.SUI]: ['SUI'],
    [NETWORK.POLYGON]: ['MATIC']
}

const NETWORK_ASSETS: { [network: string]: string[] } = {
    [NETWORK.ICON]: ['ICX', 'bnUSD', 'sICX', 'BALN', 'USDT', 'USDC', 'sARCH', 'SUI', 'INJ', 'HVH', 'ETH', 'BTC', 'BNB', 'AVAX', 'hyTB', 'OMM', 'CFT'],
    [NETWORK.BSC]: ['BNB', 'bnUSD'],
    [NETWORK.ETH2]: ['ETH'],
    [NETWORK.HAVAH]: ['HVH', 'bnUSD'],
    [NETWORK.IBC_ARCHWAY]: ['ARCH', 'sARCH', 'bnUSD', 'USDC'],
    [NETWORK.IBC_NEUTRON]: ['NTRN'],
    [NETWORK.IBC_INJECTIVE]: ['INJ', 'bnUSD'],
    [NETWORK.AVAX]: ['AVAX', 'bnUSD', 'USDT', 'USDC'],
    [NETWORK.BASE]: ['ETH', 'bnUSD', 'USDC'],
    [NETWORK.ARBITRUM]: ['ETH', 'WBTC', 'tBTC', 'bnUSD', 'USDT', 'USDC'],
    [NETWORK.OPTIMISM]: ['ETH'],
    [NETWORK.SUI]: ['SUI'],
    [NETWORK.POLYGON]: ['MATIC']
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

    private async callApi(apiUrl: string, params: any, apiKey: string = ''): Promise<any> {
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

        logger.error(`called api might be failed ${apiUrl}`)
        return undefined
    }

    private async getSuiTx(txHash: string) {
        const network = NETWORK.SUI
        const apiUrl = `${API_URL[network]}/${API_KEY[network]}`
        const postData = {
            jsonrpc: '2.0',
            id: 1,
            method: 'sui_getTransactionBlock',
            params: [
                txHash,
                {
                    showBalanceChanges: true,
                    showEffects: true,
                    showInput: true,
                    showEvents: true,
                    showObjectChanges: true,
                    showRawInput: true
                }
            ]
        }

        try {
            const axiosInstance = AxiosCustomInstance.getInstance()
            const res = await retryAsync(
                async () => {
                    return await axiosInstance.post(apiUrl, postData)
                },
                { delay: 1000, maxTry: 3 }
            )

            return res.data.result
        } catch (error: any) {
            logger.error(`called api failed ${apiUrl} ${error.code}`)
        }
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
        const usdAssets = ['USDC', 'USDT', 'bnUSD']
        for (let index = 0; index < usdAssets.length; index++) {
            const key = usdAssets[index]
            if (ASSET_MAP[key].symbols.includes(symbol)) return true
        }

        return false
    }

    private async getPrice(symbol: string) {
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
            logger.error(`Cannot found symbol ${symbol}`)
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

    private async convertAmountUsd(amount: string, assetSymbol: string) {
        if (!assetSymbol || this.isUsdAsset(assetSymbol)) return amount

        const priceUsd = await this.getPrice(assetSymbol)
        const amountNumber = Number(amount) * Number(priceUsd)
        return amountNumber.toFixed(6)
    }

    private formatUnits(amount: string, decimals: number) {
        return ethers.utils.formatUnits(amount, decimals)
    }

    private async parseIconTokenTransfers(txHash: string) {
        const network = NETWORK.ICON
        const txHashRes = await retryAsync(
            async () => {
                return await this.callApi(`${API_URL[network]}/transactions/token-transfers`, { transaction_hash: txHash })
            },
            { delay: 1000, maxTry: 3 }
        )
        const rs = txHashRes?.data

        let tokenTransfer: TokenTransfer[] = []
        if (rs) {
            const groupBySymbol = rs.reduce((group: any, item: any) => {
                const { token_contract_symbol } = item
                group[token_contract_symbol] = group[token_contract_symbol] ?? []
                group[token_contract_symbol].push(item)
                return group
            }, {})

            for (const symbol in groupBySymbol) {
                // skip burned token
                if (groupBySymbol[symbol].filter((item: any) => item.to_address == 'hx0000000000000000000000000000000000000000').length > 0) continue

                const token = groupBySymbol[symbol].sort((a: any, b: any) => a.value_decimal - b.value_decimal).pop()
                tokenTransfer.push({
                    asset: {
                        name: symbol,
                        symbol: symbol,
                        contract: token?.token_contract_address
                        // decimals: 0
                    },
                    amount: token?.value_decimal.toString()
                })
            }
        }

        return tokenTransfer
    }

    private async parseHavahTokenTransfers(txHash: string) {
        const network = NETWORK.HAVAH
        const txHashRes = await retryAsync(
            async () => {
                return await this.callApi(`${API_URL[network]}/transaction/info`, {
                    txHash: txHash
                })
            },
            { delay: 1000, maxTry: 3 }
        )

        // TODO: correct asset
        return [
            {
                asset: {
                    name: NATIVE_ASSETS[network][0],
                    symbol: NATIVE_ASSETS[network][0]
                },
                amount: txHashRes.data.data.amount
            } as TokenTransfer
        ]
    }

    private async parseEvmTokenTransfers(network: string, txHash: string) {
        // const provider = new ethers.providers.JsonRpcProvider(RPC_URLS[network][0])
        const provider = new ethers.providers.FallbackProvider(RPC_URLS[network].map((n) => new ethers.providers.StaticJsonRpcProvider(n)))

        // deposit Native
        let tx = await retryAsync(
            async () => {
                return await provider.getTransaction(txHash)
            },
            { delay: 1000, maxTry: 3 }
        )

        const assetManagerAbi = require('../../abi/AssetManager.abi.json')
        const contractInterface = new ethers.utils.Interface(assetManagerAbi)
        let parsedTx = undefined

        try {
            parsedTx = contractInterface.parseTransaction(tx)
        } catch (error) {}

        if (parsedTx && parsedTx.name == 'depositNative') {
            return [
                {
                    asset: {
                        name: NATIVE_ASSETS[network][0],
                        symbol: NATIVE_ASSETS[network][0]
                    },
                    amount: this.formatUnits(parsedTx.args?.amount?.toString(), 18)
                } as TokenTransfer
            ]
        }

        // deposit tokens
        let tokenTransfers: TokenTransfer[] = []
        let txDetail = await retryAsync(
            async () => {
                return await provider.getTransactionReceipt(txHash)
            },
            { delay: 1000, maxTry: 3 }
        )
        if (txDetail && txDetail.logs) {
            for (let index = 0; index < txDetail.logs.length; index++) {
                const log = txDetail.logs[index]
                try {
                    const erc20Interface = new ethers.utils.Interface(['event Transfer(address indexed from, address indexed to, uint256 value)'])
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

            // TODO: Using Alchemy to get token transfers
            // // try alchemy
            // const config = {
            //     apiKey: WEB3_ALCHEMY_API_KEY,
            //     network: Network.BASE_MAINNET
            // }
            // const alchemy = new Alchemy(config)
            // const assetTransfers = await alchemy.core.getAssetTransfers({
            //     fromBlock: `0x${txDetail.blockNumber.toString(16)}`,
            //     toBlock: `0x${txDetail.blockNumber.toString(16)}`,
            //     fromAddress: txDetail.from,
            //     toAddress: txDetail.to,
            //     excludeZeroValue: true,
            //     category: [AssetTransfersCategory.INTERNAL]
            // })
            // console.log('assetTransfers', assetTransfers)

            // Try get internal transactions
            if (tokenTransfers.length == 0) {
                const internalTxsRes = await this.callApi(API_URL[network], {
                    module: 'account',
                    action: 'txlistinternal',
                    txhash: txDetail.transactionHash,
                    // address: txDetail.to,
                    // startblock: txDetail.blockNumber,
                    // endblock: txDetail.blockNumber,
                    apikey: API_KEY[network],
                    page: 1,
                    offset: 10,
                    sort: 'asc'
                })
                if (internalTxsRes && internalTxsRes.data) {
                    for (let i = 0; i < internalTxsRes.data.result.length; i++) {
                        const internalTx = internalTxsRes.data.result[i]

                        const nativeAssetSymbol = NATIVE_ASSETS[network][0]
                        const nativeAsset = ASSET_MAP[nativeAssetSymbol]
                        tokenTransfers.push({
                            asset: {
                                name: nativeAssetSymbol,
                                symbol: nativeAssetSymbol
                            },
                            amount: this.formatUnits(internalTx.value.toString(), nativeAsset.decimals)
                        })
                    }
                }
            }
        }

        // in case of AVAX missing logs
        if (network == NETWORK.AVAX && tokenTransfers.length == 0) {
            const url = `https://cdn.routescan.io/api/blockchain/43114/tx/${txHash}?lean=false`
            const res = await retryAsync(
                async () => {
                    return await this.callApi(url, {})
                },
                { delay: 1000, maxTry: 3 }
            )
            const transferOp = res?.data?.operations?.find((op: any) => op.value > 0)
            if (transferOp) {
                const symbol = NATIVE_ASSETS[network][0]
                const decimals = ASSET_MAP[symbol]?.decimals
                tokenTransfers.push({
                    asset: {
                        name: symbol,
                        symbol: symbol,
                        decimals: decimals
                    },
                    amount: decimals ? this.formatUnits(transferOp.value.toString(), decimals) : '0'
                })
            }
        }

        return tokenTransfers
    }

    private async parseCosmosTokenTransfers(network: string, txHash: string) {
        let tokenTransfer: TokenTransfer[] = []

        // only support mainnet
        const MINTSCAN_BASE_API = 'https://apis.mintscan.io/v1'
        const MINTSCAN_API_KEY = process.env.SCAN_MINTSCAN_API_KEY
        const url = `${MINTSCAN_BASE_API}/${network.replace('ibc_', '')}/txs/${cosmosHash(txHash)}`
        const txsRes = await this.callApi(url, {}, MINTSCAN_API_KEY)
        const data = txsRes?.data[0]

        if (data) {
            const msgExecuteContractItem = data.tx['/cosmos-tx-v1beta1-Tx'].body?.messages?.find(
                (t: any) => t['@type'] == '/cosmwasm.wasm.v1.MsgExecuteContract' || t['@type'] == '/injective.wasmx.v1.MsgExecuteContractCompat'
            )
            const msgExecuteContract = msgExecuteContractItem['/cosmwasm-wasm-v1-MsgExecuteContract']

            // try get transfer info
            if ((msgExecuteContract && msgExecuteContract.funds.length == 0) || (network == NETWORK.IBC_INJECTIVE && msgExecuteContractItem)) {
                // assume transfer native

                let crossTransferLog = data.logs[0].events.find((e: any) => e.type == 'wasm-CrossTransfer')
                if (crossTransferLog) {
                    const transferAmount = crossTransferLog.attributes?.find((a: any) => a.key == 'value')?.value.toString()
                    tokenTransfer = [
                        {
                            asset: { name: '', symbol: '' },
                            amount: this.formatUnits(transferAmount, 18)
                        } as TokenTransfer
                    ]
                } else {
                    // try find transfer log
                    let transferLog = data.logs[0].events.find((e: any) => e.type == 'transfer')
                    if (!transferLog) return []
                    const nativeAssetSymbol = NATIVE_ASSETS[network][0]
                    const transferAmount = transferLog.attributes?.find((a: any) => a.key == 'amount')?.value.toString()
                    const nativeDenom = ASSET_MAP[nativeAssetSymbol].denom
                    const transferAssetDenom =
                        transferAmount.indexOf(nativeDenom) > 0 ? nativeDenom : transferAmount.substring(transferAmount.indexOf('ibc/'))

                    const assetInfo =
                        transferAssetDenom == nativeDenom
                            ? ({ name: nativeAssetSymbol, symbol: nativeAssetSymbol } as TokenInfo)
                            : this.getAssetByContract(network, transferAssetDenom)

                    tokenTransfer = [
                        {
                            asset: assetInfo,
                            amount: this.formatUnits(transferAmount.replace(transferAssetDenom, ''), ASSET_MAP[nativeAssetSymbol].decimals)
                        } as TokenTransfer
                    ]
                }
            }

            if (msgExecuteContract && msgExecuteContract.funds.length > 0) {
                tokenTransfer = msgExecuteContract.funds.map((f: any) => {
                    const assetInfo = this.getAssetByContract(network, f.denom)

                    return {
                        asset: assetInfo,
                        amount: this.formatUnits(f.amount, assetInfo.decimals || 18)
                    } as TokenTransfer
                })

                // don't care native token fee
                if (tokenTransfer.length > 1) return tokenTransfer.filter((t) => t.asset.symbol != NATIVE_ASSETS[network][0])
            }
        }

        return tokenTransfer
    }

    private async parseSuiTokenTransfers(txhash: string) {
        const network = NETWORK.SUI
        const networkDecimals = 9
        const tokenTransfer: TokenTransfer[] = []

        const tx = await this.getSuiTx(txhash)

        if (tx && tx.balanceChanges) {
            for (let index = 0; index < tx.balanceChanges.length; index++) {
                const balance = tx.balanceChanges[index]
                const amount = Math.abs(Number(balance.amount.toString()))

                let symbol = balance.coinType.split('::').pop()
                // fix wrong symbol
                symbol = symbol == 'BALANCED_DOLLAR' ? 'bnUSD' : symbol

                // don't care tiny amount
                // 10000000 ~ 0.01
                const tinyAmount = 10000000
                if (symbol == 'SUI' && amount < tinyAmount) continue

                tokenTransfer.push({
                    asset: {
                        name: symbol,
                        symbol: symbol
                    },
                    amount: this.formatUnits(amount.toString(), networkDecimals)
                } as TokenTransfer)
            }
        }

        return tokenTransfer
    }

    async parseTokenTransfers(network: string, txHash: string): Promise<TokenTransfer[] | undefined> {
        if (network == NETWORK.ICON) {
            return await this.parseIconTokenTransfers(txHash)
        }

        if (network == NETWORK.HAVAH) {
            return await this.parseHavahTokenTransfers(txHash)
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
            return await this.parseEvmTokenTransfers(network, txHash)
        }

        // Cosmos IBC
        if (network == NETWORK.IBC_ARCHWAY || network == NETWORK.IBC_INJECTIVE || network == NETWORK.IBC_NEUTRON) {
            return await this.parseCosmosTokenTransfers(network, txHash)
        }

        // SUI
        if (network == NETWORK.SUI) {
            return await this.parseSuiTokenTransfers(txHash)
        }
    }

    async parseMgsAction(fromNetwork: string, fromHash: string, toNetwork: string, toHash: string) {
        const fromTokenTransfers = await this.parseTokenTransfers(fromNetwork, fromHash)
        const toTokenTransfers = await this.parseTokenTransfers(toNetwork, toHash)

        logger.info(`fromTokenTransfers ${JSON.stringify(fromTokenTransfers)}`)
        logger.info(`toTokenTransfers ${JSON.stringify(toTokenTransfers)}`)

        if (!fromTokenTransfers || !toTokenTransfers) {
            return undefined
        }

        let msgAction: MgsAction = {
            type: 'SendMsg',
            amount_usd: '0',
            detail: {
                type: '',
                src_network: fromNetwork,
                src_asset: { name: '', symbol: '' },
                src_amount: '',
                dest_network: toNetwork,
                dest_asset: { name: '', symbol: '' },
                dest_amount: ''
            }
        }

        // transfer
        if (fromTokenTransfers.length == 1 || toTokenTransfers.length == 1) {
            let srcTokenTransfer = fromTokenTransfers[0]
            let destTokenTransfer = toTokenTransfers.find((t) => t.asset.symbol == srcTokenTransfer?.asset.symbol)
            // const tokenTransfer = toTokenTransfers.find((t) => fromTokenTransfers.filter(from => from.asset.symbol == t.asset.symbol).length > 0 )

            // fix for sui cases
            if (!destTokenTransfer) destTokenTransfer = toTokenTransfers[0]

            msgAction = {
                type: 'Transfer',
                detail: {
                    type: 'Transfer',
                    src_network: fromNetwork,
                    src_asset: srcTokenTransfer ? srcTokenTransfer.asset : ({ name: '', symbol: '' } as TokenInfo),
                    src_amount: srcTokenTransfer ? srcTokenTransfer.amount : '',
                    dest_network: toNetwork,
                    dest_asset: destTokenTransfer ? destTokenTransfer.asset : ({ name: '', symbol: '' } as TokenInfo),
                    dest_amount: destTokenTransfer ? destTokenTransfer.amount : ''
                },
                amount_usd: '0'
            }

            msgAction.amount_usd = await this.convertAmountUsd(
                msgAction.detail?.src_amount || msgAction.detail?.dest_amount || '',
                msgAction.detail?.src_asset.symbol || msgAction.detail?.dest_asset.symbol || ''
            )
        }

        // xtransfer - swap - loan
        if (fromNetwork == NETWORK.ICON || toNetwork == NETWORK.ICON) {
            const txHash = fromNetwork == NETWORK.ICON ? fromHash : toHash
            const txHashRes = await retryAsync(
                async () => {
                    return await this.callApi(`${API_URL[NETWORK.ICON]}/logs`, { transaction_hash: txHash })
                },
                { delay: 1000, maxTry: 5 }
            )

            if (txHashRes && txHashRes.data) {
                const xtransfer = txHashRes?.data?.find((item: any) => item.method == 'XTransfer')
                const loanData = txHashRes?.data?.find(
                    (item: any) => item.method == 'OriginateLoan' || item.method == 'CollateralReceived' || item.method == 'LoanRepaid'
                )
                const swapData = txHashRes?.data?.find((item: any) => item.method == 'Swap')

                // Cross Transfer
                if (xtransfer) {
                    msgAction.type = `Transfer`
                    msgAction.detail!.type = 'CrossTransfer'

                    // assume native asset
                    if (fromNetwork == NETWORK.ICON && msgAction.detail && !msgAction.detail.src_asset) {
                        msgAction.detail.src_asset = { name: 'ICX', symbol: 'ICX' }
                        msgAction.detail.src_amount = ethers.utils.formatEther(BigNumber.from(JSON.parse(xtransfer.data)[1]).toString()).toString()
                        msgAction.amount_usd = await this.convertAmountUsd(msgAction.detail!.src_amount, msgAction.detail!.src_asset.symbol)
                    }

                    msgAction.amount_usd = await this.convertAmountUsd(
                        msgAction.detail?.src_amount || msgAction.detail?.dest_amount || '',
                        msgAction.detail?.src_asset.symbol || msgAction.detail?.dest_asset.symbol || ''
                    )
                }

                // LOAN
                if (loanData) {
                    msgAction.type = `Loan`
                    msgAction.detail!.type = `Loan-${loanData.method}`
                }

                // SWAP
                if (swapData) {
                    if (fromNetwork == NETWORK.ICON && fromTokenTransfers.length >= 2) {
                        msgAction.type = `Swap`
                        msgAction.detail!.type = 'Swap'

                        const destTokenTransfer = toTokenTransfers[0]
                        if (destTokenTransfer) {
                            msgAction.detail!.dest_asset = destTokenTransfer.asset
                            msgAction.detail!.dest_amount = destTokenTransfer.amount
                        }

                        // swap from native assets & erc20 assets
                        const srcTokenTransfer = fromTokenTransfers.find(
                            (t) =>
                                destTokenTransfer &&
                                t.asset.symbol != destTokenTransfer.asset.symbol &&
                                (NATIVE_ASSETS[fromNetwork].includes(t.asset.symbol) || NETWORK_ASSETS[fromNetwork].includes(t.asset.symbol))
                        )
                        if (srcTokenTransfer) {
                            msgAction.detail!.src_asset = srcTokenTransfer.asset
                            msgAction.detail!.src_amount = srcTokenTransfer.amount
                        }
                    }

                    if (toNetwork == NETWORK.ICON && toTokenTransfers.length >= 2) {
                        msgAction.type = `Swap`
                        msgAction.detail!.type = 'Swap'

                        const srcTokenTransfer = fromTokenTransfers[0]

                        if (srcTokenTransfer) {
                            msgAction.detail!.src_asset = srcTokenTransfer.asset
                            msgAction.detail!.src_amount = srcTokenTransfer.amount
                        }

                        // // TODO: swap to ICX
                        // const icxTransfers = txHashRes.data?.filter((e: any) => e.method == 'ICXTransfer')
                        // if (icxTransfers && icxTransfers.length > 0) {
                        //     const icxTransferAmount = JSON.parse(icxTransfers[0].indexed).pop()

                        //     msgAction.detail!.dest_asset = { symbol: 'ICX', name: 'ICX' }
                        //     msgAction.detail!.dest_amount = ethers.utils.formatEther(BigNumber.from(icxTransferAmount).toString()).toString()
                        // }

                        const destTokenTransfer = toTokenTransfers.find((t) => t.asset.symbol != srcTokenTransfer?.asset.symbol)
                        if (destTokenTransfer) {
                            msgAction.detail!.dest_asset = destTokenTransfer.asset
                            msgAction.detail!.dest_amount = destTokenTransfer.amount
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
        }

        // default as sending message
        return msgAction
    }
}

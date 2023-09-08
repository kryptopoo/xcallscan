import { Suspense } from 'react'
import MessageList from '@/components/message-list'
import FetchData from '@/lib/fetch-data'
import Loading from './loading'
import SearchBar from '@/components/searchbar'
import converter from '@/lib/converter'

export default async function Home() {
    const pageSize = 10
    const pageNumber = 1
    const rs = await FetchData.getMessages(pageSize, pageNumber)
    const statisticRs = await FetchData.getStatistic()
    const statisticData = await statisticRs.data

    let coincapAssets = [
        { name: 'BNB', symbol: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 0, price_change_percentage_24h: 0 },
        { name: 'ICX', symbol: 'ICX', image: 'https://assets.coingecko.com/coins/images/1060/large/icon-icx-logo.png', current_price: 0, price_change_percentage_24h: 0 },
        { name: 'ETH', symbol: 'ETH', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', current_price: 0, price_change_percentage_24h: 0 }
    ]
    try {
        coincapAssets = await FetchData.getAssets()
    } catch (error) {
        console.log('error', error)
    }

    // TODO: refactor
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

    // get prices
    let prices = {
        ['ETH']: 0,
        ['ICX']: 0,
        ['BNB']: 0
        ['BTC']
    }
    for (let i = 0; i < coincapAssets.length; i++) {
        prices[coincapAssets[i].symbol.toUpperCase()] = Number(coincapAssets[i].current_price)
    }

    // calculate total fee
    let total = 0
    let networks = ['icon', 'havah', 'bsc', 'eth2']
    for (let i = 0; i < networks.length; i++) {
        total += Number(statisticData.fees[networks[i]])
    }
    let formatedTotal = converter.formatCurrency(converter.fromWei(total))

    return (
        <div>
            <div className="py-4 xl:py-10 xl:flex xl:items-end xl:justify-between w-full">
                <div className="xl:basis-8/12">
                    <div className="text-2xl xl:text-3xl text-white font-medium tracking-tighter pb-2 shadow-xl">Explore Messages</div>
                    <SearchBar showFull={true} />
                </div>
                <div className="mt-4 xl:mt-0 xl:basis-4/12 flex flex-row-reverse items-end">
                    <div className=" px-4 text-white rounded-md text-right  ">
                        <div className="text-sm opacity-75">Total Messages</div>
                        <div className="text-3xl font-medium fade-in">{statisticData.messages}</div>
                    </div>
                    {/* <div className="px-4 text-white rounded-md text-right">
                        <div className="text-sm opacity-75">Total Transfered</div>
                        <div className="text-3xl font-medium fade-in">${formatedTotal}</div>
                    </div> */}
                </div>
            </div>

            <Suspense fallback={<Loading />}>
                <MessageList data={rs.data} meta={rs.meta}></MessageList>
            </Suspense>
        </div>
    )
}

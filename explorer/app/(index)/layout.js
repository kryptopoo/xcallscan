import '../globals.css'
import Favicon from '../favicon.ico';
import Header from '@/components/header'
import Footer from '@/components/footer'
import fetchData from '@/lib/fetch-data'
import Script from 'next/script'

export const metadata = {
    title: 'xCall Scan - xCall Service Explorer',
    description: 'xCallScan is an explorer that allows users to look up relay messages and transactions being sent through xCall Service.',
    icons: [{ rel: 'icon', url: Favicon.src }],
}

export default async function RootLayout({ children }) {
    let assets = [
        { name: 'BNB', symbol: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', current_price: 0, price_change_percentage_24h: 0 },
        { name: 'ICX', symbol: 'ICX', image: 'https://assets.coingecko.com/coins/images/1060/large/icon-icx-logo.png', current_price: 0, price_change_percentage_24h: 0 }
    ]
    try {
        assets = await fetchData.getAssets()
        // // random assets
        // assets = assets.sort(() => Math.random() - Math.random()).slice(0, 8)
    } catch (error) {
        console.log('error', error)
    }

    return (
        <html lang="en">
            <head>
                <Script>{`setInterval(()=>{ window.location = window.location.href;}, 30000);`}</Script>
            </head>
            <body className="font-mono min-h-screen">
                <Header showSearchBar={false} assets={assets} />
                <div className="-z-20 h-72 w-full absolute hero"></div>
                <main className="px-4 mb-2 xl:px-24 xl:mb-12 2xl:px-48">
                    <div className="min-h-[34rem] 2xl:min-h-[46rem]">{children}</div>
                </main>
                <Footer />
            </body>
        </html>
    )
}

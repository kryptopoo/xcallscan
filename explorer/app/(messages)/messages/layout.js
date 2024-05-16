
import '../../globals.css'
import Favicon from '../../favicon.ico';
import Header from '@/components/header'
import Footer from '@/components/footer'

export const metadata = {
    title: `xCallScan - ICON's General Message Passing Explorer`,
    description: `xCallScan is an explorer that allows users to look up relay messages and transactions being sent through ICON's General Message Passing (xCall).`,
    icons: [{ rel: 'icon', url: Favicon.src }],
}

export default function MessageLayout({ children }) {
    return (
        <html lang="en">
            <body className="font-mono min-h-screen">
                <Header showSearchBar={true} />
                <div className="-z-20 h-72 w-full absolute hero"></div>
                <main className="px-4 mb-2 xl:px-24 xl:mb-12 2xl:px-48">
                    <div className="min-h-[34rem] 2xl:min-h-[46rem]">{children}</div>
                </main>
                <Footer />
            </body>
        </html>
    )
}

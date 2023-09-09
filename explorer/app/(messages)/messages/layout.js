
import '../../globals.css'
import Header from '@/components/header'
import Footer from '@/components/footer'

export const metadata = {
    title: 'xCallScan',
    description: 'xCallScan app'
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

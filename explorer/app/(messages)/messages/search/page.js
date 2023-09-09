import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Loading from './loading'
import FetchData from '@/lib/fetch-data'
import MessageDetail from '@/components/message-detail'
import PageTitle from '@/components/page-title'

export default async function SearchPage({ params, searchParams }) {
    const { value } = searchParams
    const rs = await FetchData.search(value)

    const msgData = rs.data[0]
    if (!msgData || msgData.length == 0) {
        notFound()
    }

    return (
        <div>
            <PageTitle title={`Search`} />
            <Suspense fallback={<Loading />}>
                <MessageDetail msgData={msgData} meta={rs.meta}></MessageDetail>
            </Suspense>
        </div>
    )
}

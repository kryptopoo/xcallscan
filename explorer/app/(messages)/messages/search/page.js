import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Loading from './loading'
import FetchData from '@/lib/fetch-data'
import MessageDetail from '@/components/message-detail'
import MessageList from '@/components/message-list'
import PageTitle from '@/components/page-title'

export default async function SearchPage({ params, searchParams }) {
    const { value } = searchParams
    const rs = await FetchData.search(value)
    const msgData = rs.data[0]

    if (!rs || rs.data.length == 0) {
        notFound()
    }

    const showDetailPage = rs.data.length == 1

    return (
        <div>
            <PageTitle title={`Search`} />
            <Suspense fallback={<Loading />}>
                {showDetailPage ? <MessageDetail msgData={msgData} meta={rs.meta}></MessageDetail> : <MessageList data={rs.data} meta={rs.meta}></MessageList>}
            </Suspense>
        </div>
    )
}

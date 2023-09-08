import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Loading from './loading'
import FetchData from '@/lib/fetch-data'
import MessageDetail from '@/components/message-detail'
import PageTitle from '@/components/page-title'

export default async function MessageDetailPage({ params, searchParams }) {
    const { id } = params
    const rs = await FetchData.getMessageById(id)

    const msgData = rs.data[0]
    if (!msgData) {
        notFound()
    }

    return (
        <div>
            <PageTitle title={'Message Detail'} />

            <Suspense fallback={<Loading />}>
                <MessageDetail msgData={msgData} meta={rs.meta}></MessageDetail>
            </Suspense>
        </div>
    )
}

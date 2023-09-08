import { Suspense } from 'react'
import MessageList from '@/components/message-list'
import FetchData from '@/lib/fetch-data'
import Loading from './loading'
import PageTitle from '@/components/page-title'

export default async function MessagesPage({ params, searchParams }) {
    const pageSize = searchParams.ps ?? 10
    const pageNumber = searchParams.p ?? 1
    const rs = await FetchData.getMessages(pageSize, pageNumber)

    return (
        <div>
            <PageTitle title={'Messages'} />

            <Suspense fallback={<Loading />}>
                <MessageList data={rs.data} meta={rs.meta} showPagination="true"></MessageList>
            </Suspense>
        </div>
    )
}

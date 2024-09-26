'use client'

import { Suspense, useState } from 'react'
import MessageList from '@/components/message-list'
import MessageFilter from '@/components/message-filter'
import FetchData from '@/lib/fetch-data'
import SearchBar from '@/components/searchbar'
import converter from '@/lib/converter'
import useSWR from 'swr'
import SkeletonTable from '@/components/skeleton-table'
import MessagePagination from '@/components/message-pagination'

export default function Home() {
    // filter
    const [srcNetwork, setSrcNetwork] = useState('')
    const [destNetwork, setDestNetwork] = useState('')
    const [actionType, setActionType] = useState('')

    // pagination
    const [pageSize, setPageSize] = useState(10)
    const [pageNumber, setPageNumber] = useState(1)

    let messagesRes = useSWR(
        ['messages', pageSize, pageNumber, srcNetwork, destNetwork, actionType],
        () => FetchData.getMessages(pageSize, pageNumber, srcNetwork, destNetwork, actionType),
        { refreshInterval: 2000 }
    )
    const totalMsgRes = useSWR('statistics/total_messages', () => FetchData.getTotalMessages(), {
        refreshInterval: 2000
    })

    return (
        <div>
            <div className="py-2 xl:py-6 xl:flex xl:items-end xl:justify-between w-full">
                <div className="xl:basis-8/12">
                    <div className="text-2xl xl:text-3xl text-white font-medium tracking-tighter pb-2 shadow-xl">Explore Messages</div>
                    <SearchBar showFull={true} />
                </div>
                <div className="mt-4 xl:mt-0 xl:basis-4/12 flex flex-row-reverse items-end">
                    <div className=" px-4 text-white rounded-md text-right hidden md:block">
                        <div className="text-sm opacity-75">Total Messages</div>
                        <div className="text-3xl font-medium fade-in">{totalMsgRes.isLoading ? 0 : totalMsgRes.data?.data.total?.toLocaleString('en-US')}</div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <MessageFilter
                srcNetwork={srcNetwork}
                destNetwork={destNetwork}
                actionType={actionType}
                srcNetworkChanged={(value) => {
                    setSrcNetwork(value)
                }}
                destNetworkChanged={(value) => {
                    setDestNetwork(value)
                }}
                actionTypeChanged={(value) => {
                    setActionType(value)
                }}
                resetClicked={() => {
                    setSrcNetwork('')
                    setDestNetwork('')
                    setActionType('')
                }}
            />

            {/* Message List */}
            {messagesRes.isLoading ? <SkeletonTable /> : <MessageList data={messagesRes.data?.data} meta={messagesRes.data?.meta}></MessageList>}

            {/* Paging */}
            {!messagesRes.isLoading && (
                <MessagePagination
                    totalPages={messagesRes.data?.meta.pagination.total}
                    pageSize={pageSize}
                    pageNumber={pageNumber}
                    pageSizeChanged={(value) => {
                        setPageSize(value)
                    }}
                    pageNumberChanged={(value) => {
                        setPageNumber(value)
                    }}
                />
            )}
        </div>
    )
}

'use client'

import { Suspense } from 'react'
import MessageList from '@/components/message-list'
import FetchData from '@/lib/fetch-data'
import Loading from './loading'
import SearchBar from '@/components/searchbar'
import converter from '@/lib/converter'
import useSWR from 'swr'
import SkeletonTable from '@/components/skeleton-table'

export default function Home() {
    const pageSize = 10
    const pageNumber = 1
    const messagesRes = useSWR('messages', () => FetchData.getMessages(pageSize, pageNumber), {
        refreshInterval: 5000
    })
    const totalMsgRes = useSWR('statistics/total_messages', () => FetchData.getTotalMessages(), {
        refreshInterval: 5000
    })

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
                        <div className="text-3xl font-medium fade-in">{totalMsgRes.isLoading ? 0 : totalMsgRes.data?.data.total?.toLocaleString('en-US')}</div>
                    </div>
                </div>
            </div>

            {messagesRes.isLoading ? <SkeletonTable /> : <MessageList data={messagesRes.data?.data} meta={messagesRes.data?.meta}></MessageList>}
        </div>
    )
}

import timeAgo from '@/lib/time-ago'
import Link from 'next/link'
import Pagination from './pagination'
import Render from '@/lib/render'

export default function MessageList({ data, meta, showPagination }) {
    return (
        <div className="py-2">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <div className="table w-full border-collapse min-h-32 bg-white">
                    <div className="table-header-group">
                        <div className="table-row uppercase text-left bg-gray-50">
                            <div className="table-cell px-1 py-1 xl:px-3 xl:py-3">Status</div>
                            <div className="table-cell px-1 py-1 xl:px-3 xl:py-3">Serial No</div>
                            <div className="table-cell px-1 py-1 xl:px-3 xl:py-3">Source Tx Hash</div>
                            <div className="table-cell px-1 py-1 xl:px-3 xl:py-3">Destination Tx Hash</div>
                            <div className="table-cell px-1 py-1 xl:px-3 xl:py-3">Action</div>
                            <div className="table-cell px-1 py-1 xl:px-3 xl:py-3 text-right">Created</div>
                        </div>
                    </div>

                    <div className="table-row-group">
                        {data?.map((item) => (
                            <Link key={item.id} className="table-row bg-white hover:bg-gray-50 border-b h-14" href={`/messages/${item.id}`}>
                                <div className="table-cell align-middle px-1 py-1 xl:px-3 xl:py-3">{Render.renderMessageStatus(item.status)}</div>
                                <div className="table-cell align-middle px-1 py-1 xl:px-3 xl:py-3">{item.sn}</div>
                                <div className="table-cell align-middle px-1 py-1 xl:px-3 xl:py-3">
                                    {Render.renderHashLink(meta.urls.tx[item.src_network], item.src_network, item.src_tx_hash)}
                                </div>
                                <div className="table-cell align-middle px-1 py-1 xl:px-3 xl:py-3">{Render.renderDestHashLink(item, meta)}</div>
                                <div className="table-cell align-middle px-1 py-1 xl:px-3 xl:py-3">{item.action_type}</div>
                                <div className="table-cell align-middle px-1 py-1 xl:px-3 xl:py-3 text-right tracking-tighter">{timeAgo(item.src_block_timestamp * 1000)} ago</div>
                            </Link>
                        ))}
                    </div>
                    {data?.length == 0 && (
                        <div className="table-row-group w-full h-32">
                            <div className='absolute left-0 w-full text-center mt-12'>No messages found. Please try again!</div>
                        </div>
                    )}
                </div>
                {/* {showPagination ? (
                    <Pagination totalPages={meta.pagination.total} pageNumber={meta.pagination.number} pageSize={meta.pagination.size} />
                ) : (
                    <div className="py-4 px-4 text-center hover:underline underline-offset-2">
                        {data?.length == 0 ? <div>NO MESSAGES</div> : <Link href={`/messages`}>VIEW ALL MESSAGES</Link>}
                    </div>
                )} */}

                {showPagination && <Pagination totalPages={meta.pagination.total} pageNumber={meta.pagination.number} pageSize={meta.pagination.size} />}
            </div>
        </div>
    )
}

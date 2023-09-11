import timeAgo from '@/lib/time-ago'
import Link from 'next/link'
import Pagination from './pagination'
import Render from '@/lib/render'

export default async function MessageList({ data, meta, showPagination }) {
    return (
        <div className="py-2">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <div className="table w-full border-collapse">
                    <div className="table-header-group">
                        <div className="table-row uppercase text-left bg-gray-50">
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3">Status</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3">Serial No</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3">Source Tx Hash</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3">Destination Tx Hash</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3 text-right">Created</div>
                        </div>
                    </div>

                    <div className="table-row-group">
                        {data.map((item) => (
                            <Link key={item.id} className="table-row bg-white hover:bg-gray-50 border-b h-14" href={`/messages/${item.id}`}>
                                <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">{Render.renderMessageStatus(item)}</div>
                                <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">{item.sn}</div>
                                <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">
                                    {Render.renderHashLink(meta.urls.tx[item.src_network], item.src_network, item.src_tx_hash)}
                                </div>
                                <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">
                                    {item.dest_tx_hash
                                        ? Render.renderHashLink(meta.urls.tx[item.dest_network], item.dest_network, item.dest_tx_hash)
                                        : item.response_tx_hash
                                        ? Render.renderHashLink(meta.urls.tx[item.src_network], item.dest_network, item.response_tx_hash)
                                        : Render.renderHashLink(meta.urls.tx[item.src_network], item.dest_network, item.rollback_tx_hash)}
                                </div>
                                <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3 text-right">{timeAgo(item.src_block_timestamp * 1000)} ago</div>
                            </Link>
                        ))}
                    </div>
                </div>
                {showPagination ? (
                    <Pagination totalPages={meta.pagination.total} pageNumber={meta.pagination.number} pageSize={meta.pagination.size} />
                ) : (
                    <div className="py-4 px-4 text-center hover:underline underline-offset-2">
                        <Link href={`/messages`}>VIEW ALL MESSAGES</Link>
                    </div>
                )}
            </div>
        </div>
    )
}

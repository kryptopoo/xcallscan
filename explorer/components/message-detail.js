import timeAgo from '@/lib/time-ago'
import Render from '@/lib/render'
import Link from 'next/link'
import converter from '@/lib/converter'
import Script from 'next/script'

export default async function MessageDetail({ msgData, meta }) {
    return (
        <div className="py-2 flex flex-col">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <div className="table border-collapse w-full text-base text-left text-gray-900">
                    <div className="xl:table-header-group hidden">
                        <div className="table-row font-medium text-xl uppercase text-left bg-gray-50">
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3">Message Detail</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3"></div>
                        </div>
                    </div>
                    <div className="table-row-group">
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Status:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{Render.renderMessageStatus(msgData.status, msgData.rollbacked)}</div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Serial No:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4 ">{msgData.sn}</div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Source transaction hash:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4 ">{Render.renderHashLink(meta.urls, msgData.src_network, msgData.src_tx_hash, true)}</div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Source block number:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{msgData.src_block_number}</div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Source block timestamp:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{timeAgo(msgData.src_block_timestamp * 1000)} ago</div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Destination transaction hash:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">
                                {msgData.rollbacked
                                    ? Render.renderHashLink(meta.urls.tx[msgData.src_network], msgData.dest_network, msgData.dest_tx_hash, true)
                                    : Render.renderHashLink(meta.urls.tx[msgData.dest_network], msgData.dest_network, msgData.dest_tx_hash, true)}
                            </div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Destination block number:</div>
                            {msgData.dest_block_number ? (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{msgData.dest_block_number} ago</div>
                            ) : (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">-</div>
                            )}
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Destination block timestamp:</div>
                            {msgData.dest_block_timestamp ? (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{timeAgo(msgData.dest_block_timestamp * 1000)} ago</div>
                            ) : (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">-</div>
                            )}
                        </div>

                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Protocol fee:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{converter.fromWei(msgData.value).toFixed(2)}</div>
                        </div>

                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Transaction fee:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{converter.fromWei(msgData.fee).toFixed(2)}</div>
                        </div>

                        {/* <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Rollbacked:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{msgData.rollbacked ? 'Yes' : 'No'}</div>
                        </div> */}

                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Created:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{timeAgo(msgData.src_block_timestamp * 1000)} ago</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-4 flex flex-row-reverse">
                <Link className="hover:underline underline-offset-2 text-sm pr-2" href={`/messages`}>
                    Back to Messages
                </Link>
            </div>

            <Script>{`
            for(var i=0;i<document.getElementsByClassName("copy-hash").length;i++){
                document.getElementsByClassName("copy-hash")[i].onclick = function(){ navigator.clipboard.writeText(this.previousSibling.innerText); }
            }
            `}</Script>
        </div>
    )
}

import timeAgo from '@/lib/time-ago'
import Render from '@/lib/render'
import Link from 'next/link'
import converter from '@/lib/converter'
import helper from '@/lib/helper'
import Script from 'next/script'

export default async function MessageDetail({ msgData, meta }) {
    const round = (str) => {
        return Number(str).toFixed(8)
    }

    const msgActionDetail = JSON.parse(msgData.action_detail)
    let msgAction = ''
    switch (msgData.action_type) {
        case 'Transfer':
            const transferAssetSymbol = msgActionDetail.dest_asset.symbol || msgActionDetail.src_asset.symbol
            const transferAmount = Number(msgActionDetail.dest_amount) > 0 ? msgActionDetail.dest_amount : Number(msgActionDetail.src_amount) > 0 ? msgActionDetail.src_amount : '0'
            msgAction = `${msgData.action_type} ${round(transferAmount)} ${transferAssetSymbol}`
            break
        case 'Swap':
            msgAction = `${msgData.action_type} ${round(msgActionDetail?.src_amount)} ${msgActionDetail?.src_asset?.symbol} -> ${round(msgActionDetail?.dest_amount)} ${
                msgActionDetail?.dest_asset?.symbol
            }`
            break
        case 'Loan':
            msgAction = `${msgActionDetail.type} ${msgActionDetail?.dest_amount} ${msgActionDetail?.dest_asset?.symbol}`
            break
        default:
            break
    }

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
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{Render.renderMessageStatus(msgData)}</div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Serial No:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4 ">{msgData.sn}</div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Source transaction hash:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4 ">
                                {Render.renderHashLink(meta.urls.tx[msgData.src_network], msgData.src_network, msgData.src_tx_hash, true)}
                            </div>
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
                                {Render.renderHashLink(meta.urls.tx[msgData.dest_network], msgData.dest_network, msgData.dest_tx_hash, true)}
                            </div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Destination block number:</div>
                            {msgData.dest_block_number ? (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{msgData.dest_block_number}</div>
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
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Response transaction hash:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">
                                {Render.renderHashLink(meta.urls.tx[msgData.src_network], msgData.src_network, msgData.response_tx_hash, true)}
                            </div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Response block number:</div>
                            {msgData.response_block_number ? (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{msgData.response_block_number}</div>
                            ) : (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">-</div>
                            )}
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Response block timestamp:</div>
                            {msgData.response_block_timestamp ? (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{timeAgo(msgData.response_block_timestamp * 1000)} ago</div>
                            ) : (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">-</div>
                            )}
                        </div>

                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Rollback transaction hash:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">
                                {Render.renderHashLink(meta.urls.tx[msgData.src_network], msgData.src_network, msgData.rollback_tx_hash, true)}
                            </div>
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Rollback block number:</div>
                            {msgData.rollback_block_number ? (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{msgData.rollback_block_number}</div>
                            ) : (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">-</div>
                            )}
                        </div>
                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Rollback block timestamp:</div>
                            {msgData.rollback_block_timestamp ? (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{timeAgo(msgData.rollback_block_timestamp * 1000)} ago</div>
                            ) : (
                                <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">-</div>
                            )}
                        </div>

                        {/* <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Protocol/Message fee:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{converter.fromWei(msgData.value).toFixed(4)} {helper.getNativeAsset(msgData.src_network)}</div>
                        </div> */}

                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Transaction fee:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">
                                {converter.fromWei(msgData.fee).toFixed(8)} {helper.getNativeAsset(msgData.src_network)}
                            </div>
                        </div>

                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Action:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">
                                {msgAction} 
                                {/* <br /><br />{JSON.stringify(msgActionDetail)} */}
                            </div>
                        </div>

                        <div className="table-row bg-white border-b">
                            <div className="table-cell xl:w-96 px-3 py-2 xl:px-6 xl:py-4 font-medium whitespace-normal xl:whitespace-nowrap">Created:</div>
                            <div className="table-cell px-3 py-2 xl:px-6 xl:py-4">{timeAgo(msgData.src_block_timestamp * 1000)} ago</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-4 flex flex-row-reverse">
                <Link className="hover:underline underline-offset-2 text-sm pr-2" href={`/`}>
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

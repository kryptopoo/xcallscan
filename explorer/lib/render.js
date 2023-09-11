import Link from 'next/link'
import Image from 'next/image'
import { ClipboardDocumentIcon } from '@heroicons/react/24/solid'
import TxHashLink from '@/components/tx-hash-link'

function renderMessageStatus(msgData) {
    if (msgData.rollback_tx_hash) return <span className="uppercase text-xs rounded-2xl p-1 inline-block w-24 bg-red-300 text-center">Rollbacked</span>
    if (msgData.status == 'pending') return <span className="uppercase text-xs rounded-2xl p-1 inline-block w-24 bg-gray-300 text-center">{msgData.status}</span>
    if (msgData.status == 'executed') return <span className="uppercase text-xs rounded-2xl p-1 inline-block w-24 bg-green-300 text-center">{msgData.status}</span>
    if (msgData.status == 'delivered') return <span className="uppercase text-xs rounded-2xl p-1 inline-block w-24 bg-blue-300 text-center">{msgData.status}</span>
}

function renderHashLink(scanUrl, network, hash, isFull = false) {
    if (!hash) return <div>-</div>

    let networkImg
    let linkClass = isFull ? 'hover:underline inline-block w-[37rem]' : 'hover:underline inline-block text-ellipsis overflow-hidden w-64'
    let link = <div>-</div>
    let copyButton = <ClipboardDocumentIcon width={20} height={20} className={'opacity-75 text-gray-900 cursor-pointer'} />

    networkImg = <Image alt="bsc" src={`/images/network-${network}.png`} width={24} height={24} />
    link = !isFull ? (
        <div className={linkClass}>{hash}</div>
    ) : (
        <div className="flex">
            <Link className={linkClass} href={scanUrl + hash} target="_blank">
                {hash}
            </Link>
            {copyButton}
        </div>
    )

    return (
        <div className="flex items-center gap-2">
            {networkImg}
            {link}
        </div>
    )
}

export default {
    renderMessageStatus,
    renderHashLink
}

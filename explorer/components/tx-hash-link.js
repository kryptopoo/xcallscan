
'use client'
export default function TxHashLink({ href }) {
    let linkClass = 'hover:underline inline-block w-[37rem]' 
    let copyButton = (
        <button onClick={(e) => e.clipboardData.setData('text/plain', 'Hello, world!')}>
            <ClipboardDocumentIcon width={20} height={20} className={'opacity-75 text-gray-900 cursor-pointer'} />
        </button>
    )
    return (
        <div className="flex">
            <Link className={linkClass} href={href} target="_blank">
                {hash}
            </Link>
            {copyButton}
        </div>
    )
}

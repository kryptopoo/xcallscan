'use client'

export default function PageTitle({ title }) {
    return (
        <div className="pt-5 pb-2 xl:pt-10 xl:pb-5 flex items-end justify-between w-full gap-4">
            <div className="text-2xl xl:text-3xl text-white font-medium tracking-tighter pb-2">{title}</div>
        </div>
    )
}

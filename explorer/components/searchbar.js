'use client'
import { MagnifyingGlassIcon } from '@heroicons/react/24/solid'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function SearchBar({ showFull }) {
    const [searchValue, setSearchValue] = useState('')
    const router = useRouter()
    const keydownEnter = (e) => {
        if (e.key === 'Enter') {
            router.push(`/messages/search?value=${e.target.value}`)
        }
    }

    const inputClass = showFull
        ? `block w-full p-3 pl-10 xl:pl-12 text-sm xl:text-lg border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600`
        : `block w-full p-2 pl-10 text-sm xl:text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-cyan-600 focus:ring-[0.5px] focus:ring-cyan-600`
    const wrappedInputClass = showFull ? `relative overflow-x-auto shadow-md sm:rounded-lg w-full` : ` w-[15rem] hidden xl:inline-block relative xl:w-[28rem]`
    const iconClass = showFull ? 'w-6 h-6 text-gray-500 dark:text-gray-400' : 'w-5 h-5 text-gray-500 dark:text-gray-400'

    return (
        <div>
            <div className={wrappedInputClass}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <MagnifyingGlassIcon className={iconClass} />
                </div>
                <input type="search" id="value" name="value" className={inputClass} placeholder="Search by transaction hash / serial no" required onKeyDown={keydownEnter} />
            </div>
        </div>
    )
}

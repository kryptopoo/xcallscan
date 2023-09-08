'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const Pagination = ({ totalPages, pageSize, pageNumber }) => {
    const options = [
        {
            value: '10'
        },
        {
            value: '20'
        },
        {
            value: '50'
        },
        {
            value: '100'
        }
    ]

    const [selectedOption, setSelectedOption] = useState(pageSize)
    const router = useRouter()

    const pageSizeChanged = (value, selectOptionSetter) => {
        selectOptionSetter(value)
        router.push(`/messages/?ps=${value}&p=1`)
    }

    return (
        <div className="flex text-sm items-center justify-between py-4 px-4">
            <div className="flex items-center gap-2">
                <span className='hidden xl:inline-block'>Show</span>
                <select
                    id="ps"
                    name="ps"
                    className="bg-transparent cursor-pointer border border-gray-300 rounded-md px-2 py-1"
                    value={selectedOption}
                    onChange={(e) => pageSizeChanged(e.target.value, setSelectedOption)}
                >
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.value}
                        </option>
                    ))}
                </select>
                <span className='hidden xl:inline-block'>records</span>
            </div>
            <div className="flex items-center justify-between">
                <Link className="ml-1 border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-200" href={`/messages?ps=${pageSize}&p=1`}>
                    First
                </Link>
                <Link className="ml-1 border border-gray-300 rounded-md  px-2 py-1 hover:bg-gray-200" href={`/messages?ps=${pageSize}&p=${pageNumber - 1}`}>
                    &lt;
                </Link>
                <div className="ml-1 border border-gray-300 rounded-md px-2 py-1">
                    <span  className='hidden xl:inline-block'>Page</span> {pageNumber} <span className='xl:hidden inline-block'>/</span><span className='hidden xl:inline-block'>of</span> {totalPages}
                </div>
                <Link className="ml-1 border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-200" href={`/messages?ps=${pageSize}&p=${pageNumber + 1}`}>
                    &gt;
                </Link>
                <Link className="ml-1 border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-200" href={`/messages?ps=${pageSize}&p=${totalPages}`}>
                    Last
                </Link>
            </div>
        </div>
    )
}
export default Pagination

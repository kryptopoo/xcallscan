import SkeletonTable from '@/components/skeleton-table'
import SearchBar from '@/components/searchbar'

export default function Loading() {
    return (
        <div>
            <div className="py-10 flex items-end justify-between w-full">
                <div className="basis-8/12">
                    <div className="text-3xl text-white font-medium tracking-tighter pb-2">Explore Messages</div>
                    <SearchBar showFull={true} />
                </div>
                <div className="basis-4/12 flex flex-row-reverse items-end ">
                    <div className="px-4 text-white rounded-md text-right  ">
                        <div className="text-sm opacity-75">Total Messages</div>
                        <div className="text-3xl font-medium fade-in">0</div>
                    </div>
                    <div className="px-4 text-white rounded-md text-right">
                        <div className="text-sm opacity-75">Total Transfered</div>
                        <div className="text-3xl font-medium fade-in">0</div>
                    </div>
                </div>
            </div>

            <SkeletonTable />
        </div>
    )
}

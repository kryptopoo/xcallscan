export default function SkeletonTable({ count = 10 }) {
    // Generating {count = 30} skeletons to match the size of the list.
    return (
        <div className="py-2">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
                <div className="table w-full border-collapse">
                    <div className="table-header-group">
                        <div className="table-row uppercase bg-gray-50">
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3">Status</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3"> Serial No</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3">Source Tx Hash</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3"> Destination Tx Hash</div>
                            <div className="table-cell px-2 py-1 xl:px-6 xl:py-3 text-right">Created</div>
                        </div>
                    </div>
                    <div className="table-row-group">
                        {Array.from({ length: count }).map((_, index) => (
                            <Skeleton key={index} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

function SkeletonTableCell() {
    return (
        <div className="max-w-sm animate-pulse">
            <div className="h-5 bg-gray-200 rounded-full w-full"></div>
        </div>
    )
}

function Skeleton() {
    return (
        <div className="table-row bg-white hover:bg-gray-50 border-b h-14">
            <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">
                <SkeletonTableCell />
            </div>
            <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">
                <SkeletonTableCell />
            </div>
            <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">
                <SkeletonTableCell />
            </div>
            <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3">
                <SkeletonTableCell />
            </div>
            <div className="table-cell align-middle px-2 py-1 xl:px-6 xl:py-3 text-right">
                <SkeletonTableCell />
            </div>
        </div>
    )
}

'use client'

const MessagePagination = (props) => {
    const options = [10, 20, 50, 100, 200]
    return (
        <div className="flex text-sm items-center justify-between ">
            <div className="flex items-center">
                {/* <span className="hidden xl:inline-block">Items:</span> */}
                <select
                    id="ps"
                    name="ps"
                    className="text-sm bg-transparent cursor-pointer outline-none border-none border-transparent focus:border-transparent focus:ring-0"
                    value={props.pageSize}
                    onChange={(e) => props.pageSizeChanged(e.target.value)}
                    style={{border: 0, outline: 0}}
                >
                    {options.map((option) => (
                        <option key={option} value={option}>
                            {option}
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex items-center justify-between">
                <button className="mx-1 border-none hover:underline" onClick={() => props.pageNumberChanged(1)}>
                    First
                </button>
                <button className="mx-1 border-none hover:underline" onClick={() => props.pageNumberChanged(props.pageNumber - 1)}>
                    Prev
                </button>
                <div className="mx-1 border-none tracking-tighter">
                    <span className="hidden xl:inline-block"></span>{props.pageNumber} <span className="xl:hidden inline-block">/</span>
                    <span className="hidden xl:inline-block">of</span> {props.totalPages}
                </div>
                <button className="mx-1 border-none hover:underline" onClick={() => props.pageNumberChanged(props.pageNumber + 1)}>
                    Next
                </button>
                <button className="mx-1 border-none hover:underline" onClick={() => props.pageNumberChanged(props.totalPages)}>
                    Last
                </button>
            </div>
        </div>
    )
}

export default MessagePagination

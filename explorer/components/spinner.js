// https://loading.io/css/
export default function Spinner() {
    return (
        <div className="h-[12rem] w-full flex justify-end items-center flex-col text-white  opacity-50 gap-2">
            <div
                className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em]  motion-reduce:animate-[spin_1.5s_linear_infinite]"
                role="status"
            ></div>
            <span>Loading...</span>
        </div>
    )
}

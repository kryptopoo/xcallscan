const nowTimestamp = () => {
    return Math.floor(Date.now() / 1000)
}

const lastWeekTimestamp = () => {
    const now = nowTimestamp()
    return now - 7 * 24 * 60 * 60
}

const lastDaysTimestamp = (days: number) => {
    const now = nowTimestamp()
    return now - days * 24 * 60 * 60
}

const toDateString = (timestamp: number) => {
    const dateString = new Date(timestamp * 1000).toISOString()
    return dateString
}

const toTimestamp = (date: Date) => {
    const timestamp = Math.floor(date.getTime() / 1000)
    return timestamp
}

const localDateToTimestamp = (localDateStr: string) => {
    const localDate = new Date(localDateStr)
    const offset = new Date().getTimezoneOffset()
    if (offset != 0) {
        const utcDate = new Date()
        utcDate.setTime(localDate.getTime() - offset * 60 * 1000)
        return toTimestamp(utcDate)
    }

    return toTimestamp(localDate)
}

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const shortAddress = (address: string, betweenString: string = '...') => {
    const shortAddr = `${address.substring(0, 5)}${betweenString}${address.substring(address.length - 4)}`
    return shortAddr
}

export { nowTimestamp, lastWeekTimestamp, lastDaysTimestamp, toDateString, toTimestamp, localDateToTimestamp, sleep, shortAddress }
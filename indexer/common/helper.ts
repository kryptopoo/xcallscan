const nowTimestamp = () => {
    return Math.floor(Date.now() / 1000)
}

const lastWeekTimestamp = () => {
    const now = nowTimestamp()
    return now - 7 * 24 * 60 * 60
}

const toDateString = (timestamp: number) => {
    const dateString = new Date(timestamp * 1000).toISOString()
    return dateString
}

const toTimestamp = (date: Date) => {
    const timestamp = Math.floor(date.getTime() / 1000)
    return timestamp
}

const sleep = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export { nowTimestamp, lastWeekTimestamp, toDateString, toTimestamp, sleep }

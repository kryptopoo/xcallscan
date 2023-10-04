const nowTimestamp = () => {
    return Math.floor(Date.now() / 1000)
}

const lastWeekTimestamp = () => {
    const now = nowTimestamp()
    return now - 7 * 24 * 60 * 60
}

export { nowTimestamp, lastWeekTimestamp }

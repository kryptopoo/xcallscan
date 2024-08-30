export type EventLog = {
    txRaw?: any
    from?: string
    to?: string
    decodedFrom?: string
    decodedTo?: string

    blockNumber: number
    blockTimestamp: number
    txHash: string
    txFrom: string
    txTo: string
    // gasPrice?: string
    // gasUsed?: string

    // icon amount = evm value
    txValue?: string

    // tx fee
    txFee?: string

    eventName: string
    eventData?: any
}

export type EventLogData = {
    _from?: string
    _to?: string
    _sn?: number
    _nsn?: number
    _reqId?: number
    _code?: number
    _msg?: string
    _data?: string

    _decodedFrom?: string
    _decodedTo?: string
}
export type EventLog = {
    txRaw?: any
    from?: string
    to?: string
    decodedFrom?: string
    decodedTo?: string

    blockNumber: string
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

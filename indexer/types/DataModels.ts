export type EventModel = {
    event: string
    sn: number
    nsn?: number
    reqId?: number
    msg?: string
    code?: number
    data?: string
    from_raw?: string
    to_raw?: string
    from_decoded?: string
    to_decoded?: string

    block_number: number
    block_timestamp: number
    tx_hash: string
    tx_from?: string
    tx_to?: string
    tx_value?: string
    tx_fee?: string
}

export type MessageModel = {
    id?: number
    sn: number
    status?: string

    src_network?: string
    src_block_number?: number
    src_block_timestamp?: number
    src_tx_hash?: string
    src_app?: string
    src_error?: string

    dest_network?: string
    dest_block_number?: number
    dest_block_timestamp?: number
    dest_tx_hash?: string
    dest_app?: string
    dest_error?: string

    value?: string
    fee?: string

    synced: boolean
}

export type BaseMessageModel = {
    sn: number
    src_network: string
    dest_network: string
}

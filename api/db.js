const Pool = require('pg').Pool
const dotenv = require('dotenv')
dotenv.config()

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})

const useMainnet = process.env.USE_MAINNET == 'true'

const NETWORK = {
    ICON: 'icon',
    BSC: 'bsc',
    ETH2: 'eth2',
    HAVAH: 'havah',
    IBC_ICON: 'ibc_icon',
    IBC_ARCHWAY: 'ibc_archway',
    IBC_NEUTRON: 'ibc_neutron',
    IBC_INJECTIVE: 'ibc_injective',
    AVAX: 'avax',
    BASE: 'base',
    ARBITRUM: 'arbitrum',
    OPTIMISM: 'optimism'
}

const metaUrls = {
    tx: {
        [NETWORK.BSC]: useMainnet ? 'https://bscscan.com/tx/' : 'https://testnet.bscscan.com/tx/',
        [NETWORK.ICON]: useMainnet ? 'https://tracker.icon.community/transaction/' : 'https://tracker.lisbon.icon.community/transaction/',
        [NETWORK.ETH2]: useMainnet ? 'https://etherscan.io/tx/' : 'https://sepolia.etherscan.io/tx/',
        [NETWORK.HAVAH]: useMainnet ? 'https://scan.havah.io/txn/' : 'https://scan.vega.havah.io/txn/',
        [NETWORK.IBC_ICON]: useMainnet ? 'https://tracker.icon.community/transaction/' : 'https://tracker.lisbon.icon.community/transaction/',
        [NETWORK.IBC_ARCHWAY]: useMainnet ? 'https://mintscan.io/archway/txs/' : 'https://testnet.mintscan.io/archway-testnet/txs/',
        [NETWORK.IBC_NEUTRON]: useMainnet ? 'https://neutron.celat.one/neutron-1/txs/' : 'https://neutron.celat.one/pion-1/txs/',
        [NETWORK.IBC_INJECTIVE]: useMainnet
            ? 'https://explorer.injective.network/transaction/'
            : 'https://testnet.explorer.injective.network/transaction/',
        [NETWORK.AVAX]: useMainnet ? 'https://snowtrace.io/tx/' : 'https://testnet.snowtrace.io/tx/',
        [NETWORK.BASE]: useMainnet ? 'https://basescan.org/tx/' : 'https://sepolia.basescan.org/tx/',
        [NETWORK.ARBITRUM]: useMainnet ? 'https://arbiscan.io/tx/' : 'https://sepolia.arbiscan.io/tx/',
        [NETWORK.OPTIMISM]: useMainnet ? 'https://optimistic.etherscan.io/tx/' : 'https://sepolia-optimism.etherscan.io/tx/'
    }
}

const buildWhereSql = (status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp) => {
    let values = []
    let conditions = []
    if (status) {
        conditions.push(`status = $${conditions.length + 1}`)
        values.push(status)
    }
    if (src_network) {
        conditions.push(`src_network = $${conditions.length + 1}`)
        values.push(src_network)
    }
    if (dest_network) {
        conditions.push(`dest_network = $${conditions.length + 1}`)
        values.push(dest_network)
    }
    if (src_address) {
        conditions.push(`LOWER(src_app) = LOWER($${conditions.length + 1})`)
        values.push(src_address)
    }
    if (dest_address) {
        conditions.push(`LOWER(dest_app) = LOWER($${conditions.length + 1})`)
        values.push(dest_address)
    }
    if (from_timestamp) {
        conditions.push(`src_block_timestamp >= $${conditions.length + 1}`)
        values.push(from_timestamp)
    }
    if (to_timestamp) {
        conditions.push(`(src_block_timestamp <= $${conditions.length + 1} OR 
                            dest_block_timestamp <= $${conditions.length + 1} OR 
                            response_block_timestamp <= $${conditions.length + 1} OR 
                            rollback_block_timestamp <= $${conditions.length + 1})`)
        values.push(to_timestamp)
    }

    return { conditions, values }
}

const getMessages = async (skip, limit, status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp) => {
    // build sql
    let { conditions, values } = buildWhereSql(status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp)

    let sqlTotal = `SELECT count(*) FROM messages`
    let sqlMessages = `SELECT id, sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app as src_address, src_error, 
                                dest_network, dest_block_number, dest_block_timestamp, dest_tx_hash, dest_app as dest_address, dest_error, 
                                response_block_number, response_block_timestamp, response_tx_hash, response_error, 
                                rollback_block_number, rollback_block_timestamp, rollback_tx_hash, rollback_error, created_at 
                        FROM messages ORDER BY src_block_timestamp DESC OFFSET $1 LIMIT $2`
    if (conditions.length > 0) {
        sqlTotal = `SELECT count(*) FROM messages WHERE ${conditions.join(' AND ')} `
        sqlMessages = `SELECT id, sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app as src_address, src_error, 
                            dest_network, dest_block_number, dest_block_timestamp, dest_tx_hash, dest_app as dest_address, dest_error, 
                            response_block_number, response_block_timestamp, response_tx_hash, response_error, 
                            rollback_block_number, rollback_block_timestamp, rollback_tx_hash, rollback_error, created_at 
                        FROM messages 
                        WHERE ${conditions.join(' AND ')} 
                        ORDER BY src_block_timestamp DESC 
                        OFFSET $${conditions.length + 1} LIMIT $${conditions.length + 2}`
    }

    // query data
    const totalRs = await pool.query(sqlTotal, values)
    const messagesRs = await pool.query(sqlMessages, values.concat([skip, limit]))

    return {
        data: messagesRs.rows,
        meta: {
            urls: metaUrls,
            pagination: {
                total: Math.ceil(Number(totalRs.rows[0].count) / Number(limit)),
                size: Number(limit),
                number: Math.floor(Number(skip) / Number(limit)) + 1
            }
        }
    }
}

const getMessageById = async (id) => {
    const sql = `SELECT id, sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app as src_address, src_error, 
                    dest_network, dest_block_number, dest_block_timestamp, dest_tx_hash, dest_app as dest_address, dest_error, 
                    response_block_number, response_block_timestamp, response_tx_hash, response_error, 
                    rollback_block_number, rollback_block_timestamp, rollback_tx_hash, rollback_error, 
                    value, fee, created_at, updated_at 
                FROM messages WHERE id = $1`
    const messagesRs = await pool.query(sql, [id])
    return {
        data: messagesRs.rows,
        meta: {
            urls: metaUrls
        }
    }
}

const searchMessages = async (value) => {
    // console.log(value.startsWith('0x'), Number.isInteger(Number(value)))
    // const sn =  Number.isInteger(Number(value)) ? parseInt(value) : 0
    // console.log(value, Number.isInteger(Number(value)), parseInt(value) ,  sn)
    const messagesRs = await pool.query(
        `SELECT id, sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app as src_address, src_error, 
            dest_network, dest_block_number, dest_block_timestamp, dest_tx_hash, dest_app as dest_address, dest_error, 
            response_block_number, response_block_timestamp, response_tx_hash, response_error, 
            rollback_block_number, rollback_block_timestamp, rollback_tx_hash, rollback_error, 
            value, fee, created_at, updated_at 
        FROM messages 
        WHERE src_tx_hash = $1 OR dest_tx_hash = $1 OR response_tx_hash = $1 OR rollback_tx_hash = $1 OR sn = $2 
        ORDER BY src_block_timestamp DESC`,
        [value, value.startsWith('0x') || !Number.isInteger(Number(value)) ? '0' : value]
    )
    return {
        data: messagesRs.rows,
        meta: {
            urls: metaUrls
        }
    }
}

// TODO: to be removed
const getStatistic = async () => {
    const totalRs = await pool.query('SELECT count(*) FROM messages')
    const messages = Number(totalRs.rows[0].count)

    const fees = {}
    const networks = Object.values(NETWORK)
    for (let index = 0; index < networks.length; index++) {
        const network = networks[index]
        const feeRs = await pool.query(`select sum(cast(value as decimal)) from messages where src_network = '${network}'`)
        fees[network] = feeRs.rows[0].sum ? feeRs.rows[0].sum.toString() : '0'
    }

    return {
        data: {
            messages,
            fees
        },
        meta: {
            urls: metaUrls
        }
    }
}

const getTotalMessages = async (status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp) => {
    // build sql
    let { conditions, values } = buildWhereSql(status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp)

    let sql = `SELECT count(*) FROM messages`
    if (conditions.length > 0) {
        sql = `SELECT count(*) FROM messages WHERE ${conditions.join(' AND ')}`
    }

    // query data
    const totalRs = await pool.query(sql, values)
    const total = Number(totalRs.rows[0].count)

    return {
        data: {
            total
        }
    }
}

module.exports = {
    getMessages,
    getMessageById,
    searchMessages,
    getStatistic,
    getTotalMessages
}

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
    IBC_INJECTIVE: 'ibc_injective'
}

const metaUrls = {
    tx: {
        [NETWORK.BSC]: useMainnet ? 'https://bscscan.com/tx/' : 'https://testnet.bscscan.com/tx/',
        [NETWORK.ICON]: useMainnet ? 'https://tracker.icon.community/transaction/' : 'https://tracker.berlin.icon.community/transaction/',
        [NETWORK.ETH2]: useMainnet ? 'https://etherscan.io/tx/' : 'https://sepolia.etherscan.io/tx/',
        [NETWORK.HAVAH]: useMainnet ? 'https://scan.havah.io/txn/' : 'https://scan.altair.havah.io/txn/',
        [NETWORK.IBC_ICON]: useMainnet ? 'https://tracker.icon.community/transaction/' : 'https://tracker.berlin.icon.community/transaction/',
        [NETWORK.IBC_ARCHWAY]: useMainnet ? 'https://mintscan.io/archway/txs/' : 'https://testnet.mintscan.io/archway-testnet/txs/',
        [NETWORK.IBC_NEUTRON]: useMainnet ? 'https://neutron.celat.one/neutron-1/txs/' : 'https://neutron.celat.one/pion-1/txs/',
        [NETWORK.IBC_INJECTIVE]: useMainnet
            ? 'https://explorer.injective.network/transaction/'
            : 'https://testnet.explorer.injective.network/transaction/'
    }
}

const getMessages = async (skip, limit) => {
    const totalRs = await pool.query('SELECT count(*) FROM messages')
    const messagesRs = await pool.query('SELECT * FROM messages ORDER BY src_block_timestamp DESC OFFSET $1 LIMIT $2', [skip, limit])
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
    const messagesRs = await pool.query('SELECT * FROM messages WHERE id = $1', [id])
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
        `SELECT * FROM messages 
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

module.exports = {
    getMessages,
    getMessageById,
    searchMessages,
    getStatistic
}

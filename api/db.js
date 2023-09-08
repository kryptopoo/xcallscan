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

const SCAN_TX_URL_ICON =
    process.env.USE_MAINNET == 'true' ? 'https://tracker.icon.community/transaction/' : 'https://tracker.berlin.icon.community/transaction/'
const SCAN_TX_URL_BSC = process.env.USE_MAINNET == 'true' ? 'https://bscscan.com/tx/' : 'https://testnet.bscscan.com/tx/'
const SCAN_TX_URL_ETH2 = process.env.USE_MAINNET == 'true' ? 'https://etherscan.io/tx/' : 'https://sepolia.etherscan.io/tx/'
const SCAN_TX_URL_HAVAH = process.env.USE_MAINNET == 'true' ? 'https://scan.havah.io/txn/' : 'https://scan.altair.havah.io/txn/'

const metaUrls = {
    tx: {
        bsc: SCAN_TX_URL_BSC,
        icon: SCAN_TX_URL_ICON,
        eth2: SCAN_TX_URL_ETH2,
        havah: SCAN_TX_URL_HAVAH
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
    const messagesRs = await pool.query('SELECT * FROM messages WHERE src_tx_hash = $1 OR dest_tx_hash = $1 OR sn = $2', [
        value,
        value.startsWith('0x') || !Number.isInteger(Number(value)) ? '0' : value
    ])
    return {
        data: messagesRs.rows,
        meta: {
            urls: metaUrls
        }
    }
}

const getStatistic = async () => {
    const totalRs = await pool.query('SELECT count(*) FROM messages')
    const feeIconRs = await pool.query(`select sum(cast(value as decimal)) from messages where src_network = 'icon'`)
    const feeHavahRs = await pool.query(`select sum(cast(value as decimal)) from messages where src_network = 'havah'`)
    const feeBscRs = await pool.query(`select sum(cast(value as decimal)) from messages where src_network = 'bsc'`)
    const feeEth2Rs = await pool.query(`select sum(cast(value as decimal)) from messages where src_network = 'eth2'`)

    return {
        data: {
            messages: Number(totalRs.rows[0].count),
            fees: {
                icon: feeIconRs.rows[0].sum.toString(),
                havah: feeHavahRs.rows[0].sum.toString(),
                bsc: feeBscRs.rows[0].sum.toString(),
                eth2: feeEth2Rs.rows[0].sum.toString()
            }
            // fees: [
            //     { network: 'icon', total: feeIconRs.rows[0].sum.toString() },
            //     { network: 'havah', total: feeHavahRs.rows[0].sum.toString() },
            //     { network: 'bsc', total: feeBscRs.rows[0].sum.toString() },
            //     { network: 'eth2', total: feeEth2Rs.rows[0].sum.toString() }
            // ]
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

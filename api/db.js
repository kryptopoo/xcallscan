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
    // const assetsRs = await pool.query(`select asset as name, sum(CAST(value as decimal)) as value
    //     from messages
    //     where asset is not null and asset != ''
    //     group by asset`)

    return {
        data: {
            messages: Number(totalRs.rows[0].count),
            // assets: assetsRs.rows
            assets: []
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

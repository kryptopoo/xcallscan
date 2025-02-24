const Pool = require('pg').Pool
const dotenv = require('dotenv')
dotenv.config()
const logger = require('./logger')
const { NETWORK, META_URLS } = require('./constants')

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: process.env.PGPORT
})
pool.on('error', function (error, client) {
    logger.error(error)
})

const buildWhereSql = (status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp, action_type) => {
    let values = []
    let conditions = []
    if (status) {
        conditions.push(`status = $${conditions.length + 1}`)
        values.push(status)
    }
    if (src_network) {
        conditions.push(`src_network = any(string_to_array($${conditions.length + 1},','))`)
        values.push(src_network)
    }
    if (dest_network) {
        conditions.push(`dest_network = any(string_to_array($${conditions.length + 1},','))`)
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
    if (action_type) {
        conditions.push(`LOWER(action_type) = LOWER($${conditions.length + 1})`)
        values.push(action_type)
    }

    return { conditions, values }
}

const getMessages = async (skip, limit, status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp, action_type) => {
    // build sql
    let { conditions, values } = buildWhereSql(
        status,
        src_network,
        dest_network,
        src_address,
        dest_address,
        from_timestamp,
        to_timestamp,
        action_type
    )

    let sqlTotal = `SELECT count(*) FROM messages`
    const selectFields = ` id, sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app as src_address, src_error, 
                                dest_network, dest_block_number, dest_block_timestamp, dest_tx_hash, dest_app as dest_address, dest_error, 
                                response_block_number, response_block_timestamp, response_tx_hash, response_error, 
                                rollback_block_number, rollback_block_timestamp, rollback_tx_hash, rollback_error, action_type, intents_order_id, created_at `
    let sqlMessages = `SELECT ${selectFields} 
                        FROM messages ORDER BY src_block_timestamp DESC OFFSET $1 LIMIT $2`
    if (conditions.length > 0) {
        sqlTotal = `SELECT count(*) FROM messages WHERE ${conditions.join(' AND ')} `
        sqlMessages = `SELECT ${selectFields}  
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
            urls: META_URLS,
            pagination: {
                total: Math.ceil(Number(totalRs.rows[0].count) / Number(limit)),
                size: Number(limit),
                number: Math.floor(Number(skip) / Number(limit)) + 1
            },
            time: Math.floor(Date.now() / 1000)
        }
    }
}

const getMessageById = async (id) => {
    const sql = `SELECT id, sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app as src_address, src_error, 
                    dest_network, dest_block_number, dest_block_timestamp, dest_tx_hash, dest_app as dest_address, dest_error, 
                    response_block_number, response_block_timestamp, response_tx_hash, response_error, 
                    rollback_block_number, rollback_block_timestamp, rollback_tx_hash, rollback_error, 
                    value, fee, action_type, action_detail, action_amount_usd, intents_order_id, intents_order_detail, created_at, updated_at 
                FROM messages WHERE id = $1`
    const messagesRs = await pool.query(sql, [id])
    return {
        data: messagesRs.rows,
        meta: {
            urls: META_URLS
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
            value, fee, intents_order_id, created_at, updated_at 
        FROM messages 
        WHERE src_tx_hash = $1 OR dest_tx_hash = $1 OR response_tx_hash = $1 OR rollback_tx_hash = $1 OR sn = $2 
        ORDER BY src_block_timestamp DESC`,
        [value, value.startsWith('0x') || !Number.isInteger(Number(value)) ? '0' : value]
    )
    return {
        data: messagesRs.rows,
        meta: {
            urls: META_URLS
        }
    }
}

const getTotalMessages = async (status, src_networks, dest_networks, src_address, dest_address, from_timestamp, to_timestamp) => {
    let data = {}

    // build sql
    let { conditions, values } = buildWhereSql(status, src_networks, dest_networks, src_address, dest_address, from_timestamp, to_timestamp)

    let sql = `SELECT count(*) as total FROM messages`
    if (conditions.length == 0) {
        // query data
        const totalRs = await pool.query(sql, values)
        const total = Number(totalRs.rows[0].total)
        data.total = total
    } else {
        if (!src_networks && !dest_networks) {
            sql = `SELECT count(*) as total   
                    FROM messages 
                    WHERE ${conditions.join(' AND ')}`
            const totalRs = await pool.query(sql, values)
            const total = Number(totalRs.rows[0].total)
            data.total = total
        } else {
            if (src_networks) {
                let { conditions, values } = buildWhereSql(status, src_networks, undefined, src_address, dest_address, from_timestamp, to_timestamp)
                sql = `SELECT src_network, count(*) as total   
                    FROM messages 
                    WHERE ${conditions.join(' AND ')} 
                    GROUP BY src_network
                    ORDER BY src_network`
                const srcNetworkTotalRs = await pool.query(sql, values)
                data.src_networks = {}
                srcNetworkTotalRs.rows.forEach((n) => {
                    data.src_networks[n.src_network] = { total: Number(n.total) }
                })
            }
            if (dest_networks) {
                let { conditions, values } = buildWhereSql(status, undefined, dest_networks, src_address, dest_address, from_timestamp, to_timestamp)
                sql = `SELECT dest_network, count(*) as total  
                    FROM messages 
                    WHERE ${conditions.join(' AND ')} 
                    GROUP BY dest_network
                    ORDER BY dest_network`
                const destNetworkTotalRs = await pool.query(sql, values)
                data.dest_networks = {}
                destNetworkTotalRs.rows.forEach((n) => {
                    data.dest_networks[n.dest_network] = { total: Number(n.total) }
                })
            }
        }
    }

    return {
        data
    }
}

module.exports = {
    getMessages,
    getMessageById,
    searchMessages,
    getTotalMessages
}

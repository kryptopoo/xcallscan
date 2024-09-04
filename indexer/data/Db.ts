import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import pg from 'pg'
const Pool = pg.Pool
import { MSG_STATUS } from '../common/constants'
import logger from '../modules/logger/logger'
import { BaseMessageModel, EventModel, MessageModel } from '../types/DataModels'
import { lastDaysTimestamp, lastWeekTimestamp, nowTimestamp } from '../common/helper'

class Db {
    pool = new Pool({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT || '5432')
    })

    constructor() {
        this.pool.on('error', function (error, client) {
            logger.error(`db: pool error ${error.message}`)
        })
    }

    async init() {
        const sqlFilePath = path.join(__dirname, 'db.sql')
        const sql = fs.readFileSync(sqlFilePath, 'utf8')
        const rs = await this.pool.query(sql)
        return rs
    }

    async migrate(filename: string) {
        const sqlFilePath = path.join(__dirname, 'migrations', filename)
        const sql = fs.readFileSync(sqlFilePath, 'utf8')
        const rs = await this.pool.query(sql)
        return rs
    }

    async getCounterByName(name: string) {
        let result = { name: name, value: '0' }
        const counterRs = await this.pool.query('SELECT * FROM counter where name = $1', [name])

        if (counterRs && counterRs.rows.length > 0) {
            result.name = counterRs.rows[0].name.trim().toString()
            result.value = counterRs.rows[0].value
        }

        return result
    }

    async updateCounter(name: string, value: string) {
        const counterRs = await this.pool.query('SELECT * FROM counter where name = $1', [name])
        if (counterRs && counterRs.rows.length > 0) {
            // value = value > counterRs.rows[0].value ? value : counterRs.rows[0].value
            return await this.pool.query(`UPDATE counter SET value = $2 where name = $1`, [name, value])
        } else {
            return await this.pool.query(
                `INSERT INTO counter (name, value)  
                VALUES ($1, $2)`,
                [name, value]
            )
        }
    }

    async insertEvent(network: string, event: EventModel) {
        const tableName = `${network}_events`

        const existedTxs = await this.pool.query(`SELECT 1 FROM ${tableName} where event = $1 and sn = $2 and tx_hash = $3`, [
            event.event,
            event.sn,
            event.tx_hash
        ])
        const isExisted = existedTxs && existedTxs.rows.length > 0

        if (!isExisted) {
            try {
                const rs = await this.pool.query(
                    `INSERT INTO ${tableName} (event, sn, nsn, reqId, msg, code, data, from_raw, to_raw, from_decoded, to_decoded, block_number, block_timestamp, tx_hash, tx_from, tx_to, tx_value, tx_fee, created_at)  
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)`,
                    [
                        event.event,
                        event.sn,
                        event.nsn,
                        event.reqId,
                        event.msg,
                        event.code,
                        event.data,
                        event.from_raw,
                        event.to_raw,
                        event.from_decoded,
                        event.to_decoded,
                        event.block_number,
                        event.block_timestamp,
                        event.tx_hash,
                        event.tx_from,
                        event.tx_to,
                        event.tx_value,
                        event.tx_fee,
                        nowTimestamp()
                    ]
                )
                return rs.rowCount
            } catch (error: any) {
                logger.error(`db: error ${error.message}`)
            }
        }

        return 0
    }

    async updateEventById(network: string, id: number, sn: number, from_raw: string, to_raw: string, from_decoded: string, to_decoded: string) {
        const tableName = `${network}_events`

        const updateQuery = `
            UPDATE ${tableName} 
            SET sn = $2, from_raw = $3, to_raw = $4, from_decoded = $5, to_decoded = $6, updated_at = $7
            WHERE id = $1  
            `

        const rs = await this.pool.query(updateQuery, [id, sn, from_raw, to_raw, from_decoded, to_decoded, nowTimestamp()])
        return rs
    }

    async getEventByReqId(network: string, event: string, reqId: number) {
        const tableName = `${network}_events`
        const eventRs = await this.pool.query(`SELECT * FROM ${tableName} where event = $1 AND reqId = $2`, [event, reqId])

        if (eventRs && eventRs.rows.length > 0) {
            return eventRs.rows[0]
        }

        return undefined
    }

    async getEventBySn(network: string, event: string, sn: number) {
        const tableName = `${network}_events`
        const eventRs = await this.pool.query(`SELECT * FROM ${tableName} where event = $1 AND sn = $2`, [event, sn])

        if (eventRs && eventRs.rows.length > 0) {
            return eventRs.rows[0]
        }

        return undefined
    }

    async getEventsBySn(network: string, sn: number) {
        const eventsRs = await this.pool.query(`SELECT * FROM ${network}_events where sn = $1 order by block_number`, [sn])
        return eventsRs.rows as EventModel[]
    }

    async getMaxEventSn(network: string) {
        const maxSnRs = await this.pool.query(`SELECT max(sn) FROM ${network}_events`)
        return maxSnRs.rows.length > 0 ? Number(maxSnRs.rows[0].max) : 0
    }

    async getMaxEventBlockNumber(network: string) {
        const maxBlockNumberRs = await this.pool.query(`SELECT max(block_number) FROM ${network}_events`)
        return maxBlockNumberRs.rows.length > 0 ? Number(maxBlockNumberRs.rows[0].max) : 0
    }

    async getNewSnList(network: string, fromBlockNumber: number, toBlockNumber: number) {
        // const snListRs = await this.pool.query(
        //     `SELECT distinct sn FROM ${network}_events
        //     WHERE block_number >= $1 AND block_number <= $2 AND sn NOT IN (SELECT sn FROM messages where src_network = $3 OR dest_network = $3)
        //     ORDER BY sn`,
        //     [fromBlockNumber, toBlockNumber, network]
        // )
        const snListRs = await this.pool.query(
            `SELECT distinct sn FROM ${network}_events 
            WHERE block_number > $1 AND block_number <= $2
            ORDER BY sn`,
            [fromBlockNumber, toBlockNumber]
        )
        return snListRs.rows
    }

    // MESSAGE
    async insertMessage(message: MessageModel) {
        const existedTxs = await this.pool.query(`SELECT 1 FROM messages where sn = $1 and src_network = $2 and dest_network = $3`, [
            message.sn,
            message.src_network,
            message.dest_network
        ])
        const isExisted = existedTxs && existedTxs.rows.length > 0

        if (!isExisted) {
            try {
                const rs = await this.pool.query(
                    `INSERT INTO messages (sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app,  
                        dest_network, dest_block_number,  dest_block_timestamp,  dest_tx_hash, dest_app, value, fee, created_at)  
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
                    [
                        message.sn,
                        message.status,
                        message.src_network,
                        message.src_block_number,
                        message.src_block_timestamp,
                        message.src_tx_hash,
                        message.src_app,
                        message.dest_network,
                        message.dest_block_number,
                        message.dest_block_timestamp,
                        message.dest_tx_hash,
                        message.dest_app,
                        message.value,
                        message.fee,
                        nowTimestamp()
                    ]
                )
                return rs.rowCount ?? 0
            } catch (error: any) {
                logger.error(`db: error ${error.message}`)
            }
        }

        return 0
    }

    async getMessageStatus(sn: number, src_network: string, dest_network: string, src_app: string) {
        const msgStatusRs = await this.pool.query(
            `SELECT status FROM messages WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4`,
            [sn, src_network, dest_network, src_app]
        )

        return msgStatusRs.rows.length > 0 ? msgStatusRs.rows[0].status : undefined
    }

    async validateRollbackedStatus(sn: number, src_network: string, dest_network: string, src_app: string) {
        const isRollbackedStatusRs = await this.pool.query(
            `SELECT 1 FROM messages WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 AND rollback_tx_hash is not null`,
            [sn, src_network, dest_network, src_app]
        )
        const isRollbackedStatus = isRollbackedStatusRs && isRollbackedStatusRs.rows.length > 0

        return isRollbackedStatus
    }

    async updateMessageSynced(sn: number, src_network: string, dest_network: string, src_app: string, synced: boolean) {
        try {
            const rs = await this.pool.query(
                `UPDATE messages   
                SET synced = $5, updated_at = $6
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                [sn, src_network, dest_network, src_app, synced, nowTimestamp()]
            )
            return rs.rowCount ?? 0
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateSentMessage(
        sn: number,
        src_network: string,
        dest_network: string,
        src_app: string,
        dest_block_number: number,
        dest_block_timestamp: number,
        dest_tx_hash: string,
        status: string
    ) {
        try {
            const rs = await this.pool.query(
                `UPDATE messages   
                SET dest_block_number = $5, dest_block_timestamp = $6, dest_tx_hash = $7, status = $8, updated_at = $9
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 AND status != '${MSG_STATUS.Rollbacked}' AND status != '${MSG_STATUS.Executed}'`,
                [sn, src_network, dest_network, src_app, dest_block_number, dest_block_timestamp, dest_tx_hash, status, nowTimestamp()]
            )

            return rs.rowCount ?? 0
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateRollbackMessage(
        sn: number,
        src_network: string,
        dest_network: string,
        src_app: string,
        rollback_block_number: number,
        rollback_block_timestamp: number,
        rollback_tx_hash: string,
        rollback_error: string | undefined,
        status: string
    ) {
        try {
            const rs = await this.pool.query(
                `UPDATE messages   
                SET rollback_block_number = $5, rollback_block_timestamp = $6, rollback_tx_hash = $7, rollback_error = $8, status = $9, updated_at = $10
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                [
                    sn,
                    src_network,
                    dest_network,
                    src_app,
                    rollback_block_number,
                    rollback_block_timestamp,
                    rollback_tx_hash,
                    rollback_error,
                    status,
                    nowTimestamp()
                ]
            )

            return rs.rowCount ?? 0
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateResponseMessage(
        sn: number,
        src_network: string,
        dest_network: string,
        src_app: string,
        response_block_number: number,
        response_block_timestamp: number,
        response_tx_hash: string,
        rollback_error: string | undefined,
        status: string
    ) {
        try {
            const rs = await this.pool.query(
                `UPDATE messages   
                SET response_block_number = $5, response_block_timestamp = $6, response_tx_hash = $7, rollback_error = $8, status = $9, updated_at =$10
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4`,
                [
                    sn,
                    src_network,
                    dest_network,
                    src_app,
                    response_block_number,
                    response_block_timestamp,
                    response_tx_hash,
                    rollback_error,
                    status,
                    nowTimestamp()
                ]
            )

            return rs.rowCount ?? 0
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateExecutedMessage(
        sn: number,
        src_network: string,
        dest_network: string,
        src_app: string,
        src_error: string | undefined,
        dest_block_number: number,
        dest_block_timestamp: number,
        dest_tx_hash: string,
        dest_error: string | undefined,
        status: string
    ) {
        try {
            const rs = await this.pool.query(
                `UPDATE messages   
                SET status = $5, src_error = $6, dest_block_number = $7, dest_block_timestamp = $8, dest_tx_hash = $9, dest_error = $10, updated_at = $11
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                [
                    sn,
                    src_network,
                    dest_network,
                    src_app,
                    status,
                    src_error,
                    dest_block_number,
                    dest_block_timestamp,
                    dest_tx_hash,
                    dest_error,
                    nowTimestamp()
                ]
            )
            return rs.rowCount ?? 0
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async getDAppAddresses(network: string) {
        const dappAddressesRs = await this.pool.query(
            `SELECT distinct from_decoded FROM ${network}_events WHERE event = 'CallMessageSent' and from_decoded is not null`
        )
        return dappAddressesRs.rows.map((p) => p.from_decoded as string)
    }

    async getNotSyncedMessages(src_network: string) {
        // only check messages in 1 day
        let snsRs = await this.pool.query(
            `SELECT sn, src_network, dest_network 
            FROM messages 
            WHERE src_network = $1 AND synced = $2 AND src_block_timestamp > $3
            GROUP BY sn, src_network, dest_network
            ORDER BY sn desc`,
            [src_network, false, lastDaysTimestamp(1)]
        )

        return snsRs.rows as BaseMessageModel[]
    }

    async getPendingMessages(src_network: string) {
        let snsRs = await this.pool.query(
            `SELECT sn, src_network, dest_network 
            FROM messages 
            WHERE src_network = $1 AND status = $2 
            GROUP BY sn, src_network, dest_network
            ORDER BY sn desc`,
            [src_network, MSG_STATUS.Pending]
        )

        return snsRs.rows as BaseMessageModel[]
    }

    async getMaxMessageSn(src_network: string) {
        const maxSnRs = await this.pool.query(`SELECT max(sn) FROM messages where src_network = $1 or dest_network = $1`, [src_network])
        return maxSnRs.rows.length > 0 ? Number(maxSnRs.rows[0].max) : 0
    }

    async getMaxMessageBlockNumber(src_network: string) {
        const maxSrcBlockNumberRs = await this.pool.query(
            `SELECT MAX(GREATEST(src_block_number::bigint, response_block_number::bigint, rollback_block_number::bigint)) FROM messages WHERE src_network = $1 `,
            [src_network]
        )
        const maxDestBlockNumberRs = await this.pool.query(`SELECT MAX(dest_block_number) FROM messages WHERE dest_network = $1 `, [src_network])

        if (maxSrcBlockNumberRs.rows.length > 0 && maxDestBlockNumberRs.rows.length > 0) {
            return Math.max(Number(maxSrcBlockNumberRs.rows[0].max), Number(maxDestBlockNumberRs.rows[0].max))
        }

        return 0
    }
}

export { Db }

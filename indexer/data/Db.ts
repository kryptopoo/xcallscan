import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'
dotenv.config()
import pg from 'pg'
const Pool = pg.Pool
import { MSG_STATUS } from '../common/constants'
import logger from '../modules/logger/logger'
import { BaseMessageModel, EventModel, MessageModel } from '../types/DataModels'

class Db {
    pool = new Pool({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: parseInt(process.env.PGPORT || '5432')
    })

    async init() {
        const sqlFilePath = path.join(__dirname, 'db.sql')
        const sql = fs.readFileSync(sqlFilePath, 'utf8')
        const rs = await this.pool.query(sql)
        return rs
    }

    async getCounterByName(name: string) {
        let result = { name: name, value: 0 }
        const counterRs = await this.pool.query('SELECT * FROM counter where name = $1', [name])

        if (counterRs && counterRs.rows.length > 0) {
            result.name = counterRs.rows[0].name.trim().toString()
            result.value = parseInt(counterRs.rows[0].value)
        }

        return result
    }

    async updateCounter(name: string, value: number) {
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
        const nowTimestamp = Math.floor(Date.now() / 1000)

        const existedTxs = await this.pool.query(`SELECT * FROM ${tableName} where event = $1 and sn = $2 and tx_hash = $3`, [
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
                        nowTimestamp
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
        const nowTimestamp = Math.floor(Date.now() / 1000)

        const updateQuery = `
            UPDATE ${tableName} 
            SET sn = $2, from_raw = $3, to_raw = $4, from_decoded = $5, to_decoded = $6, updated_at = $7
            WHERE id = $1  
            `

        const rs = await this.pool.query(updateQuery, [id, sn, from_raw, to_raw, from_decoded, to_decoded, nowTimestamp])
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

    async getEventsBySn(network: string, sn: number) {
        const eventsRs = await this.pool.query(`SELECT * FROM ${network}_events where sn = $1 order by block_number`, [sn])
        return eventsRs.rows as EventModel[]
    }

    async getMaxEventSn(network: string) {
        const maxSnRs = await this.pool.query(`SELECT max(sn) FROM ${network}_events`)
        return maxSnRs.rows.length > 0 ? Number(maxSnRs.rows[0].max) : 0
    }

    // MESSAGE
    async insertMessage(message: MessageModel) {
        const tableName = `messages`
        const nowTimestamp = Math.floor(Date.now() / 1000)

        const existedTxs = await this.pool.query(`SELECT * FROM ${tableName} where sn = $1 and src_network = $2 and dest_network = $3`, [
            message.sn,
            message.src_network,
            message.dest_network
        ])
        const isExisted = existedTxs && existedTxs.rows.length > 0

        if (!isExisted) {
            try {
                const rs = await this.pool.query(
                    `INSERT INTO ${tableName} (sn, status, src_network, src_block_number, src_block_timestamp, src_tx_hash, src_app, src_error, 
                        dest_network, dest_block_number,  dest_block_timestamp,  dest_tx_hash, dest_app, dest_error, value, fee, created_at)  
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
                    [
                        message.sn,
                        message.status,
                        message.src_network,
                        message.src_block_number,
                        message.src_block_timestamp,
                        message.src_tx_hash,
                        message.src_app,
                        message.src_error,
                        message.dest_network,
                        message.dest_block_number,
                        message.dest_block_timestamp,
                        message.dest_tx_hash,
                        message.dest_app,
                        message.dest_error,
                        message.value,
                        message.fee,
                        nowTimestamp
                    ]
                )
                return rs.rowCount
            } catch (error: any) {
                logger.error(`db: error ${error.message}`)
            }
        }

        return 0
    }

    async needUpdateMessageStatus(sn: number, src_network: string, dest_network: string, src_app: string, status: string) {
        const needUpdateRs = await this.pool.query(
            `SELECT * FROM messages WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4`,
            [sn, src_network, dest_network, src_app]
        )
        // console.log('needUpdateRs', needUpdateRs)
        if (needUpdateRs && needUpdateRs.rows.length > 0) {
            if (needUpdateRs.rows[0].status == MSG_STATUS.Executed) return false
            else if (needUpdateRs.rows[0].status == MSG_STATUS.Pending) return true
            else if (needUpdateRs.rows[0].status == MSG_STATUS.Delivered && status == MSG_STATUS.Executed) {
                return true
            }
        }

        return false
    }

    async updateMessageStatus(sn: number, src_network: string, dest_network: string, src_app: string, status: string) {
        const tableName = `messages`
        const nowTimestamp = Math.floor(Date.now() / 1000)

        try {
            const needUpdate = await this.needUpdateMessageStatus(sn, src_network, dest_network, src_app, status)

            if (needUpdate) {
                const rs = await this.pool.query(
                    `UPDATE ${tableName}   
                    SET status = $5, updated_at = $6
                    WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                    [sn, src_network, dest_network, src_app, status, nowTimestamp]
                )
                return rs.rowCount
            }
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateMessageSynced(sn: number, src_network: string, dest_network: string, src_app: string, synced: boolean) {
        const tableName = `messages`
        const nowTimestamp = Math.floor(Date.now() / 1000)

        try {
            const rs = await this.pool.query(
                `UPDATE ${tableName}   
                SET synced = $5, updated_at = $6
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                [sn, src_network, dest_network, src_app, synced, nowTimestamp]
            )
            return rs.rowCount
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateMessageSourceError(sn: number, src_network: string, dest_network: string, src_app: string, errMsg: string) {
        const tableName = `messages`
        const nowTimestamp = Math.floor(Date.now() / 1000)

        try {
            const rs = await this.pool.query(
                `UPDATE ${tableName}   
                SET src_error = $5, updated_at = $6
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                [sn, src_network, dest_network, src_app, errMsg, nowTimestamp]
            )
            return rs.rowCount
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateMessageDestError(sn: number, src_network: string, dest_network: string, src_app: string, errMsg: string) {
        const tableName = `messages`
        const nowTimestamp = Math.floor(Date.now() / 1000)

        try {
            const rs = await this.pool.query(
                `UPDATE ${tableName}   
                SET dest_error = $5, updated_at = $6
                WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 AND dest_error is not null`,
                [sn, src_network, dest_network, src_app, errMsg, nowTimestamp]
            )
            return rs.rowCount
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateMessageSent(
        sn: number,
        src_network: string,
        dest_network: string,
        src_app: string,
        dest_block_number: number,
        dest_block_timestamp: number,
        dest_tx_hash: string,
        status: string
    ) {
        const nowTimestamp = Math.floor(Date.now() / 1000)

        try {
            const needUpdate = await this.needUpdateMessageStatus(sn, src_network, dest_network, src_app, status)

            if (needUpdate) {
                const rs = await this.pool.query(
                    `UPDATE messages   
                    SET dest_block_number = $5, dest_block_timestamp = $6, dest_tx_hash = $7, status = $8, updated_at = $9
                    WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                    [sn, src_network, dest_network, src_app, dest_block_number, dest_block_timestamp, dest_tx_hash, status, nowTimestamp]
                )

                return rs.rowCount
            }
        } catch (error: any) {
            logger.error(`db: error ${error.message}`)
        }

        return 0
    }

    async updateMessageRollbacked(
        sn: number,
        src_network: string,
        dest_network: string,
        src_app: string,
        dest_block_number: number,
        dest_block_timestamp: number,
        dest_tx_hash: string,
        status: string
    ) {
        const nowTimestamp = Math.floor(Date.now() / 1000)

        try {
            const needUpdate = await this.needUpdateMessageStatus(sn, src_network, dest_network, src_app, status)

            if (needUpdate) {
                const rs = await this.pool.query(
                    `UPDATE messages   
                    SET dest_block_number = $5, dest_block_timestamp = $6, dest_tx_hash = $7, status = $8, rollbacked = $9, updated_at = $10
                    WHERE sn = $1 AND src_network = $2 AND dest_network = $3 AND src_app = $4 `,
                    [sn, src_network, dest_network, src_app, dest_block_number, dest_block_timestamp, dest_tx_hash, status, true, nowTimestamp]
                )

                return rs.rowCount
            }
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

    async getNotSyncedMessages(network: string) {
        const snsRs = await this.pool.query(
            `SELECT distinct sn 
            FROM ${network}_events 
            WHERE sn not in (SELECT distinct sn FROM messages WHERE synced = true)
            ORDER BY sn`
        )
        return snsRs.rows.map((p) => p.sn as number)
    }

    async getPendingMessages(src_network: string, dest_network: string) {
        if (dest_network) {
            let snsRs = await this.pool.query(
                `SELECT sn, src_network, dest_network 
                FROM messages 
                WHERE src_network = $1 AND dest_network = $2 AND status = $3 
                GROUP BY sn, src_network, dest_network
                ORDER BY sn desc`,
                [src_network, dest_network, MSG_STATUS.Delivered]
            )

            return snsRs.rows as BaseMessageModel[]
        } else {
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
    }

    async getMaxMessageSn(src_network: string) {
        const maxSnRs = await this.pool.query(`SELECT max(sn) FROM messages where src_network = $1 or dest_network = $1`, [src_network])
        return maxSnRs.rows.length > 0 ? Number(maxSnRs.rows[0].max) : 0
    }
}

export { Db, EventModel, MessageModel }

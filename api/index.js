const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 4000
const db = require('./db')
const logger = require('./logger')
const rpc = require('./rpc')
const { NETWORK } = require('./constants')
const rateLimiter = require('./middlewares/rate-limiter')
const cors = require('cors')

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

const defaultAllowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3100',
    'http://3.95.20.254:3100',
    'http://3.95.20.254:3000',
    'http://icongmp-testnet.icon.community',
    'https://icongmp-testnet.icon.community',
    'http://icongmp-mainnet.icon.community',
    'https://icongmp-mainnet.icon.community',
    'http://testnet.xcallscan.xyz',
    'https://testnet.xcallscan.xyz',
    'http://xcallscan.xyz',
    'https://xcallscan.xyz',
    'https://balanced-network-interface-([a-zA-Z0-9]*)-balanced-dao.vercel.app(.*)'
]

const allowedOrigins = defaultAllowedOrigins.concat(process.env.ALLOW_ORIGINS ? process.env.ALLOW_ORIGINS.split(';') : [])

const corsOptions = {
    origin: function (origin, callback) {
        if (!origin) return callback(null, true)

        // check regex origins
        // simple check regex string
        const isRegex = (str) => {
            return str.indexOf('*') > -1
        }
        const regexOrigins = allowedOrigins.filter((o) => isRegex(o))
        if (regexOrigins.length > 0) {
            for (let i = 0; i < regexOrigins.length; i++) {
                const regexOrigin = regexOrigins[i]
                const isValid = origin.search(regexOrigin) > -1
                if (isValid) {
                    return callback(null, true)
                }
            }
        }

        if (allowedOrigins.indexOf(origin) === -1) {
            var msg = 'The CORS policy for this site does not ' + 'allow access from the specified Origin.'
            return callback(new Error(msg), false)
        }

        return callback(null, true)
    }
}
app.use(cors(corsOptions))

app.use(rateLimiter)

app.get('/api', (req, res) => {
    res.status(200).json({ status: 'running' })
})

app.get('/api/messages', async (req, res) => {
    const skip = req.query.skip ? parseInt(req.query.skip) : 0
    const limit = req.query.limit ? parseInt(req.query.limit) : 10
    const status = req.query.status
    const src_network = req.query.src_network
    const dest_network = req.query.dest_network
    const src_address = req.query.src_address
    const dest_address = req.query.dest_address
    const from_timestamp = req.query.from_timestamp
    const to_timestamp = req.query.to_timestamp
    const action_type = req.query.action_type

    try {
        const rs = await db.getMessages(
            skip,
            limit,
            status,
            src_network,
            dest_network,
            src_address,
            dest_address,
            from_timestamp,
            to_timestamp,
            action_type
        )

        res.status(200).json(rs)
    } catch (error) {
        logger.error(error)
        res.status(400).json({ error: error.message })
    }
})

app.get('/api/messages/:id', async (req, res) => {
    const msgId = req.params.id ? req.params.id : ''

    try {
        const rs = await db.getMessageById(msgId)

        res.status(200).json(rs)
    } catch (error) {
        logger.error(error)
        res.status(400).json({ error: error.message })
    }
})

app.get('/api/search', async (req, res) => {
    const value = req.query.value ? req.query.value : 0
    try {
        const rs = await db.searchMessages(value)

        res.status(200).json(rs)
    } catch (error) {
        logger.error(error)
        res.status(400).json({ error: error.message })
    }
})

app.get('/api/statistics/total_messages', async (req, res) => {
    const status = req.query.status
    const src_networks = req.query.src_networks
    const dest_networks = req.query.dest_networks
    const src_address = req.query.src_address
    const dest_address = req.query.dest_address
    const from_timestamp = req.query.from_timestamp
    const to_timestamp = req.query.to_timestamp

    try {
        const rs = await db.getTotalMessages(status, src_networks, dest_networks, src_address, dest_address, from_timestamp, to_timestamp)

        res.status(200).json(rs)
    } catch (error) {
        logger.error(error)
        res.status(400).json({ error: error.message })
    }
})

app.get('/api/rpc/block_height', async (req, res) => {
    const networks = req.query.networks ? req.query.networks.split(',') : Object.values(NETWORK)
    try {
        const rs = await rpc.getBlockHeight(networks)

        res.status(200).json(rs)
    } catch (error) {
        logger.error(error)
        res.status(400).json({ error: error.message })
    }
})

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})

const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 4000
const db = require('./db')
const logger = require('./logger')
const { error } = require('winston')

app.use(bodyParser.json())
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
})

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

    try {
        const rs = await db.getMessages(skip, limit, status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp)

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

// TODO: to be removed
app.get('/api/statistic', async (req, res) => {
    try {
        const rs = await db.getStatistic()

        res.status(200).json(rs)
    } catch (error) {
        res.status(400)
    }
})

app.get('/api/statistics/total_messages', async (req, res) => {
    const status = req.query.status
    const src_network = req.query.src_network
    const dest_network = req.query.dest_network
    const src_address = req.query.src_address
    const dest_address = req.query.dest_address
    const from_timestamp = req.query.from_timestamp
    const to_timestamp = req.query.to_timestamp

    try {
        const rs = await db.getTotalMessages(status, src_network, dest_network, src_address, dest_address, from_timestamp, to_timestamp)

        res.status(200).json(rs)
    } catch (error) {
        logger.error(error)
        res.status(400).json({ error: error.message })
    }
})

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})

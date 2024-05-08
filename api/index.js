const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const port = process.env.PORT || 4000
const db = require('./db')

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

    try {
        const rs = await db.getMessages(skip, limit)

        res.status(200).json(rs)
    } catch (error) {
        res.status(400)
    }
})

app.get('/api/messages/:id', async (req, res) => {
    const msgId = req.params.id ? req.params.id : ''

    try {
        const rs = await db.getMessageById(msgId)

        res.status(200).json(rs)
    } catch (error) {
        res.status(400)
    }
})

app.get('/api/search', async (req, res) => {
    const value = req.query.value ? req.query.value : 0
    try {
        const rs = await db.searchMessages(value)

        res.status(200).json(rs)
    } catch (error) {
        res.status(400)
    }
})

app.get('/api/statistic', async (req, res) => {
    try {
        const rs = await db.getStatistic()

        res.status(200).json(rs)
    } catch (error) {
        res.status(400)
    }
})

app.listen(port, () => {
    console.log(`App running on port ${port}.`)
})

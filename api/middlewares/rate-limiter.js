const rateLimit = require('express-rate-limit')
const { RATE_LIMIT } = require('./../constants')

const apiRateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: RATE_LIMIT,
    message: 'Too many requests'
})

module.exports = apiRateLimiter

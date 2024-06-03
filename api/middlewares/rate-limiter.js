const rateLimit = require('express-rate-limit')

const apiRateLimiter = rateLimit({
    windowMs: 1000, // 1 second
    max: 5,
    message: 'Too many requests'
})

module.exports = apiRateLimiter

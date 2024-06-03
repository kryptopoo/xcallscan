const winston = require('winston')
const { combine, timestamp, label, printf, simple } = winston.format

const myFormat = printf(({ message, timestamp }) => {
    return `${timestamp} ${message}`
})

const logger = winston.createLogger({
    // Log only if level is less than (meaning more severe) or equal to this
    level: 'info',
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), myFormat),
    // Log to the console and a file
    transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/api.log' })]
})

module.exports = logger

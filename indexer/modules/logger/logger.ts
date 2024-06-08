import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { format } from 'winston'
const { combine, timestamp, label, printf, simple } = format

const myFormat = printf(({ message, timestamp }: any) => {
    return `${timestamp} ${message}`
})

const logger = winston.createLogger({
    // format: format.combine(format.splat(), format.simple()),
    format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), myFormat),
    transports: [
        new winston.transports.Console({}),
        // new winston.transports.File({ filename: './logs/error.log', level: 'error' }),
        new DailyRotateFile({
            level: 'error',
            filename: './logs/%DATE%.error.log',
            json: false,
            datePattern: 'yyyy-MM-DD',
            maxFiles: 10
        }),
        new DailyRotateFile({
            // name: 'info-file',
            level: 'info',
            filename: './logs/%DATE%.log',
            json: false,
            // format: format.combine(format.splat(), format.simple()),
            datePattern: 'yyyy-MM-DD',
            // timestamp: true,
            // prepend: true,
            maxFiles: 10
        })
    ]
})

export default logger

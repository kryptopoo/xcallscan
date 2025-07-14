import { Logger } from 'winston'
import { CONTRACT, SUBSCRIBER_INTERVAL } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { ISubscriberCallback } from '../../interfaces/ISubcriber'
import { subscriberLogger } from '../logger/logger'
import fs from 'fs'

export abstract class BaseSubscriber {
    interval = 6000 // default is 6000 ms
    network: string = ''
    url: string = ''
    decoder: IDecoder
    logger: Logger

    private urls: string[] = []

    constructor(network: string, urls: string[], decoder: IDecoder) {
        this.network = network
        this.urls = urls
        this.url = this.urls[0]
        this.decoder = decoder
        this.logger = subscriberLogger(this.network)

        // set interval
        if (SUBSCRIBER_INTERVAL) {
            const networkIntervals = SUBSCRIBER_INTERVAL.split(',').map((netorkInterval) => ({
                network: netorkInterval.split(':')[0],
                interval: Number(netorkInterval.split(':')[1])
            }))

            for (let i = 0; i < networkIntervals.length; i++) {
                const ni = networkIntervals[i]
                if (ni.network == '*') {
                    this.interval = ni.interval
                }
                if (ni.network.toLowerCase() == this.network.toLowerCase()) {
                    this.interval = ni.interval
                    break
                }
            }
        }
    }

    rotateUrl(): string {
        const currentIndex = this.urls.indexOf(this.url)
        this.url = currentIndex === this.urls.length - 1 ? this.urls[0] : this.urls[currentIndex + 1]
        return this.url
    }

    logLatestPolling(id: string = this.network) {
        try {
            const date = new Date().toISOString().substring(0, 10)
            const filePath = `./logs/${date}.subscriber.status.log`

            if (!fs.existsSync(filePath)) {
                fs.writeFileSync(filePath, JSON.stringify({}))
            }

            // read
            const fileData = fs.readFileSync(filePath, 'utf8')
            let data = JSON.parse(fileData)
            data[id] = new Date().toISOString()

            // write
            fs.writeFileSync(filePath, JSON.stringify(data, undefined, 4))
        } catch (error) {
            this.logger.error(`${this.network} setLastestRunTime error ${JSON.stringify(error)}`)
        }
    }

    abstract subscribe(contractAddresses: string[], eventNames: string[], txHashes: string[], callback: ISubscriberCallback): void
}

import { CONTRACT, SUBSCRIBER_INTERVAL } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { ISubscriberCallback } from '../../interfaces/ISubcriber'

export abstract class BaseSubscriber {
    interval = 6000 // default is 6000 ms
    network: string = ''
    url: string = ''
    xcallContracts: string[] = []
    decoder: IDecoder

    private urls: string[] = []

    constructor(network: string, urls: string[], decoder: IDecoder) {
        this.network = network
        this.urls = urls
        this.url = this.urls[0]
        this.xcallContracts = CONTRACT[this.network].xcall
        this.decoder = decoder

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

    abstract subscribe(callback: ISubscriberCallback): void
}

import { CONTRACT, SUBSCRIBER_INTERVAL } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { ISubscriberCallback } from '../../interfaces/ISubcriber'

export abstract class BaseSubscriber {
    interval = SUBSCRIBER_INTERVAL
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
    }

    rotateUrl(): string {
        const currentIndex = this.urls.indexOf(this.url)
        this.url = currentIndex === this.urls.length - 1 ? this.urls[0] : this.urls[currentIndex + 1]
        return this.url
    }

    abstract subscribe(callback: ISubscriberCallback): void
}

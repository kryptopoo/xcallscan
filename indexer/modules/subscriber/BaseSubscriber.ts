import { CONTRACT, RPC_URLS, SUBSCRIBER_INTERVAL } from '../../common/constants'
import { ISubscriber, ISubscriberCallback } from '../../interfaces/ISubcriber'

export abstract class RpcSubscriber {
    interval = SUBSCRIBER_INTERVAL
    network: string = ''
    rpcUrl: string = ''
    xcallContracts: string[] = []

    private rpcUrls: string[] = []

    constructor(network: string) {
        this.network = network
        this.rpcUrls = RPC_URLS[this.network]
        this.rpcUrl = this.rpcUrls[0]
        this.xcallContracts = CONTRACT[this.network].xcall
    }

    rotateRpcUrl(): string {
        const currentIndex = this.rpcUrls.indexOf(this.rpcUrl)
        this.rpcUrl = currentIndex === this.rpcUrls.length - 1 ? this.rpcUrls[0] : this.rpcUrls[currentIndex + 1]
        return this.rpcUrl
    }

    abstract subscribe(callback: ISubscriberCallback): void
}

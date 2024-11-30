import { NETWORK, USE_MAINNET } from '../../common/constants'
import { BaseSubscriber } from './BaseSubscriber'
import { EvmSubscriber } from './EvmSubscriber'
import { IbcSubscriber } from './IbcSubscriber'
import { IconSubscriber } from './IconSubscriber'
import { SolanaSubscriber } from './SolanaSubscriber'
import { StellarSubscriber } from './StellarSubscriber'
import { SuiSubscriber } from './SuiSubscriber'

export class SubscriberFactory {
    static createSubscriber(network: string): BaseSubscriber | undefined {
        let subscriber: BaseSubscriber | undefined

        // ICON
        if (network == NETWORK.ICON || network == NETWORK.HAVAH) {
            subscriber = new IconSubscriber(network)
        }

        // EVM
        if (
            network == NETWORK.BSC ||
            network == NETWORK.ETH2 ||
            network == NETWORK.BASE ||
            network == NETWORK.ARBITRUM ||
            network == NETWORK.OPTIMISM ||
            network == NETWORK.AVAX ||
            network == NETWORK.POLYGON
        ) {
            subscriber = new EvmSubscriber(network)
        }

        // IBC
        if (network == NETWORK.IBC_ARCHWAY || network == NETWORK.IBC_NEUTRON || network == NETWORK.IBC_INJECTIVE) {
            subscriber = new IbcSubscriber(network)
        }

        // SUI
        if (network == NETWORK.SUI) {
            subscriber = new SuiSubscriber()
        }

        // STELLAR
        if (network == NETWORK.STELLAR) {
            subscriber = new StellarSubscriber()
        }

        // SOLANA
        if (network == NETWORK.SOLANA) {
            subscriber = new SolanaSubscriber()
        }

        return subscriber
    }
}

import { NETWORK, USE_MAINNET } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { CelatoneScan } from './CelatoneScan'
import { EvmScan } from './EvmScan'
import { HavahScan } from './HavahScan'
import { IconScan } from './IconScan'
import { InjectiveScan } from './InjectiveScan'
import { MintAccountScan } from './MintAccountScan'
import { MintScanV2 } from './MintScanV2'
import { SuiScan } from './SuiScan'

export class ScanFactory {
    static createScan(network: string) {
        let scan: IScan = new IconScan(network)

        if (network == NETWORK.HAVAH) {
            scan = new HavahScan()
        }
        if (
            network == NETWORK.BSC ||
            network == NETWORK.ETH2 ||
            network == NETWORK.BASE ||
            network == NETWORK.ARBITRUM ||
            network == NETWORK.OPTIMISM ||
            network == NETWORK.POLYGON
        ) {
            scan = new EvmScan(network)
        }
        if (network == NETWORK.IBC_ARCHWAY) {
            if (USE_MAINNET) scan = new MintScanV2(network)
            else scan = new MintAccountScan(network)
        }
        if (network == NETWORK.IBC_NEUTRON) {
            scan = new CelatoneScan(network)
        }
        if (network == NETWORK.IBC_INJECTIVE) {
            scan = new InjectiveScan(network)
        }
        if (network == NETWORK.AVAX) {
            scan = new EvmScan(network)
        }
        if (network == NETWORK.SUI) {
            scan = new SuiScan(network)
        }

        return scan
    }
}

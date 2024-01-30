import { NETWORK } from '../../common/constants'
import { IScan } from '../../interfaces/IScan'
import { CelatoneScan } from './CelatoneScan'
import { EvmScan } from './EvmScan'
import { HavahScan } from './HavahScan'
import { IconScan } from './IconScan'
import { MintScan } from './MintScan'

export class ScanFactory {
    static createScan(network: string) {
        let scan: IScan = new IconScan(network)

        if (network == NETWORK.HAVAH) {
            scan = new HavahScan()
        }
        if (network == NETWORK.BSC || network == NETWORK.ETH2) {
            scan = new EvmScan(network)
        }
        if (network == NETWORK.IBC_ARCHWAY) {
            scan = new MintScan(network)
        }
        if (network == NETWORK.IBC_NEUTRON) {
            scan = new CelatoneScan(network)
        }

        return scan
    }
}

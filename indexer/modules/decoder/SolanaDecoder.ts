import { EVENT } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLogData } from '../../types/EventLog'
import { BorshInstructionCoder, Instruction } from '@coral-xyz/anchor'
const xcallIdl = require('../../abi/xcall.idl.json')
const assetManagerIdl = require('../../abi/asset_manager.idl.json')
const centralizedConnectionIdl = require('../../abi/centralized_connection.idl.json')

export class SolanaDecoder implements IDecoder {
    private getDecodedData(instructions: any, coder: any, decodedName: string) {
        let decoded: Instruction | null
        for (let i = 0; i < instructions.length; i++) {
            decoded = coder.decode(instructions[i].data, 'base58')
            console.log('decoded', decoded)
            if (decoded?.name == decodedName) {
                return decoded?.data as any
            }
        }
    }

    async decodeEventLog(instructions: any, eventName: string): Promise<EventLogData | undefined> {
        let rs: EventLogData | undefined = undefined

        const xcallCoder = new BorshInstructionCoder(xcallIdl)
        const centralizedConnectionCoder = new BorshInstructionCoder(centralizedConnectionIdl)
        const assetManagerCoder = new BorshInstructionCoder(assetManagerIdl)

        let decoded: Instruction | null
        let decodedData: any

        if (eventName && instructions && instructions.length > 0) {
            switch (eventName) {
                case EVENT.CallMessageSent:
                    rs = {} as EventLogData

                    decodedData = this.getDecodedData(instructions, assetManagerCoder, 'deposit_native')
                    if (decodedData) {
                        rs._to = decodedData.to
                        rs._decodedTo = rs._to
                        break
                    }

                    decodedData = this.getDecodedData(instructions, centralizedConnectionCoder, 'send_message')
                    if (decodedData) {
                        rs._sn = Number(decodedData.sn)
                        rs._nsn = decodedData?.nsn
                        break
                    }

                    break
                case EVENT.ResponseMessage:
                    // // TODO: parse here
                    // console.log(eventName, decodedData)
                    // rs._sn = Number(decodedData.sn)
                    // rs._code = decodedData?.code

                    break
                case EVENT.RollbackMessage:
                    decoded = xcallCoder.decode(instructions[0], 'base58')

                    if (decoded) {
                        console.log(eventName, decoded)

                        rs = {} as EventLogData
                        rs._sn = Number((decoded?.data as any).sn)
                    }

                    break
                case EVENT.RollbackExecuted:
                    decodedData = this.getDecodedData(instructions, xcallCoder, 'execute_rollback')

                    if (decodedData) {
                        console.log(eventName, decodedData)

                        rs = {} as EventLogData
                        rs._sn = Number(decodedData.sn)
                    }

                    break
                case EVENT.MessageReceived:
                    // // TODO: parse here
                    // rs._from =
                    // rs._data =
                    // rs._decodedFrom =

                    break
                case EVENT.CallMessage:
                    // // TODO: parse here
                    // console.log(eventName, decodedData)
                    // rs._sn = Number(decodedData.sn)
                    // rs._from = decodedData?.from
                    // rs._decodedFrom = rs._from
                    // rs._to = decodedData?.to
                    // rs._decodedTo = decodedData?.to
                    // rs._reqId = Number(decodedData?.reqId)

                    // const data = decodedData?.data
                    // if (data) {
                    //     try {
                    //         const dataHex = ethers.utils.hexlify(data?.data)
                    //         rs._data = dataHex
                    //     } catch (error) {}
                    // }
                    break

                case EVENT.CallExecuted:
                    // console.log(eventName, decodedData)
                    // rs._reqId = Number(decodedData.reqId)
                    // if (decodedData.code) rs._code = decodedData.code
                    // if (decodedData.msg) rs._msg = decodedData.msg

                    break
                default:
                    break
            }
        }

        return rs
    }
}

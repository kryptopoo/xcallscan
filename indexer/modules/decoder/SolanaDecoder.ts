import { EVENT } from '../../common/constants'
import { IDecoder } from '../../interfaces/IDecoder'
import { EventLogData } from '../../types/EventLog'
import { Instruction, BorshCoder, EventParser } from '@coral-xyz/anchor'
import { ethers } from 'ethers'

const xcallIdl = require('../../abi/xcall.idl.json')
const assetManagerIdl = require('../../abi/asset_manager.idl.json')
const centralizedConnectionIdl = require('../../abi/centralized_connection.idl.json')

export class SolanaDecoder implements IDecoder {
    private getDecodedData(instructions: any, coder: any, decodedName: string) {
        let decoded: Instruction | null
        for (let i = 0; i < instructions.length; i++) {
            decoded = coder.decode(instructions[i].data, 'base58')
            if (decoded?.name == decodedName) {
                return decoded?.data as any
            }
        }
    }

    async decodeEventLog(parsedTransaction: any, eventName: string): Promise<EventLogData | undefined> {
        let rs: EventLogData | undefined = undefined
        let decodedData: any

        // const xcallCoder = new BorshInstructionCoder(xcallIdl)
        // const centralizedConnectionCoder = new BorshInstructionCoder(centralizedConnectionIdl)
        // const assetManagerCoder = new BorshInstructionCoder(assetManagerIdl)

        // let decoded: Instruction | null

        const eventParser = new EventParser(xcallIdl.address, new BorshCoder(xcallIdl))
        const events = eventParser.parseLogs(parsedTransaction.meta?.logMessages)
        for (let event of events) {
            if (event.name == eventName) {
                decodedData = event.data
                break
            }
        }

        if (parsedTransaction && eventName && decodedData) {
            // // combine instructions and innnerInstructions
            // let instructions =
            //     parsedTransaction.transaction.message?.instructions.map((i: any) => ({
            //         programId: i.programId,

            //         data: i.data
            //     })) ?? []
            // if (parsedTransaction.meta?.innerInstructions && parsedTransaction.meta?.innerInstructions.length > 0) {
            //     instructions = instructions.concat(
            //         (parsedTransaction.meta?.innerInstructions as ParsedInnerInstruction[])[0].instructions.map((i: any) => ({
            //             programId: i.programId,
            //             data: i.data
            //         }))
            //     )
            // }
            // instructions = instructions.filter((i: any) => i.data != undefined && i.data != null)

            switch (eventName) {
                case EVENT.CallMessageSent:
                    rs = {} as EventLogData
                    rs._from = decodedData.from?.toString()
                    rs._to = decodedData.to
                    rs._sn = Number(decodedData.sn)
                    rs._nsn = decodedData?.nsn
                    rs._decodedFrom = decodedData.from?.toString()
                    rs._decodedTo = decodedData.to

                    // decodedData = this.getDecodedData(instructions, assetManagerCoder, 'deposit_native')
                    // decodedData = this.getDecodedData(instructions, assetManagerCoder, 'cross_transfer')
                    // decodedData = this.getDecodedData(instructions, centralizedConnectionCoder, 'send_message')
                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'send_call')

                    break
                case EVENT.ResponseMessage:
                    rs = {} as EventLogData
                    rs._sn = Number(decodedData.sn)
                    rs._code = decodedData.code

                    // decodedData = this.getDecodedData(instructions, centralizedConnectionCoder, 'recv_message')
                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'handle_message')
                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'handle_result')

                    break
                case EVENT.RollbackMessage:
                    rs = {} as EventLogData
                    rs._sn = Number(decodedData.sn)
                    if (decodedData?.data) {
                        try {
                            const dataHex = ethers.utils.hexlify(decodedData?.data)
                            rs._data = dataHex
                        } catch (error) {}
                    }

                    break
                case EVENT.RollbackExecuted:
                    rs = {} as EventLogData
                    rs._sn = Number(decodedData.sn)
                    if (decodedData.code) rs._code = decodedData.code
                    if (decodedData.msg) rs._msg = decodedData.msg
                    if (decodedData.err_msg) rs._msg = decodedData.err_msg

                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'execute_rollback')

                    break
                case EVENT.MessageReceived:
                    // // TODO: parse here
                    // rs._from =
                    // rs._data =
                    // rs._decodedFrom =

                    break
                case EVENT.CallMessage:
                    rs = {} as EventLogData
                    rs._sn = Number(decodedData?.sn)
                    rs._from = decodedData?.from
                    rs._decodedFrom = rs._from
                    rs._to = decodedData?.to
                    rs._decodedTo = decodedData?.to
                    rs._reqId = Number(decodedData?.reqId)

                    if (decodedData?.data) {
                        try {
                            const dataHex = ethers.utils.hexlify(decodedData?.data)
                            rs._data = dataHex
                        } catch (error) {}
                    }

                    // decodedData = this.getDecodedData(instructions, centralizedConnectionCoder, 'recv_message')
                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'handle_request')
                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'handle_result')
                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'handle_message')

                    break

                case EVENT.CallExecuted:
                    rs = {} as EventLogData
                    rs._reqId = Number(decodedData.reqId)
                    if (decodedData.code) rs._code = decodedData.code
                    if (decodedData.msg) rs._msg = decodedData.msg

                    // decodedData = this.getDecodedData(instructions, xcallCoder, 'execute_call')

                    break
                default:
                    break
            }
        }

        return rs
    }
}

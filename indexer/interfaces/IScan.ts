import { EventLog } from '../types/EventLog'

export interface IScan {
    network: string
    countName: string

    callApi(apiUrl: string, params: any): Promise<any>
    getEventLogs(flagNumber: string, eventName: string, xcallAddress: string): Promise<{ lastFlagNumber: string; eventLogs: EventLog[] }>
}

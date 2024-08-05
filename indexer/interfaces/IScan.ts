import { EventLog } from '../types/EventLog'

export interface IScan {
    network: string
    countName: string

    callApi(apiUrl: string, params: any): Promise<any>
    getEventLogs(flag: string, eventName: string, xcallAddress: string): Promise<{ lastFlag: string; eventLogs: EventLog[] }>
}

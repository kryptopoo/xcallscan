import { EventLog } from "../types/EventLog";

export interface IScan {
    network: string

    callApi(apiUrl: string, params: any): Promise<any>
    getEventLogs(flagNumber: number, eventName: string): Promise<{ lastFlagNumber: number; eventLogs: EventLog[] }>
}

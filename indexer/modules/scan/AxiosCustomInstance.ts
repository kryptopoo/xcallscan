import axios, { AxiosInstance } from 'axios'
import http from 'node:http'
import https from 'node:https'

export default class AxiosCustomInstance {
    private static instance: AxiosInstance

    public static getInstance(): AxiosInstance {
        if (!AxiosCustomInstance.instance) {
            // const httpAgent = new http.Agent({
            //     keepAlive: true,
            //     timeout: 60000,
            //     scheduling: 'fifo'
            // })
            // const httpsAgent = new https.Agent({
            //     keepAlive: true,
            //     timeout: 60000,
            //     scheduling: 'fifo'
            // })
            // AxiosCustomInstance.instance = axios.create({
            //     httpAgent,
            //     httpsAgent
            // })

            AxiosCustomInstance.instance = axios.create()
        }

        return AxiosCustomInstance.instance
    }
}

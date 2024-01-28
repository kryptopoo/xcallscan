import * as puppeteer from 'puppeteer'
import UserAgent from 'user-agents'

export class Crawler {
    constructor() {}

    async run(url: string) {
        return new Promise<string>(async (resolve, reject) => {
            try {
                // init
                const browser = await puppeteer.launch({ headless: 'new' })
                const page = await browser.newPage()

                // random ua
                const userAgent = new UserAgent({ deviceCategory: 'desktop' })
                const randomUserAgent = userAgent.toString()
                await page.setUserAgent(randomUserAgent)

                // navigate to url
                await page.goto(url)

                // crawling
                const body: string = await page.$eval('*', (el: any) => el.innerText)
                // console.log('crawler', body)
                browser.close()
                return resolve(body)
            } catch (e) {
                console.log('crawler error', e)
                return reject(e)
            }
        })
    }
}

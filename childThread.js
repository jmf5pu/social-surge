const { parseProxies } = require('./utils.js')
const { spawn, Pool, Worker, Thread } = require('threads')

const searchString = String(process.env.SEARCHSTRING)
const viewCount = Number(process.env.VIEWCOUNT)
const minViewS = Number(process.env.MINVIEWS)
const maxViewS = Number(process.env.MAXVIEWS)
const workerCount = Number(process.env.WORKERCOUNT)
const proxies = process.env.PROXIES.split(/\r?\n/)
var successes = 0

async function main(event) {
    pool = Pool(
        () => spawn(new Worker('./viewbot/export-viewer')),
        workerCount
    )

    /**
     * TODO: proxy index logic still appears to not be working,
     * workers will all start on the same proxy, hit proxies at the same time
     */

    // enqueue our desired number of views, failures will requeue themselves
    for (i = 0; i < viewCount * 2; i++) {
        var proxyIndex = i
        pool.queue(async (viewVideo) => {
            await runViewVideo(event, pool, viewVideo, proxyIndex)
        })
    }

    // attempts to viewVideo once
    async function runViewVideo(event, pool, viewVideo, proxyIndex) {
        // select proxy (repeat if viewCount is greater than 1:1)
        var proxy = proxies[proxyIndex % proxies.length]
        viewResult = await viewVideo(
            searchString,
            minViewS,
            maxViewS,
            proxy,
            'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe' // TODO: figure out what to do with this param
        )

        // process run results
        successes += viewResult

        // send individual run results
        console.log(proxy, viewResult, successes)

        // send special message if we have hit our desired number of views
        if (successes >= viewCount) {
            console.log('complete')
            await pool.terminate(true)
            return
        }

        proxyIndex = proxyIndex + 1

        // recurse (requeue) if we failed
        if (!viewResult) {
            pool.queue(async (viewVideo) => {
                await runViewVideo(event, pool, viewVideo, proxyIndex)
            })
        }
    }
}
main()

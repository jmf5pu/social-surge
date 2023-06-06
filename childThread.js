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

    // enqueue our desired number of views, failures will requeue themselves
    for (let i = 0; i < Math.max(viewCount, workerCount) * 2; i++) {
        pool.queue(async (viewVideo) => {
            await runViewVideo(event, pool, viewVideo, i)
        })
    }

    // attempts to viewVideo once
    async function runViewVideo(event, pool, viewVideo, proxyIndex) {
        // select proxy (repeat if viewCount is greater than 1:1)
        var proxy = proxies[proxyIndex % proxies.length]
        // TODO: pull seconds calculation here, parametarize
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
        console.log(proxy, viewResult, successes) // TODO: pass seconds back to renderer to display

        // send special message if we have hit our desired number of views
        if (successes >= viewCount) {
            console.log('complete')
            await pool.terminate(true)
            return
        }

        proxyIndex += 1

        // recurse (requeue) if we failed
        if (!viewResult) {
            pool.queue(async (viewVideo) => {
                await runViewVideo(event, pool, viewVideo, proxyIndex)
            })
        }
    }
}
main()

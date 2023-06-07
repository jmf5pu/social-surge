const { parseProxies } = require('./utils.js')
const { spawn, Pool, Worker, Thread } = require('threads')

const searchString = String(process.env.SEARCHSTRING)
const viewCount = Number(process.env.VIEWCOUNT)
const minViewS = Number(process.env.MINVIEWS)
const maxViewS = Number(process.env.MAXVIEWS)
const workerCount = Number(process.env.WORKERCOUNT)
const proxies = process.env.PROXIES.split(/\r?\n/)
var successes = 0

function getRandomNumber(min, max) {
    // generates a random number between the specified max and min (inclusive))
    return min + Math.floor(Math.random() * (max + 1 - min))
}

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
        const proxy = proxies[proxyIndex % proxies.length]
        const viewTimeMs = getRandomNumber(
            minViewS * 1000,
            maxViewS * 1000
        )
        console.log('started', proxy)
        viewResult = await viewVideo(
            searchString,
            minViewS,
            maxViewS,
            proxy,
            viewTimeMs,
            'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe' // TODO: figure out what to do with this param
        )

        // process run results
        successes += viewResult

        // send individual run results
        console.log(
            'completed',
            proxy,
            viewResult,
            viewTimeMs ? viewTimeMs : 0
        )

        // send special message if we have hit our desired number of views
        if (successes >= viewCount) {
            console.log('all views completed')
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

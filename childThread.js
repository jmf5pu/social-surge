const { parseProxies } = require('./utils.js')
const { spawn, Pool, Worker, Thread } = require('threads')

async function main(event) {
    searchString = String(process.env.SEARCHSTRING)
    viewCount = Number(process.env.VIEWCOUNT)
    minViewS = Number(process.env.MINVIEWS)
    maxViewS = Number(process.env.MAXVIEWS)
    workerCount = Number(process.env.WORKERCOUNT)
    proxies = process.env.PROXIES
    proxyIndex = Number(process.env.PROXYINDEX)

    pool = Pool(
        () => spawn(new Worker('./viewbot/export-viewer')),
        workerCount
    )

    // enqueue our desired number of views, failures will requeue themselves

    // enqueue our desired number of views, failures will requeue themselves
    for (i = 0; i < viewCount * 2; i++) {
        proxyIndex = i
        pool.queue(async (viewVideo) => {
            await runViewVideo(
                event,
                pool,
                viewVideo,
                searchString,
                minViewS,
                maxViewS,
                proxyIndex
            )
        })
    }

    // attempts to viewVideo once
    async function runViewVideo(
        event,
        pool,
        viewVideo,
        searchString,
        minViewS,
        maxViewS,
        proxyIndex
    ) {
        // select proxy (repeat if viewCount is greater than 1:1)
        let proxy = proxies[proxyIndex % proxies.length]
        viewResult = await viewVideo(
            (searchString = searchString),
            (minViewS = minViewS),
            (maxViewS = maxViewS),
            (proxy = proxy),
            (chromiumPath =
                'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe') // TODO: figure out what to do with this param
        )

        // update object and send results to renderer process
        process.env.SUCCESSES += viewResult

        // send special message if we have hit our desired number of views
        if (process.env.SUCCESSES >= process.env.VIEWCOUNT) {
            console.log('complete')
            return
        }

        // otherwise send indiviudal result data
        console.log(proxy, viewResult) // TODO: figure out why proxy isn't as expected here

        // recurse (requeue) if we failed
        if (!viewResult) {
            pool.queue(async (viewVideo) => {
                await runViewVideo(
                    event,
                    pool,
                    viewVideo,
                    searchString,
                    minViewS,
                    maxViewS,
                    (proxyIndex += 1)
                )
            })
        }
    }
}
main()

const { parseProxies } = require('./utils.js')
const { spawn, Pool, Worker, Thread } = require('threads')

async function main(event) {
    searchString = process.env.SEARCHSTRING
    viewCount = process.env.VIEWCOUNT
    minViewS = process.env.MINVIEWS
    maxViewS = process.env.MAXVIEWS
    workerCount = process.env.WORKERCOUNT
    proxies = process.env.PROXIES
    proxyIndex = process.env.PROXYINDEX

    proxies = parseProxies(proxies)

    pool = Pool(
        () => spawn(new Worker('./viewbot/export-viewer')),
        workerCount
    )

    // enqueue our desired number of views, failures will requeue themselves
    for (i = 0; i < viewCount; i++) {
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
        proxyIndex += 1
        // event.reply('individual-result', viewResult) TODO: figure out how to make process bar work

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
                    proxyIndex
                )
            })
        }
    }
}

main()

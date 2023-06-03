const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function clickAndWait(page, targetSelector, waitMs, clickCount = 1) {
    /*
    clicks a selector on the screen and and then waits
    TODO:
    something funny going on here, get not implemented error if I swap instructions order below
    */
    await page.click(targetSelector, { clickCount: clickCount })
    await sleep(waitMs)
}

async function clickAndWaitIfPresent(
    page,
    targetSelector,
    waitMs,
    clickCount = 1
) {
    /*
    clicks the selector if present, will NOT fail loudly if not present
    */
    try {
        await clickAndWait(page, targetSelector, waitMs, clickCount)
    } catch {}
}

function getRandomNumber(min, max) {
    /*
generates a random number between the specified max and min (inclusive))
*/
    return min + Math.floor(Math.random() * (max + 1 - min))
}

async function viewVideo(
    searchString,
    minViewS,
    maxViewS,
    proxy,
    chromiumPath
) {
    // setup
    puppeteer.use(StealthPlugin())
    const browser = await puppeteer.launch({
        headless: false,
        executablePath: chromiumPath,
        args: [
            '--window-position=-1000,-1000',
            '--disable-dev-shm-usage',
            `--proxy-server=${proxy}`,
        ],
    })

    try {
        // get view duration in ms
        var viewTimeMs = getRandomNumber(minViewS * 1000, maxViewS * 1000)

        const page = (await browser.pages())[0]

        await page.goto(
            'https://www.youtube.com/results?search_query=' + searchString
        )
        await sleep(6000)

        // click accept on cookies popup if present
        await clickAndWaitIfPresent(
            page,
            '[aria-label="Accept the use of cookies and other data for the purposes described"]',
            5000
        )

        // click first result
        await clickAndWait(page, '#title-wrapper', 2000)

        // view video
        await sleep(viewTimeMs)

        // cleanup
        await browser.close()
        return true
    } catch (err) {
        await browser.close()
        return false
    }
}

// export
module.exports = {
    sleep,
    getRandomNumber,
    clickAndWait,
    clickAndWaitIfPresent,
    viewVideo,
}

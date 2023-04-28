const puppeteer = require('puppeteer-extra')
const StealthPlugin = require('puppeteer-extra-plugin-stealth')

async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function clickAndWait(
    page,
    target_selector,
    wait_ms,
    click_count = 1
) {
    /*
    clicks a selector on the screen and and then waits
    if_present: check if selector is present before clicking
    */
    await page.click(target_selector, { clickCount: click_count })
    await sleep(wait_ms)
}

async function clickAndWaitIfPresent(
    page,
    target_selector,
    wait_ms,
    click_count = 1
) {
    /*
    clicks the selector if present, will NOT fail loudly if not present
    */
    try {
        await clickAndWait(page, target_selector, wait_ms, click_count)
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
        args: ['--disable-dev-shm-usage', `--proxy-server=${proxy}`],
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
        console.log(err.message)
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
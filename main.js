const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { spawn, Pool, Worker } = require('threads')
const { parseProxies } = require('./utils.js')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'
let mainWindow

// Create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Pro Viewer',
        width: isDev ? 1000 : 500, // extend window for dev console
        height: 600,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'), // run preload script
        },
    })

    // open dev tools if not in production environment
    if (isDev) {
        mainWindow.webContents.openDevTools()
    }
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'))
}

// Menu template
const menu = [
    {
        role: 'fileMenu',
    },
]

// App is ready
app.whenReady().then(() => {
    createMainWindow()

    // Implement Menu
    const mainMenu = Menu.buildFromTemplate(menu)
    Menu.setApplicationMenu(mainMenu)
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })
})

// activates on exit button press
ipcMain.on('exit', () => {
    app.quit()
})

// quit if all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

/**
 * args: RunInfo object
 */
ipcMain.on('asynchronous-message', async (event, runInfo) => {
    runInfo.proxies = parseProxies(runInfo.proxies)

    const pool = Pool(
        () => spawn(new Worker('./viewbot/export-viewer')),
        runInfo.workerCount
    )

    // enqueue our desired number of views, failures will requeue themselves
    for (i = 0; i < runInfo.viewCount; i++) {
        pool.queue(async (viewVideo) => {
            await runViewVideo(event, pool, viewVideo, runInfo)
        })
    }

    // clean up thread pool
    await pool.completed()
    await pool.terminate()
})

// attempts to viewVideo once
async function runViewVideo(event, pool, viewVideo, runInfo) {
    // select proxy (repeat if viewCount is greater than 1:1)
    let proxy =
        runInfo.proxies[runInfo.currentAttempt % runInfo.proxies.length]
    console.log(`trying proxy: ${proxy}`)
    viewResult = await viewVideo(
        (searchString = runInfo.searchString),
        (minViewS = runInfo.minViewS),
        (maxViewS = runInfo.maxViewS),
        (proxy = proxy),
        (chromiumPath =
            'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe') // TODO: figure out what to do with this param
    )

    // update object and send results to renderer process
    runInfo.currentAttempt += 1
    event.reply('asynchronous-reply', viewResult)

    // recurse (requeue) if we failed
    if (!viewResult) {
        pool.queue(async (viewVideo) => {
            await runViewVideo(event, pool, viewVideo, runInfo)
        })
    }
}

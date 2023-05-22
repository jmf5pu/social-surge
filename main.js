const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { spawn, Pool, Worker } = require('threads')
const { parseProxies } = require('./utils.js')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'
var pool = Pool(() => {})
var currentProgress = -1
let mainWindow


// Create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Pro Viewer',
        width: isDev ? 1000 : 500, // extend window for dev console
        height: 600,
        frame: false,
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

// exit
ipcMain.on('exit', () => {
    app.quit()
})

// minimize
ipcMain.on('minimize-window', () => {
    mainWindow.minimize()
})

// quit if all windows are closed
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

// starts the run
ipcMain.on('run-start', async (event, runInfo) => {
    runInfo.proxies = parseProxies(runInfo.proxies)

    pool = Pool(
        () => spawn(new Worker('./viewbot/export-viewer')),
        runInfo.workerCount
    )

    // enqueue our desired number of views, failures will requeue themselves
    saveAndSetProgress(0.0)
    for (i = 0; i < runInfo.viewCount; i++) {
        runInfo.proxyIndex = i
        pool.queue(async (viewVideo) => {
            await runViewVideo(event, pool, viewVideo, runInfo)
        })
    }

    // cleanup pool after completion
    await pool.completed()
    await pool.terminate()

    // remove progress bar (run complete)
    saveAndSetProgress(-1.0)

    // notify renderer process
    event.reply('run-complete')
})

ipcMain.on('run-cancel', async (event) => {
    console.log('\n\nCANCELLING RUN\n\n')

    // terminate existing thread pool, force-terminating tasks
    await pool.terminate(true)
    pool = Pool(() => {})
    mainWindow.setProgressBar(-1)
})

// attempts to viewVideo once
async function runViewVideo(event, pool, viewVideo, runInfo) {
    // select proxy (repeat if viewCount is greater than 1:1)
    let proxy =
        runInfo.proxies[runInfo.proxyIndex % runInfo.proxies.length]
    viewResult = await viewVideo(
        (searchString = runInfo.searchString),
        (minViewS = runInfo.minViewS),
        (maxViewS = runInfo.maxViewS),
        (proxy = proxy),
        (chromiumPath =
            'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe') // TODO: figure out what to do with this param
    )

    // update object and send results to renderer process
    runInfo.proxyIndex += 1
    event.reply('individual-result', viewResult)

    // update icon progress bar
    if(viewResult){
        saveAndSetProgress(currentProgress + (1/runInfo.viewCount))
    }

    // recurse (requeue) if we failed
    if (!viewResult) {
        pool.queue(async (viewVideo) => {
            await runViewVideo(event, pool, viewVideo, runInfo)
        })
    }
}

// sets icon progress bar value and saves to global variable
function saveAndSetProgress(value){
    console.log(`setting progress bar to ${value}`)
    currentProgress = value
    mainWindow.setProgressBar(value)
}
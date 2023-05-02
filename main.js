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
    console.log(runInfo.proxies)
    runInfo.proxies = parseProxies(runInfo.proxies)

    const pool = Pool(
        () => spawn(new Worker('./viewbot/export-viewer')),
        runInfo.workerCount
    )

    for (i = 0; i < runInfo.viewCount; i++) {
        // select proxy (repeat if viewCount is greater than 1:1)
        proxy = runInfo.proxies[runInfo.viewCount % runInfo.proxies.length]

        pool.queue(async (viewVideo) => {
            viewResult = await viewVideo(
                (searchString = runInfo.searchString),
                (minViewS = runInfo.minViewS),
                (maxViewS = runInfo.maxViewS),
                (proxy = proxy), // TODO: fill in proxy here
                (chromiumPath =
                    'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe') // TODO: figure out what to do with this param
            )
            // send real-time results back to renderer
            event.reply('asynchronous-reply', viewResult)
        })
    }

    // clean up thread pool
    await pool.completed()
    await pool.terminate()
})

const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { spawn, Pool, Worker } = require('threads')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'
let mainWindow

// Create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'pro viewer',
        width: isDev ? 1000 : 500, // extend window\ for dev console
        height: 600,
        webPreferences: {
            // nodeIntegration: true,
            contextIsolation: true,
            // enableRemoteModule: true,
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
 * args: [searchString, viewCount, minViewS, maxViewS, workerCount]
 */
ipcMain.on('asynchronous-message', async (event, args) => {
    console.log(args)
    viewCount = args[1]
    workerCount = args[4]
    const pool = Pool(
        () => spawn(new Worker('./viewbot/export')),
        workerCount
    )
    for (i = 0; i < viewCount; i++) {
        pool.queue(async (viewVideo) => {
            viewResult = await viewVideo(
                (searchString = args[0]),
                (minViewS = args[2]),
                (maxViewS = args[3]),
                (proxy = ''), // TODO: fill in proxy here
                (chromiumPath =
                    'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe') // TODO: figure out what to do with this param
            )
            // send real-time results back to renderer
            event.reply('asynchronous-reply', viewResult)
        })
        // TODO: handle results
    }

    // clean up thread pool
    await pool.completed()
    await pool.terminate()
})

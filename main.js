const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { spawn, Pool, Worker, Thread } = require('threads')
const { parseProxies } = require('./utils.js')
const path = require('path')
const isDev = false //process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'
const dimensions = [385, 475] // width, height
const childProcessSpawn = require('child_process').spawn
let child_process = null
let pool = Pool(() => {})
let currentProgress = -1
let mainWindow

// Create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'ViewBoostPro',
        width: isDev ? dimensions[0] + 500 : dimensions[0], // extend window for dev console
        height: 475,
        frame: false,
        resizable: false,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, 'preload.js'),
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
    process.env.SEARCHSTRING = runInfo.searchString;
    process.env.VIEWCOUNT = runInfo.viewCount;
    process.env.MINVIEWS = runInfo.minViewS;
    process.env.MAXVIEWS = runInfo.maxViewS;
    process.env.WORKERCOUNT = runInfo.workerCount;
    process.env.PROXIES = runInfo.proxies;
    process.env.PROXYINDEX = runInfo.proxyIndex
    child_process = childProcessSpawn('node', ['childThread.js'], {
        stdio: 'inherit',
    })

    process.env.SEARCHSTRING = null
    process.env.VIEWCOUNT = null
    process.env.MINVIEWS = null
    process.env.MAXVIEWS = null
    process.env.WORKERCOUNT = null
    process.env.PROXIES = null
    process.env.PROXYINDEX = null
})

ipcMain.on('run-cancel', async (event) => {
    child_process.kill()

    // force terminate thread pool reset
    // await pool.terminate(true)
    // pool = Pool(() => {})
    mainWindow.setProgressBar(-1)
})

// sets icon progress bar value and saves to global variable
function saveAndSetProgress(value) {
    console.log(`setting progress bar to ${value}`)
    currentProgress = value
    mainWindow.setProgressBar(value)
}

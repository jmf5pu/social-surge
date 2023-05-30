const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { spawn, Pool, Worker, Thread } = require('threads')
const { parseProxies } = require('./utils.js')
const path = require('path')
const isDev = false //process.env.NODE_ENV !== 'production'
//const isMac = process.platform === 'darwin'
const dimensions = [385, 475] // width, height
const childProcessSpawn = require('child_process').spawn
let childProcess
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
    process.env.SEARCHSTRING = String(runInfo.searchString)
    process.env.VIEWCOUNT = Number(runInfo.viewCount)
    process.env.MINVIEWS = Number(runInfo.minViewS)
    process.env.MAXVIEWS = Number(runInfo.maxViewS)
    process.env.WORKERCOUNT = Number(runInfo.workerCount)
    process.env.PROXIES = runInfo.proxies
    process.env.PROXYINDEX = Number(runInfo.proxyIndex)
    process.env.SUCCESSES = 0
    currentProgress = 0
    childProcess = childProcessSpawn('node', ['childThread.js'])
    process.env.SEARCHSTRING = null
    process.env.VIEWCOUNT = null
    process.env.MINVIEWS = null
    process.env.MAXVIEWS = null
    process.env.WORKERCOUNT = null
    process.env.PROXIES = null
    process.env.PROXYINDEX = null
    process.env.SUCCESSES = 0
})

ipcMain.on('run-complete', async (event) => {
    killChildAndUpdateProgress()
})

// TODO: No longer works because IPC doesn't work with child process
ipcMain.on('individual-result', (viewResult) => {
    console.log(`result in main.js: ${viewResult}`)

    // send to renderer.js
    ipcMain.send('individual-result', viewResult)

    if (data.viewResult) {
        saveAndSetProgress((currentProgress += 1 / process.env.VIEWCOUNT))
    }
    // TODO: handle updating UI with a view failure here
})

// sets icon progress bar value and saves to global variable
function saveAndSetProgress(value) {
    //console.log(`setting progress bar to ${value}`)
    currentProgress = value
    mainWindow.setProgressBar(value)
}

function killChildAndUpdateProgress() {
    childProcess.kill()
    mainWindow.setProgressBar(-1)
}

// setup stdout listeners for child_process thread
ipcMain.on('run-start', async (event, runInfo) => {
    childProcess.stdout.on('data', (data) => {
        console.log('Child process stdout:', data.toString()) // TODO: use ipc to send results to renderer
    })

    childProcess.stderr.on('data', (data) => {
        console.error('Child process stderr:', data.toString())
    })

    childProcess.on('close', (code) => {
        console.log(`Child process exited with code ${code}`)
    })
})

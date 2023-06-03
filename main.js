const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const { spawn, Pool, Worker, Thread } = require('threads')
const { parseProxies } = require('./utils.js')
const path = require('path')
const isDev = true //process.env.NODE_ENV !== 'production'
//const isMac = process.platform === 'darwin'
const dimensions = [385, 475] // width, height
const childProcessSpawn = require('child_process').spawn
var currentProgress = -1
var childProcess
var mainWindow

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
    process.env.SUCCESSES = 0
    currentProgress = 0
    console.log('starting child')
    childProcess = childProcessSpawn('node', ['childThread.js'])
})

ipcMain.on('run-complete', async (event) => {
    cleanupRun()
})

// sets icon progress bar value and saves to global variable
function saveAndSetProgress(value) {
    currentProgress = value
    mainWindow.setProgressBar(value)
}

function cleanupRun() {
    // terminate child puppeteer process
    childProcess.kill()

    // reset progress bar
    saveAndSetProgress(-1)

    // clean up environment variables
    process.env.SEARCHSTRING = null
    process.env.VIEWCOUNT = null
    process.env.MINVIEWS = null
    process.env.MAXVIEWS = null
    process.env.WORKERCOUNT = null
    process.env.PROXIES = null
    process.env.SUCCESSES = 0
}

// setup stdout listeners for child_process thread
ipcMain.on('run-start', async (event, runInfo) => {
    childProcess.stdout.on('data', (data) => {
        childOutput = data.toString()
        console.log('Child process stdout:', childOutput)

        // check if we have hit out desired number of views
        if (childOutput == 'complete') {
            cleanupRun()
            return
        }

        // send results to renderer over IPC
        dataArray = childOutput.split(' ')

        ipAddress = dataArray[0].trim()
        viewResult = dataArray[1].trim() === 'false' ? false : true

        mainWindow.webContents.send('individual-result', viewResult)

        // update icon progress bar
        saveAndSetProgress(
            currentProgress + viewResult / Number(process.env.VIEWCOUNT)
        )
    })

    // Listen for data on stderr (errors)
    childProcess.stderr.on('data', (data) => {
        console.error(`Child Process stderr: ${data}`)
    })
})

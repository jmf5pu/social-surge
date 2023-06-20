const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const isDev = false
//const isMac = process.platform === 'darwin'
const dimensions = [370, 370] // width, height
const childProcessSpawn = require('child_process').spawn
var currentProgress = -1
var childProcess
var mainWindow

// Create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'Social Surge',
        width: isDev ? dimensions[0] + 500 : dimensions[0], // extend window for dev console
        height: dimensions[1],
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

ipcMain.on('run-complete', async (event) => {
    cleanupRun()
})

// sets icon progress bar value and saves to global variable
function saveAndSetProgress(value) {
    currentProgress = value
    mainWindow.setProgressBar(value)
}

function cleanupRun() {
    // reset progress bar
    saveAndSetProgress(-1)

    // go to next page
    mainWindow.webContents.send('run-complete')

    // terminate child puppeteer process
    childProcess.kill()

    // clean up environment variables
    process.env.SEARCHSTRING = null
    process.env.VIEWCOUNT = null
    process.env.MINVIEWS = null
    process.env.MAXVIEWS = null
    process.env.WORKERCOUNT = null
    process.env.CHROMIUMPATH = null
    process.env.PROXIES = null
    process.env.SUCCESSES = 0
}

// stat run and setup stdout listeners for child_process thread
ipcMain.on('run-start', async (event, runInfo) => {
    console.log(`recieved: ${runInfo.chromiumPath}`)
    process.env.SEARCHSTRING = String(runInfo.searchString)
    process.env.VIEWCOUNT = Number(runInfo.viewCount)
    process.env.MINVIEWS = Number(runInfo.minViewS)
    process.env.MAXVIEWS = Number(runInfo.maxViewS)
    process.env.WORKERCOUNT = Number(runInfo.workerCount)
    process.env.CHROMIUMPATH = String(runInfo.chromiumPath)
    console.log(`setting: ${process.env.CHROMIUMPATH}`)
    process.env.PROXIES = runInfo.proxies
    process.env.SUCCESSES = 0
    currentProgress = 0
    childProcess = childProcessSpawn('node', ['childThread.js'])

    const onData = (data) => {
        childOutput = data.toString()
        console.log('[Child] ', childOutput)

        // Check if we have hit our desired number of views
        if (childOutput.includes('all views completed')) {
            cleanupRun()
            childProcess.stdout.removeListener('data', onData) // Remove the event listener
            return
        }

        // parse responses from child process
        dataArray = childOutput.split(' ')
        if (dataArray[0].trim() === 'started') {
            mainWindow.webContents.send(
                'individual-view-start',
                dataArray[1]
            )
            return
        } else if (dataArray[0].trim() === 'completed') {
            ipAddress = dataArray[1].trim()
            viewResult = dataArray[2].trim() === 'false' ? false : true
            viewTimeMs = Number(dataArray[3].trim())
        }

        mainWindow.webContents.send(
            'individual-result',
            ipAddress,
            viewResult,
            viewTimeMs
        )

        // Update icon progress bar
        saveAndSetProgress(
            currentProgress + viewResult / Number(process.env.VIEWCOUNT)
        )
    }

    childProcess.stdout.on('data', onData)

    // Listen for data on stderr (errors)
    childProcess.stderr.on('data', (data) => {
        console.error(`[Child Error] ${data}`)
    })
})

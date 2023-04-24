const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV !== 'production'
const isMac = process.platform === 'darwin'
let mainWindow

var viewVideo = require('./viewbot/viewer.js')

// Create main window
function createMainWindow() {
    mainWindow = new BrowserWindow({
        title: 'learning electron',
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

ipcMain.on('asynchronous-message', async (event, arg) => {
    console.log(arg)
    result = await viewVideo(
        (searchString = arg[0]),
        (minViewS = arg[1]),
        (maxViewS = arg[2]),
        (proxy = ''),
        (chromiumPath =
            'C:/Users/Justin/.cache/puppeteer/chrome/win64-1056772/chrome-win/chrome.exe')
    )
    // TODO: implement thread pool here
    event.reply('asynchronous-reply', result)
})

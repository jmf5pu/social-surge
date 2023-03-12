const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const isDev = process.env.NODE_ENV !== 'production';
const isMac = process.platform === 'darwin';

let mainWindow;


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
    });

    // open dev tools if not in production environment
    if (isDev) {
        mainWindow.webContents.openDevTools();
    }
    mainWindow.loadFile(path.join(__dirname, './renderer/index.html'));
}
  

// Menu template
const menu = [
    {
        role: 'fileMenu',
    },
];
  
// App is ready
app.whenReady().then(() => {
    createMainWindow()

    // Implement Menu
    const mainMenu = Menu.buildFromTemplate(menu);
    Menu.setApplicationMenu(mainMenu);
        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) {
                createMainWindow()
            }
        });
});
  
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
    }
})

ipcMain.on('asynchronous-message', (event, arg) => {
    console.log(arg) // prints "ping" in the Node console
    // works like `send`, but returning a message back
    // to the renderer that sent the original message
    //event.sender.send('synchronous-reply','hello')
    event.reply('asynchronous-reply', arg)
})
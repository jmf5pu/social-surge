const { contextBridge, ipcRenderer } = require('electron')
const Store = require('electron-store');
const store = new Store()

// expose ipcRenderer (communication between main & renderer)
contextBridge.exposeInMainWorld('ipcRenderer', {
    send: (channel, data) => ipcRenderer.send(channel, data),
    on: (channel, func) =>
        ipcRenderer.on(channel, (event, ...args) => func(event, ...args)),
})

// expose store (local storage for user settings)
contextBridge.exposeInMainWorld('electronStore', {
    get: (key) => store.get(key),
    set: (key, value) => store.set(key, value),
    delete: (key) => store.delete(key),
})

// Expose a method to get data from the electron-store in the renderer process
contextBridge.exposeInMainWorld('electronStoreGetData', () => {
    return ipcRenderer.sendSync('electron-store-get-data');
  });

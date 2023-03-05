// const os = require('os');
// const path = require('path');
// const { contextBridge, ipcRenderer } = require('electron');

// contextBridge.exposeInMainWorld('os', {
//   homedir: () => os.homedir(),
// });

// contextBridge.exposeInMainWorld('path', {
//   join: (...args) => path.join(...args),
// });

// contextBridge.exposeInMainWorld('ipcRenderer', {
//   send: (channel, data) => ipcRenderer.send(channel, data),
//   on: (channel, func) =>
//     ipcRenderer.on(channel, (event, ...args) => func(...args)),
// });

// You can also put expose this code to the renderer
// process with the `contextBridge` API

const { ipcRenderer } = require('electron')

ipcRenderer.on('asynchronous-reply', (_event, arg) => {
  console.log(arg) // prints "pong" in the DevTools console
})
ipcRenderer.send('asynchronous-message', 'ping')
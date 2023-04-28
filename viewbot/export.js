// separate file so this is never called by the main thread
// this lets workers in main.js access it
const { viewVideo } = require('./viewer')
const { expose } = require('threads/worker')
expose(viewVideo)
const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const electron = require('electron') //eslint-disable-line
const debug = require('electron-debug')
const chokidar = require('chokidar')

// Interface for the render process
module.exports = {
  getColeFile,
}

// Chokidar is used to watch for file changes and uses electron
// connect to reload or refresh
const chokidarSettings = { ignored: /[\/\\]\./, persistent: true }
// Watch the main process files
chokidar.watch(__dirname, chokidarSettings).on('change', () => {
  // electronConnect.refresh()
})
// Watch the render process files
const renderGlob = path.join(__dirname, '../render')
chokidar.watch(renderGlob, chokidarSettings).on('change', () => {
  // electronConnect.reload()
})

// Easy way to have dev tools open right away
debug({
  enabled: true,
  showDevTools: true,
  devToolsMode: 'previous',
})

// Build the render process
let mainWindow
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true },
  })
  mainWindow.loadFile(`${__dirname}/../render/index.html`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
})

// This lets the render function open files
async function getColeFile() {
  const files = dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Cole Files', extensions: ['cole'] }],
    title: 'Open Cole File',
  })

  if (!files) return

  const [file] = files

  return file
}

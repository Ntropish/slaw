const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const electron = require('electron') //eslint-disable-line
const chokidar = require('chokidar')

// Interface for the render process
module.exports = {
  getColeFile,
}

// Chokidar is used to watch for file changes to trigger reloads
const chokidarSettings = { ignored: /[\/\\]\./, persistent: true }

// Watch the main process files (not implemented)
// chokidar.watch(__dirname, chokidarSettings).on('change', () => {
// })

// Watch the render process files
const setupRefresh = browserWindow => {
  const renderGlob = path.join(__dirname, '../render')

  chokidar.watch(renderGlob, chokidarSettings).on('change', () => {
    // browserWindow.loadFile(`${__dirname}/../render/index.html`)
    if (isNotProd()) browserWindow.webContents.openDevTools()
  })
}

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
    if (isNotProd()) mainWindow.webContents.openDevTools()
  })

  setupRefresh(mainWindow)
})

const isNotProd = () => process.env.NODE_ENV !== 'production'

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

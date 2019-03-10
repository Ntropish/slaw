const { app, BrowserWindow, dialog } = require('electron')
const path = require('path')
const electron = require('electron') //eslint-disable-line
const webpack = require('webpack')
const webpackDevSeerver = require('webpack-dev-server')

let config = require('../../config/webpack.config.js')
// Interface for the render process
module.exports = {
  getColeFile,
}

const compiler = webpack(require('../../config/webpack.config.js'))

const devServer = new webpackDevSeerver(compiler, {
  hot: true,
  ...config.devServer,
})
devServer.listen(8080)

// compiler.watch({}, (err, stats) => {
//   BrowserWindow.loadFile
// })

// Build the render process
let mainWindow
app.on('ready', () => {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true },
  })
  mainWindow.loadURL(`http://localhost:8080/`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isNotProd()) mainWindow.webContents.openDevTools()
  })
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

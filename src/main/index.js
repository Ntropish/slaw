const { app, BrowserWindow, dialog } = require('electron')
const webpack = require('webpack')
const webpackDevSeerver = require('webpack-dev-server')

const config = require('../../config/webpack.config.js')
const options = {
  hot: true,
  ...config.devServer,
  host: 'localhost',
}

webpackDevSeerver.addDevServerEntrypoints(config, options)
const compiler = webpack(config)
const devServer = new webpackDevSeerver(compiler, options)
devServer.listen(8080, 'localhost', () => {
  console.log('Dev server listening on 8080') // eslint-disable-line
})

// Build the render process
let mainWindow
app.on('ready', () => {
  BrowserWindow.addDevToolsExtension(
    'C:/Users/Justin/AppData/Local/Google/Chrome/User Data/Default/Extensions/nhdogjmejiglipccpnnnanhbledajbpd/4.1.5_0',
  )
  mainWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    // frame: false,
    webPreferences: { nodeIntegration: true },
  })

  mainWindow.loadURL(`http://localhost:8080/`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    if (isNotProd()) mainWindow.webContents.openDevTools()
  })
})

// Interface for the render process
module.exports = {
  getColeFile,
}

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

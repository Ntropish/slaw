const { app, BrowserWindow, dialog } = require('electron')

module.exports = {
  getColeFile,
}

let mainWindow

app.on('ready', async () => {
  mainWindow = new BrowserWindow({
    show: false,
    webPreferences: { nodeIntegration: true },
  })
  mainWindow.loadFile(`${__dirname}/../render/index.html`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })
})

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

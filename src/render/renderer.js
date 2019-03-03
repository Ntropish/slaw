const fs = require('fs-extra')
const path = require('path')
const addon = require('../../build/Release/engine')

console.log(addon)

let filePath = ''
let originalContent = ''

const { remote } = require('electron')
const mainProcess = remote.require('../main/index.js')
remote.getCurrentWindow().toggleDevTools()

const fileDump = document.querySelector('#file-dump')

const buttons = makeButtons(['open'])

buttons.open.addEventListener('click', onClickOpen)

async function onClickOpen() {
  const file = await mainProcess.getColeFile()

  let content

  try {
    content = JSON.parse((await fs.readFile(file)).toString())
    filePath = file
    originalContent = content
  } catch (e) {
    content = 'File not JSON :['
  }

  fileDump.innerHTML = `<pre><code>${JSON.stringify(content)}</pre></code>`

  updateUserInterface()
}

function updateUserInterface() {
  let title = 'Slaw'
  if (filePath) {
    title = `${path.basename(filePath)} - ${title}`
  }
  document.title = title
}

function makeButtons(buttonNames) {
  const buttons = {}

  for (let name of buttonNames) {
    buttons[name] = document.querySelector(`#${name}-button`)
  }

  return buttons
}

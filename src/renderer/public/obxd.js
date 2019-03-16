// OBXD WAM Controller
// Jari Kleimola 2017-18 (jari@webaudiomodules.org)

import WAMController from './WAMController'

const origin = 'https://webaudiomodules.org/'

const title = 'webOBXD'

const banklist = [
  'ABS-OBXD-Custom Shop v1.fxb',
  'Breeze_Meat-n-Potatoes.fxb',
  'Breeze_Meat-n-Potatoes_rev1.fxb',
  'Breeze_Meat-n-Potatoes_rev3b-ALPHA.fxb',
  'Breeze_Meat-n-Potatoes_rev3b.fxb',
  'factory.fxb',
  'FMR - OB-Xa Patch Book.fxb',
  'IW_OBXD Bank 1_Rev 1.11.fxb',
  'Joel.fxb',
  'Kujashi-OBXD-Bank.fxb',
  'OBXD Init Bank.fxb',
  'OBXD - KVR Community Bank - Part 1.fxb',
  'OBXD - KVR Community Bank - Part 2.fxb',
  'OBXd Bank by Rin_Elyran.fxb',
  'OBXD_AZurStudio.fxb',
  'Xenos Soundworks.fxb',
]

export default class OBXD extends WAMController {
  constructor(actx, options) {
    options = options || {}
    options.numberOfInputs = 0
    options.numberOfOutputs = 1
    options.ioConfiguration = { outputs: [1] }

    super(actx, 'OBXD', options)
    this._gui = document.createElement('wam-obxd')
    this._gui.origin = origin
    this._gui.plug = this

    this.banks = banklist
    this.patches = []
    this.bank = []
    if (!this.context) this.context = actx
  }

  get defpatch() {
    return 2
  }
  get gui() {
    return this._gui
  }

  static async importScripts({ audioWorklet }) {
    await audioWorklet.addModule(`${origin}synths/wasm/obxd/obxd-wasm.js`)
    await audioWorklet.addModule(`${origin}synths/wasm/obxd/obxd-loader.js`)
    await audioWorklet.addModule(`${origin}synths/wasm/obxd/obxd-awp.js`)
  }

  async getState() {
    console.dir(this.patch)
    let state = Float32Array.from(this.patch)
    return new Blob([state], { type: 'application/octet-stream' })
  }

  setState(blob) {
    let reader = new FileReader()
    reader.addEventListener('loadend', () => {
      let state = new Float32Array(reader.result)
      let patch = Array.from(state)
      console.dir(patch)
      this.setPatch(patch)
    })
    if (blob.type === 'application/octet-stream') reader.readAsArrayBuffer(blob)
  }

  setPatch(patch) {
    super.setPatch(Float32Array.from(patch).buffer)
    if (this._gui.setPatch) this._gui.setPatch(patch)
  }

  async loadBank(filename) {
    const url = origin + 'presets/obxd/' + filename

    const resp = fetch(url)
    const buffer = await resp.arrayBuffer()

    this.patches = []
    this.bank = []
    const arr = new Uint8Array(buffer)

    let s = ''
    try {
      s = String.fromCharCode(...arr.subarray(168, arr.length - 1))
    } catch (e) {
      s = new TextDecoder('utf-8').decode(arr.subarray(168, arr.length - 1))
    }

    console.log(s)

    var i1 = s.indexOf('<programs>')
    var i2 = s.indexOf('</programs>')
    if (i1 > 0 && i2 > 0) {
      s = s.slice(i1 + 10, i2)
      i2 = 0
      i1 = s.indexOf('programName')
      var patchCount = 0
      while (i1 > 0 && patchCount++ < 128) {
        var n1 = s.indexOf('"', i1)
        var n2 = s.indexOf('"', n1 + 1)
        if (n1 < 0 || n2 < 0) break
        self.patches.push(s.slice(n1 + 1, n2))
        i2 = s.indexOf('/>', n2)
        if (i2 > 0) {
          var tokens = s.slice(n2 + 2, i2).split(' ')
          if (tokens.length == 71) {
            const patch = tokens.map(token => parseFloat(token.split('"')[1]))
            self.bank.push(patch)
          }
        }
        i1 = s.indexOf('programName', i2)
      }
    }

    return self.patches
  }
}

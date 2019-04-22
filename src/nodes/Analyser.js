import Brain from './Brain'
import Interface from 'components/nodeInterfaces/Analyser.vue'

export default class Analyser extends Brain {
  constructor(transporter, { id: nodeId, data }) {
    super(transporter)
    this.analyser = transporter.context.createAnalyser()
    this.nodeId = nodeId
    this.analyser.fftSize = 2048
    var bufferLength = this.analyser.frequencyBinCount
    var dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)

    // transporter.on('positionUpdate', e => {
    //   console.log(e)
    // })
  }
  getData() {
    var bufferLength = this.analyser.frequencyBinCount
    var dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)
    return dataArray
  }
}

Analyser.title = 'Analyser'

Analyser.prototype.inputs = [
  {
    type: 'buffer',
    args: n => [n.analyser],
  },
]

Analyser.prototype.outputs = []

Analyser.interface = Interface

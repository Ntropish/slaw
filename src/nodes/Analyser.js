import Brain from './Brain'
import Interface from 'components/nodeInterfaces/Analyser.vue'
import { store } from '../index'

export default class Analyser extends Brain {
  constructor(transporter, { id: nodeId, data }) {
    super(transporter)
    this.analyser = transporter.context.createAnalyser()
    this.nodeId = nodeId
    this.analyser.fftSize = 2048
    var bufferLength = this.analyser.frequencyBinCount
    var dataArray = new Uint8Array(bufferLength)
    this.analyser.getByteTimeDomainData(dataArray)
  }
}

Analyser.title = 'Analyser'

Analyser.prototype.inputs = []

Analyser.prototype.outputs = []

Analyser.interface = Interface

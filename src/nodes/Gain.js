import Brain from './Brain'

export default class Gain extends Brain {
  constructor(transporter) {
    super(transporter)
    this.gainNode = transporter.context.createGain()
    this.gainNode.gain.value = 0
  }
}

Gain.title = 'Gain'

Gain.prototype.inputs = [
  {
    type: 'buffer',
    args: n => [n.gainNode],
  },
  {
    type: 'buffer',
    args: n => [n.gainNode.gain],
  },
]

Gain.prototype.outputs = [
  {
    type: 'buffer',
    connect: (n, node, index) => {
      n.gainNode.connect(...node.inputs[index].args(node))
    },
    disconnect: (n, node, index) => {
      // A delay could be added here to prevent clicking
      n.gainNode.disconnect(...node.inputs[index].args(node))
    },
  },
]

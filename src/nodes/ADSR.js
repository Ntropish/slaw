// The code in the main global scope.
export default class ADSR {
  constructor({ context, bps }) {
    this.bps = bps
    this.context = context
    this.gainNode = context.createGain()
    this.asdr = [0.1, 0.3, 0.1, 0.2]
  }

  onEvent({ beats, time }) {
    const noteEnd = time + beats / this.transporter.bps
    const [a, d, s, r] = this.asdr

    this.gainNode.gain.setValueAtTime(0, time)
    // Math min to make sure gain doesn't come in after note should be stopping
    this.gainNode.gain.linearRampToValueAtTime(0.8, Math.min(noteEnd, time + a))
    this.gainNode.gain.linearRampToValueAtTime(
      s,
      Math.min(noteEnd, time + a + d),
    )
    this.gainNode.gain.setValueAtTime(s, noteEnd)
    this.gainNode.gain.linearRampToValueAtTime(0, noteEnd + r)
  }

  connectOutputTo(outputIndex, node, inputIndex) {
    console.log('connect:', outputIndex, ' -> ', outputIndex, node)

    // edge type must match
    if (this.outputs[outputIndex].type !== node.inputs[inputIndex].type)
      return false
    this.outputs[outputIndex].connect(node, inputIndex)
    node.inputs[inputIndex].connect(this, outputIndex)
  }

  inputs = [
    {
      type: 'buffer',
      // Connect to
      args: [this.gainNode],
    },
    {
      type: 'event',
      args: [this.onEvent.bind(this)],
    },
  ]

  outputs = [
    {
      type: 'buffer',
      connect: (node, index) => {
        this.gainNode.connect(...node.inputs[index].args)
      },
      disconnect: (node, index) => {
        this.gainNode.disconnect(...node.inputs[index].args)
      },
    },
  ]
}

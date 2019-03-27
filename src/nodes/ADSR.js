import Brain from './Brain'

export default class ADSR extends Brain {
  constructor(transporter) {
    super()
    this.transporter = transporter
    const { context, bps } = transporter
    this.bps = bps
    this.gainNode = context.createGain()
    this.adsr = [0.1, 0.2, 0.4, 0.1]

    transporter.on('clear', () => {
      this.gainNode.gain.cancelScheduledValues(
        context.getOutputTimestamp().contextTime,
      )
      this.gainNode.gain.setTargetAtTime(
        0,
        context.getOutputTimestamp().contextTime,
        0.01,
      )
    })

    this.onEvent = this.onEvent.bind(this)
    // this.stop = this.stop.bind(this)
  }

  onEvent({
    detail: {
      beats,
      time,
      data: { velocity },
    },
  }) {
    const noteEnd = time + beats / this.bps
    const [a, d, s, r] = this.adsr

    this.gainNode.gain.cancelScheduledValues(time)

    this.gainNode.gain.setTargetAtTime(0, Math.max(time - 0.005, 0), 0.005)
    // Math min to make sure gain doesn't come in after note should be stopping
    this.gainNode.gain.linearRampToValueAtTime(1, Math.min(noteEnd, time + a))
    this.gainNode.gain.linearRampToValueAtTime(
      s,
      Math.min(noteEnd, time + a + d),
    )
    this.gainNode.gain.setTargetAtTime(s, noteEnd, 0.005)
    this.gainNode.gain.linearRampToValueAtTime(0, noteEnd + r)
  }

  // stop(_time) {
  //   const time = _time || this.context.getOutputTimestamp().contextTime
  //   this.gainNode.gain.cancelScheduledValues(time)
  //   this.gainNode.gain.setTargetAtTime(0, time + 0.1)
  // }
}

ADSR.prototype.inputs = [
  {
    type: 'buffer',
    args: n => [n.gainNode],
  },
  {
    type: 'event',
    args: n => [n.onEvent],
  },
]

ADSR.prototype.outputs = [
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

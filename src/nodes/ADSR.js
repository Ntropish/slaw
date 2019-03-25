import Brain from './Brain'

export default class ADSR extends Brain {
  constructor(transporter) {
    super()
    this.transporter = transporter
    const { context, bps } = transporter
    this.bps = bps
    this.gainNode = context.createGain()
    this.adsr = [0.01, 0.1, 0.4, 0.1]

    transporter.on('clear', () => {
      this.gainNode.gain.cancelScheduledValues(
        context.getOutputTimestamp().contextTime,
      )
      this.gainNode.gain.setValueAtTime(
        0,
        context.getOutputTimestamp().contextTime,
      )
    })

    this.onEvent = this.onEvent.bind(this)
    this.stop = this.stop.bind(this)
  }

  onEvent({ detail: { beats, time, velocity } }) {
    const noteEnd = time + beats / this.bps
    const [a, d, s, r] = this.adsr

    this.gainNode.gain.setValueAtTime(0, time)
    // Math min to make sure gain doesn't come in after note should be stopping
    this.gainNode.gain.linearRampToValueAtTime(
      velocity,
      Math.min(noteEnd, time + a),
    )
    this.gainNode.gain.linearRampToValueAtTime(
      s * velocity,
      Math.min(noteEnd, time + a + d),
    )
    this.gainNode.gain.setTargetAtTime(s * velocity, noteEnd, 0.1)
    this.gainNode.gain.linearRampToValueAtTime(0, noteEnd + r)
  }

  stop(_time) {
    const time = _time || this.context.getOutputTimestamp().contextTime
    this.gainNode.gain.cancelScheduledValues(time)
    this.gainNode.gain.setTargetAtTime(0, time + 0.1)
  }
}

ADSR.inputs = [
  {
    type: 'buffer',
    args: n => n.gainNode,
  },
  {
    type: 'event',
    args: n => n.onEvent,
  },
]

ADSR.outputs = [
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

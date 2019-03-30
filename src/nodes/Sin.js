import { pitchToFrequency, ValueScheduler } from './util'

import Brain from './Brain'

export default class Sin extends Brain {
  constructor(transporter) {
    super(transporter)
    const { context, bps } = transporter
    this.context = context
    this.bps = bps
    this.osc = context.createOscillator()
    this.osc.start()
    this.gainNode = context.createGain()
    this.gainNode.gain.setValueAtTime(
      0,
      context.getOutputTimestamp().contextTime,
    )
    this.osc.connect(this.gainNode)
    this.gainScheduler = ValueScheduler(0)
    this.frequencyScheduler = ValueScheduler(440)

    transporter.on('clear', () => {
      console.log('clear')
      this.gainScheduler.schedulings = []
      this.frequencyScheduler.schedulings = []
      this.gainNode.gain.cancelScheduledValues(
        context.getOutputTimestamp().contextTime,
      )
      this.gainNode.gain.setTargetAtTime(
        0,
        context.getOutputTimestamp().contextTime,
        0.01,
      )
    })
  }

  onEvent({ detail: { beats, time, data, id } }) {
    const frequency = pitchToFrequency(data.pitch)
    const now = this.context.getOutputTimestamp().contextTime
    const eventEnd = time + beats / this.bps
    this.gainNode.gain.cancelScheduledValues(now)
    this.osc.frequency.cancelScheduledValues(now)

    // This function uses fancy schedulers to determine
    // when to turn the gain on and change the frequency

    this.gainScheduler.addEvent(time, eventEnd, data.velocity)
    console.log(id, this.gainScheduler.schedulings)
    this.gainScheduler.schedulings.forEach(({ value, time }) => {
      console.log(value, time)
      this.gainNode.gain.setValueAtTime(value, time)
    })

    this.frequencyScheduler.addEvent(time, eventEnd, frequency)
    this.frequencyScheduler.schedulings.forEach(({ value, time }) => {
      this.osc.frequency.setTargetAtTime(value, time, 0.03)
    })
  }

  stop(_time) {
    const time =
      _time || this.transporter.context.getOutputTimestamp().contextTime
    this.gainNode.gain.cancelScheduledValues(time)
    this.gainNode.gain.setTargetAtTime(0, time + 0.01)
  }
}

Sin.prototype.inputs = [
  {
    type: 'event',
    args: n => [n.onEvent.bind(n)],
  },
]

Sin.prototype.outputs = [
  {
    type: 'buffer',
    connect: (n, node, index) => {
      n.gainNode.connect(...node.inputs[index].args(node))
    },
    disconnect: (n, node, index) => {
      n.gainNode.disconnect(...node.inputs[index].args(node))
    },
  },
]

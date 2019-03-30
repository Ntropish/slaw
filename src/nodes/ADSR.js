import Brain from './Brain'
import { ValueScheduler } from './util'

export default class ADSR extends Brain {
  constructor(transporter) {
    super()
    this.transporter = transporter
    const { context, bps } = transporter
    this.gainNode = context.createGain()
    this.adsr = [0.04, 0.02, 0.2, 0.2]
    this.valueScheduler = ValueScheduler(null)
    this.lastScheduling = null
    this.lastValue = null

    transporter.on('clear', () => {
      this.lastScheduling = null
      this.lastValue = null
      this.gainNode.gain.cancelScheduledValues(
        context.getOutputTimestamp().contextTime,
      )
      this.gainNode.gain.setTargetAtTime(
        0,
        context.getOutputTimestamp().contextTime,
        0.01,
      )
      this.valueScheduler.schedulings = []
    })

    this.onEvent = this.onEvent.bind(this)
  }

  onEvent({
    detail: {
      beats,
      time,
      data: { velocity },
    },
  }) {
    const [a, d, s, r] = this.adsr
    const noteEnd = time + beats / this.transporter.bps

    this.gainNode.gain.cancelScheduledValues()

    // Schedule trigger/release times
    this.valueScheduler.addTrigger(time, noteEnd, this.adsr)

    this.valueScheduler.schedulings.forEach(scheduling => {
      const { time, value } = scheduling

      if (value) {
        const [a, d, s, r] = value
        // const lastScheduling =

        const willIntersectTail =
          this.lastScheduling &&
          this.lastScheduling.time < time + a &&
          this.lastScheduling.time + this.lastValue[3] > time

        if (
          !this.lastScheduling ||
          (!this.lastScheduling.value && !willIntersectTail)
        ) {
          // Basic envelope scheduling
          this.gainNode.gain.setValueAtTime(0, time)
          this.gainNode.gain.linearRampToValueAtTime(1, time + a)
          this.gainNode.gain.linearRampToValueAtTime(s, time + a + d)
        } else {
          // retriggering is complicated (new envelope when one is already on) because
          // the attack line of this event can intersect in four places:
          // attack/decay/sustain/release phases
          // I just plugged line intersection formulas into wolfram alpha so
          // these formulas aren't really understandable
          const [a0, d0, s0, r0] = this.lastValue
          const t0 = this.lastScheduling.time
          const t = time - t0
          // Intersection is the time after the beginning of this event
          // that the two envelopes meet. This is where to begin scheduling
          let intersection
          let intersectionValue
          let isSustain = false
          if (time - t0 < a0 - a) {
            // Attack intersection
            intersection = (a0 * t) / (a0 - a)
            intersectionValue = t / a
          } else if (time - t0 < a0 + d0 - a * s0) {
            // Decay intersection
            intersection = (d0 * (a0 - t0 + t)) / (-s0 * a + a + d0)
            intersectionValue = 1 - (s * (t - a)) / d
          } else if (!willIntersectTail) {
            // Sustain intersection
            intersection = s0 * a
            intersectionValue = s
            isSustain = true
          } else {
            if (this.lastScheduling.value !== null) debugger
            // Release intersection
            intersection = (a * s0 * (time - t0 + r0)) / (a * s0 + r0)
            intersectionValue = intersection / a
          }

          this.gainNode.gain.cancelScheduledValues(time + intersection)
          // First scheduling needs to not ramp to the value only for sustain
          if (isSustain) {
            this.gainNode.gain.setValueAtTime(
              intersectionValue,
              time + intersection,
            )
          } else {
            this.gainNode.gain.linearRampToValueAtTime(
              intersectionValue,
              time + intersection,
            )
          }
          this.gainNode.gain.linearRampToValueAtTime(1, time + a)
          this.gainNode.gain.linearRampToValueAtTime(s, time + a + d)
        }
        this.lastValue = value
      } else {
        // Handle releasing
        const s0 = this.lastScheduling.value[2]
        console.log('release', s0, time, 0, time + r)
        this.gainNode.gain.linearRampToValueAtTime(s0, time)
        this.gainNode.gain.linearRampToValueAtTime(0, time + r)
      }

      this.lastScheduling = scheduling
    })
  }
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

import Brain from './Brain'
import { ValueScheduler } from './util'

export default class ADSR extends Brain {
  constructor(transporter) {
    super()
    this.transporter = transporter
    const { context } = transporter
    this.gainNode = context.createGain()
    this.adsr = [0.04, 0.02, 0.5, 0.3]
    this.valueScheduler = ValueScheduler(null)

    transporter.on('clear', () => {
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

  static get parameterDescriptors() {
    return [
      {
        name: 'attack',
        defaultValue: 0.01,
      },
      {
        name: 'decay',
        defaultValue: 0.02,
      },
      {
        name: 'sustain',
        defaultValue: 0.5,
      },
      {
        name: 'release',
        defaultValue: 0.03,
      },
    ]
  }

  onEvent({
    detail: {
      beats,
      time,
      data: { velocity },
    },
  }) {
    const noteEnd = time + beats / this.transporter.bps
    const now = this.transporter.context.getOutputTimestamp().contextTime
    this.gainNode.gain.cancelScheduledValues(now)

    // Schedule trigger/release times
    this.valueScheduler.addTrigger(time, noteEnd, this.adsr)

    let lastTrigger = null
    let lastRelease = null

    this.valueScheduler.schedulings.forEach(scheduling => {
      const { time, value } = scheduling

      if (value) {
        const [a, d, s, r] = value

        const willIntersect =
          lastTrigger &&
          (!lastRelease || lastRelease.time + lastTrigger.value[3] > time)

        if (!willIntersect) {
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
          const {
            time: t0,
            value: [a0, d0, s0, r0],
          } = lastTrigger
          const nextRelease = this.valueScheduler.scanForward(time)
          const releasePoint =
            (lastRelease && lastRelease.time) || nextRelease.time

          // Only the firt true here is valid, the former values exclude the latter
          // Also, these were calculated on paper
          const willIntersectRelease = a > (releasePoint - time) / s0
          const willIntersectSustain = a > (t0 + a0 + d0 - time) / s0
          const willIntersectDecay = a > t0 + a0 - time

          const t = time - t0
          // Intersection is the time after the beginning of this event
          // that the two envelopes meet. This is where to begin scheduling
          let intersection
          let intersectionValue
          let isSustain = false
          if (willIntersectRelease) {
            intersection = (a * s0 * (time - t0 + r0)) / (a * s0 + r0)
            intersectionValue = intersection / a
          } else if (willIntersectSustain) {
            intersection = s0 * a
            intersectionValue = s
            isSustain = true
          } else if (willIntersectDecay) {
            intersection = (d0 * (a0 - t0 + t)) / (-s0 * a + a + d0)
            intersectionValue = 1 - (s * (t - a)) / d
          } else {
            // Given willIntersect, intersection during attack is all that's left
            intersection = (a0 * t) / (a0 - a)
            intersectionValue = t / a
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
        lastTrigger = scheduling
        // Delete the last release upon new trigger for logic above
        lastRelease = null
      } else {
        // Handle releasing
        const s0 = lastTrigger.value[2]
        this.gainNode.gain.linearRampToValueAtTime(s0, time)
        this.gainNode.gain.linearRampToValueAtTime(
          0,
          time + lastTrigger.value[3],
        )
        lastRelease = scheduling
      }
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

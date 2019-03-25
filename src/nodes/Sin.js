import { timeSort } from './util'

import Brain from './Brain'

export default class Destination extends Brain {
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
    this.onMap = []
    this.frequencyMap = []

    transporter.on('clear', () => {
      this.onMap = []
      this.frequencyMap = []
      this.gainNode.gain.cancelScheduledValues(
        context.getOutputTimestamp().contextTime,
      )
      this.gainNode.gain.setValueAtTime(
        0,
        context.getOutputTimestamp().contextTime,
      )
    })
  }

  // This complicated function finds all of the
  // on/off and frequency change scheduling that
  // needs to be done based on all of the previous.
  // It maintains sorted arrays of state changes
  onEvent({ detail: { beats, time, frequency } }) {
    const now = this.context.getOutputTimestamp().contextTime
    const eventEnd = time + beats / this.bps

    const onStateNow = scanMap(this.onMap, now)
    const onStateStart = scanMap(this.onMap, time)
    const onStateEnd = scanMap(this.onMap, eventEnd)

    const onNow = onStateNow && onStateNow.value
    const onAtStart = onStateStart && onStateStart.value
    const onAtEnd = onStateEnd && onStateEnd.value

    // Slice off old events but add a new on event if it was on
    this.onMap = this.onMap.filter(event => event.time > now)
    if (onNow) this.onMap.push({ time: now, value: true })

    if (!onAtStart && !onAtEnd) {
      // If landed exactly on an off event delete it
      if (onStateStart && onStateStart.time === time) {
        this.onMap.splice(this.onMap.indexOf(onStateStart), 1)
      }
      // Landed in empty space, fill it all in
      this.onMap.push({ time, value: true })
      this.onMap.push({ time: eventEnd, value: false })
    }
    if (onAtStart && !onAtEnd) {
      // Landed half off an on state, extend it to include this event
      this.onMap.splice(this.onMap.indexOf(onStateStart), 1)
      this.onMap.push({ time: eventEnd, value: false })
    }
    // Keep the map sorted so the above logic works
    this.onMap = this.onMap.sort(timeSort)

    // Frequency is more simple
    this.frequencyMap.push({ time, value: frequency })
    if (onAtStart && onAtEnd) {
      scanMap(this.frequencyMap, eventEnd).time = eventEnd
    }
    // Again, the sort is vital for the above algorithm
    this.frequencyMap = this.frequencyMap.sort(timeSort)

    this.gainNode.gain.cancelScheduledValues(now)
    this.onMap.forEach(({ value, time }) => {
      // Use setTargetAtTime to prevent clicking
      this.gainNode.gain.setTargetAtTime(value ? 1 : 0, time, 0.01)
    })

    this.osc.frequency.cancelScheduledValues(now)
    this.frequencyMap.forEach(({ value, time }) => {
      this.osc.frequency.setValueAtTime(value, time)
    })
  }

  stop(_time) {
    const time =
      _time || this.transporter.context.getOutputTimestamp().contextTime
    this.gainNode.gain.cancelScheduledValues(time)
    this.gainNode.gain.setTargetAtTime(0, time + 0.1)
  }
}

// Find the highest timed event below or equal the time
function scanMap(map, time) {
  const result = map.reduce((acc, event) => {
    if (!acc) return event
    if (event.time > acc.time && event.time <= time) return event
    return acc
  }, null)
  return result
}

Destination.prototype.inputs = [
  {
    type: 'event',
    args: n => [n.onEvent.bind(n)],
  },
]

Destination.prototype.outputs = [
  {
    type: 'buffer',
    connect: (n, node, index) => {
      console.log(node.inputs[index].args(node))
      n.gainNode.connect(...node.inputs[index].args(node))
    },
    disconnect: (n, node, index) => {
      n.gainNode.disconnect(...node.inputs[index].args(node))
    },
  },
]

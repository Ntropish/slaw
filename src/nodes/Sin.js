import { connect, timeSort } from './util'

export default function SinFactory(transporter) {
  const { context, bps } = transporter
  const osc = context.createOscillator()
  osc.start()
  const gainNode = context.createGain()
  gainNode.gain.setValueAtTime(0, context.getOutputTimestamp().contextTime)
  osc.connect(gainNode)
  let onMap = []
  let frequencyMap = []

  transporter.on('clear', () => {
    onMap = []
    frequencyMap = []
    gainNode.gain.cancelScheduledValues(
      context.getOutputTimestamp().contextTime,
    )
    gainNode.gain.setValueAtTime(0, context.getOutputTimestamp().contextTime)
  })

  // This complicated function finds all of the
  // on/off and frequency change scheduling that
  // needs to be done based on all of the previous.
  // It maintains sorted arrays of state changes
  function onEvent({ detail: { beats, time, frequency } }) {
    const now = context.getOutputTimestamp().contextTime
    const eventEnd = time + beats / bps

    const onStateNow = scanMap(onMap, now)
    const onStateStart = scanMap(onMap, time)
    const onStateEnd = scanMap(onMap, eventEnd)

    const onNow = onStateNow && onStateNow.value
    const onAtStart = onStateStart && onStateStart.value
    const onAtEnd = onStateEnd && onStateEnd.value

    // Slice off old events but add a new on event if it was on
    onMap = onMap.filter(event => event.time > now)
    if (onNow) onMap.push({ time: now, value: true })

    if (!onAtStart && !onAtEnd) {
      // If landed exactly on an off event delete it
      if (onStateStart && onStateStart.time === time) {
        onMap.splice(onMap.indexOf(onStateStart), 1)
      }
      // Landed in empty space, fill it all in
      onMap.push({ time, value: true })
      onMap.push({ time: eventEnd, value: false })
    }
    if (onAtStart && !onAtEnd) {
      // Landed half off an on state, extend it to include this event
      onMap.splice(onMap.indexOf(onStateStart), 1)
      onMap.push({ time: eventEnd, value: false })
    }
    // Keep the map sorted so the above logic works
    onMap = onMap.sort(timeSort)

    // Frequency is more simple
    frequencyMap.push({ time, value: frequency })
    if (onAtStart && onAtEnd) {
      scanMap(frequencyMap, eventEnd).time = eventEnd
    }
    // Again, the sort is vital for the above algorithm
    frequencyMap = frequencyMap.sort(timeSort)

    gainNode.gain.cancelScheduledValues(now)
    onMap.forEach(({ value, time }) => {
      // Use setTargetAtTime to prevent clicking
      gainNode.gain.setTargetAtTime(value ? 1 : 0, time, 0.01)
    })

    osc.frequency.cancelScheduledValues(now)
    frequencyMap.forEach(({ value, time }) => {
      osc.frequency.setValueAtTime(value, time)
    })
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

  function stop(_time) {
    const time = _time || context.getOutputTimestamp().contextTime
    gainNode.gain.cancelScheduledValues(time)
    gainNode.gain.setTargetAtTime(0, time + 0.1)
  }

  return {
    connect,
    stop,
    inputs: [
      {
        type: 'event',
        args: [onEvent],
      },
    ],
    outputs: [
      {
        type: 'buffer',
        connect: (node, index) => {
          console.log('connect sin', node, index)
          gainNode.connect(...node.inputs[index].args)
        },
        disconnect: (node, index) => {
          gainNode.disconnect(...node.inputs[index].args)
        },
      },
    ],
  }
}

import { connect, timeSort } from './util'

export default function SinFactory(transporter) {
  const { context, bps } = transporter
  const osc = context.createOscillator()
  const gainNode = context.createGain()
  osc.connect(gainNode)
  let onMap = []
  let frequencyMap = []

  transporter.on('clear', () => {
    gainNode.gain.cancelScheduledValues()
    gainNode.gain.setValueAtTime(0, context.getOutputTimestamp().contextTime)
  })

  // This complicated function finds all of the
  // on/off and frequency change scheduling that
  // needs to be done based on all of the previous
  function onEvent({ beats, time, frequency }) {
    const now = context.getOutputTimestamp().contextTime
    const eventEnd = time + beats / bps

    const onStateNow = scanMap(onMap)
    const onStateStart = scanMap(onMap, time)
    const onStateEnd = scanMap(onMap, eventEnd)

    // Slice off old events but add a new on event if it was on
    onMap = onMap.filter(event => event.time > now)
    if (onStateNow.value) onMap.push({ time: now, value: true })

    if (!onStateStart.value && !onStateEnd.value) {
      // If landed exactly on an off event delete it
      if (onStateStart.time === time) {
        onMap.splice(onMap.indexOf(onStateStart), 1)
      }
      // Landed in empty space, fill it all in
      onMap.push({ time: eventEnd, value: true })
      onMap.push({ time: eventEnd, value: false })
    }
    if (onStateStart.value && !onStateEnd.value) {
      // Landed half off an on state, extend it to include this event
      onMap.splice(onMap.indexOf(onStateStart), 1)
      onMap.push({ time: eventEnd, value: false })
    }
    // Keep the map sorted so the above logic works
    onMap.sort(timeSort)

    // Frequency is more simple
    frequencyMap.push({ time, value: frequency })
    if (onStateStart.value && onStateEnd.value) {
      scanMap(frequencyMap, eventEnd).time = eventEnd
    }
    // Again, the sort is vital for the above algorithm
    frequencyMap.sort(timeSort)

    gainNode.gain.cancelScheduledValues()
    onMap.forEach(({ value, time }) => {
      gainNode.gain.setValueAtTime(value ? 1 : 0, time)
    })

    osc.frequency.cancelScheduledValues()
    frequencyMap.forEach(({ value, time }) => {
      osc.frequency.setValueAtTime(value, time)
    })
  }

  // Find the highest timed event below or equal the time
  function scanMap(map, time) {
    return map.reduce((acc, event) => {
      if (!acc) return event
      if (event.time > acc && event.time <= time) return event
      return acc
    }, null)
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
          gainNode.connect(...node.inputs[index].args)
        },
        disconnect: (node, index) => {
          gainNode.disconnect(...node.inputs[index].args)
        },
      },
    ],
  }
}

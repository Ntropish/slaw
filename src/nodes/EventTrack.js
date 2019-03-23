import { connect, timeSort, pitchToFrequency } from './util'

export default function EventTrackFactory(transporter, events) {
  const eventSender = new EventTarget()
  transporter.on('schedule', data => {
    // Send events in this schedule chunk in order
    events
      .filter(
        event => event.beat >= data.beat && event.beat < data.beat + data.beats,
      )
      .map(event => {
        const time = data.at + (event.beat - data.beat) / transporter.bps
        return { ...event, time, frequency: pitchToFrequency(event.pitch) }
      })
      .sort(timeSort)
      .forEach(event => {
        eventSender.dispatchEvent(new CustomEvent('event', { detail: event }))
      })
  })

  function updateEvents(_events) {
    events = _events
  }

  return {
    connect,
    updateEvents,
    outputs: [
      {
        type: 'event',
        connect: (node, index) => {
          eventSender.addEventListener('event', ...node.inputs[index].args)
        },
        disconnect: (node, index) => {
          eventSender.removeEventListener('event', ...node.inputs[index].args)
        },
      },
    ],
    inputs: [],
  }
}

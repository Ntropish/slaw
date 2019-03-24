import { connect, timeSort, pitchToFrequency } from './util'
import { store } from '../index'

export default function EventTrackFactory(transporter, trackId) {
  const eventSender = new EventTarget()

  transporter.on('schedule', data => {
    // Send events in this schedule chunk in order
    store.getters
      .eventsOfTrack(trackId)
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
  return {
    connect,
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

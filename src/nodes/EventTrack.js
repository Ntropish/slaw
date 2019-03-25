import { store } from '../index'
import { pitchToFrequency, timeSort } from './util'
import Brain from './Brain'

export default class EventTrack extends Brain {
  constructor(transporter, trackId) {
    super()
    this.eventSender = new EventTarget()
    this.trackId = trackId

    transporter.on('schedule', data => {
      // Send events in this schedule chunk in order
      store.getters
        .eventsOfTrack(trackId)
        .filter(
          event =>
            event.beat >= data.beat && event.beat < data.beat + data.beats,
        )
        .map(event => {
          const time = data.at + (event.beat - data.beat) / transporter.bps
          return { ...event, time, frequency: pitchToFrequency(event.pitch) }
        })
        .sort(timeSort)
        .forEach(event => {
          this.eventSender.dispatchEvent(
            new CustomEvent('event', { detail: event }),
          )
        })
    })
  }
}

EventTrack.inputs = []

EventTrack.outputs = [
  {
    type: 'event',
    connect: (node, index) => {
      this.eventSender.addEventListener('event', ...node.inputs[index].args)
    },
    disconnect: (node, index) => {
      this.eventSender.removeEventListener('event', ...node.inputs[index].args)
    },
  },
]

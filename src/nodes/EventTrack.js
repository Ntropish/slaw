import { store } from '../index'
import { pitchToFrequency, timeSort } from './util'
import Brain from './Brain'

export default class EventTrack extends Brain {
  constructor(transporter, { trackId }) {
    super(transporter)
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

EventTrack.prototype.inputs = []

EventTrack.prototype.outputs = [
  {
    type: 'event',
    connect: (n, node, index) => {
      n.eventSender.addEventListener('event', ...node.inputs[index].args(node))
    },
    disconnect: (n, node, index) => {
      n.eventSender.removeEventListener(
        'event',
        ...node.inputs[index].args(node),
      )
    },
  },
]

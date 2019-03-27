import { store } from '../index'
import { pitchToFrequency, timeSort } from './util'
import Brain from './Brain'

export default class EventTrack extends Brain {
  constructor(transporter, { trackId }) {
    super(transporter)
    this.eventSender = new EventTarget()
    this.trackId = trackId
    this.eventHandlers = {}

    transporter.on('schedule', data => {
      // Send events in this schedule chunk in order
      Object.values(store.getters.eventsOfTrack(trackId))
        .filter(
          event =>
            event.beat >= data.beat && event.beat < data.beat + data.beats,
        )
        .map(event => {
          const time = data.at + (event.beat - data.beat) / transporter.bps
          return { ...event, time }
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
      if (!n.eventHandlers[node]) n.eventHandlers[node] = {}
      if (!n.eventHandlers[node][index]) n.eventHandlers[node][index] = {}
      n.eventHandlers[node][index] = node.inputs[index].args(node)[0]
      n.eventSender.addEventListener('event', n.eventHandlers[node][index])
    },
    disconnect: (n, node, index) => {
      n.eventSender.removeEventListener('event', n.eventHandlers[node][index])
      delete n.eventHandlers[node][index]
    },
  },
]

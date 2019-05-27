import { store } from '../index'
import { pitchToFrequency, timeSort } from './util'
import Brain from './Brain'

import Interface from 'components/nodeInterfaces/EventTrack.vue'

export default class EventTrack extends Brain {
  constructor(
    transporter,
    {
      data: { trackId },
    },
  ) {
    super(transporter)
    this.eventSender = new EventTarget()
    this.trackId = trackId
    this.eventHandler = null

    transporter.on('schedule', data => {
      // Send events in this schedule chunk in order
      Object.values(store.getters.eventsOfTrack(trackId))
        .filter(
          event =>
            event.beat >= data.beat && event.beat < data.beat + data.beats,
        )
        .map(event => {
          const now = transporter.context.getOutputTimestamp().contextTime
          const time = data.at + (event.beat - data.beat) / transporter.bps
          return { ...event, time }
        })
        .sort(timeSort)
        .forEach(event => {
          // console.log(event)
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
      n.eventHandler = node.inputs[index].args(node)[0]
      n.eventSender.addEventListener('event', n.eventHandler)
    },
    disconnect: (n, node, index) => {
      n.eventSender.removeEventListener('event', n.eventHandler)
    },
  },
]

EventTrack.interface = Interface

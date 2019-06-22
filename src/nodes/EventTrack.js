import { store } from '../index'
import { pitchToFrequency, timeSort } from './util'
import brainFactory from './Brain'

import Interface from 'components/nodeInterfaces/EventTrack.vue'

export default function eventTrackFactory(transporter, node) {

  const eventSender = new EventTarget()
  return brainFactory({
    
  })
}

export default class EventTrack extends Brain {
  constructor(
    transporter,
    {
      data: { trackId },
      id: nodeId,
    },
  ) {
    super(transporter)
    this.eventHandler = null
    this.unregisterFunctions = []
    this.graphics = []

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
          this.eventSender.dispatchEvent(
            new CustomEvent('event', { detail: event }),
          )
        })
    })
  }

  addGraphics(illo) {
    const { x, y, inputs, outputs } = store.state.nodes[this.nodeId]

    this.root = new Zdog.RoundedRect({
      addTo: illo,
      width: 100,
      height: 40,
      translate: { z: 0, x, y },
      stroke: 2,
      cornerRadius: 20,
      color: '#636',
    })
    this.graphics.push(this.root)
    this.output = new Zdog.RoundedRect({
      addTo: this.root,
      color: '#877',
      width: 80,
      height: 30,
      translate: { z: 25, x: 20, y: 0 },
      fill: true,
      cornerRadius: 5,
    })
    this.graphics.push(this.output)
    this.draggerGraphic = new Zdog.Hemisphere({
      addTo: this.root,
      color: '#636',
      diameter: 40,
      translate: { z: 50, x: -35, y: 0 },
      stroke: false,
      backface: '#933',
    })
    this.graphics.push(this.draggerGraphic)
    illo.updateRenderGraph()
    // This setImmediate is to give ZDog time to build the svg elements
    // that event listeners will be attached to
    setImmediate(() => {
      this.unregisterFunctions.push(
        this.registerDragGraphic(this.illo, this.draggerGraphic),
      )
      this.unregisterFunctions.push(
        this.registerPort({
          graphic: this.output,
          type: 'output',
          nodeId: this.nodeId,
          index: 0,
        }),
      )
      this.unregisterFunctions.push(this.buildEdges(inputs, outputs))
    })
  }
  updateGraphics(illo, rotate) {
    const { x, y } = store.state.nodes[this.nodeId]
    this.root.translate = { z: 20, x, y }
    this.root.rotate = rotate
    const isSelected = store.state.selectedNodes.includes(this.nodeId)
    this.root.color = isSelected ? '#959' : '#636'
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

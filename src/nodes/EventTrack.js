import { store } from '../index'
import { pitchToFrequency, timeSort } from './util'
import Brain from './Brain'

import Interface from 'components/nodeInterfaces/EventTrack.vue'

export default class EventTrack extends Brain {
  constructor(
    transporter,
    {
      data: { trackId },
      id: nodeId,
    },
  ) {
    super(transporter)
    this.eventSender = new EventTarget()
    this.nodeId = nodeId
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
          this.eventSender.dispatchEvent(
            new CustomEvent('event', { detail: event }),
          )
        })
    })
  }

  addGraphics(illo) {
    const { x, y } = store.state.nodes[this.nodeId]

    this.rect = new Zdog.RoundedRect({
      addTo: illo,
      width: 100,
      height: 50,
      translate: { z: 0, x, y },
      fill: 10,
      color: '#636',
    })
    illo.updateRenderGraph()
    setImmediate(() => {
      this.unregisterDrag = this.registerDragGraphic({
        graphic: this.rect,
        pan: true,
        onDown: e => {
          const selectedIndex = store.state.selectedNodes.indexOf(this.nodeId)
          if (!e.ctrlKey) {
            // Select just the clicked node
            store.commit('SET_SELECTED_NODES', [this.nodeId])
          } else if (selectedIndex !== -1) {
            // Deselect the clicked node
            store.commit('SET_SELECTED_NODES', [
              ...store.state.selectedNodes.slice(0, selectedIndex),
              ...store.state.selectedNodes.slice(selectedIndex + 1),
            ])
          } else {
            // Else just select the node
            store.commit('SELECT_NODE', this.nodeId)
          }
        },
        onDrag: e => {
          store.commit('PAN_NODES', {
            x: e.movementX / 2,
            y: e.movementY / 2,
            nodeIds: store.state.selectedNodes,
          })
        },
      })
    })
    this.graphic = new Zdog.RoundedRect({
      addTo: this.rect,
      color: '#933',
      width: 8,
      height: 3,
      translate: { z: 10, x: 5, y: 5 },
      fill: 3,
    })
  }
  updateGraphics(illo, rotate) {
    const { x, y } = store.state.nodes[this.nodeId]
    this.rect.translate = { z: 10, x, y }
    this.rect.rotate = rotate
  }
  removeGraphics(illo) {
    if (this.unregisterGraphic) this.unregisterGraphic()
    this.removeGraphic(illo, this.rect)
    this.removeGraphic(illo, this.graphic)
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

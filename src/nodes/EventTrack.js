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

    this.root = new Zdog.RoundedRect({
      addTo: illo,
      width: 100,
      height: 40,
      translate: { z: 0, x, y },
      stroke: 2,
      cornerRadius: 20,
      color: '#636',
    })
    this.output = new Zdog.RoundedRect({
      addTo: this.root,
      color: '#877',
      width: 80,
      height: 30,
      translate: { z: 25, x: 20, y: 0 },
      fill: true,
      cornerRadius: 5,
    })

    this.draggerGraphic = new Zdog.Hemisphere({
      addTo: this.root,
      color: '#636',
      diameter: 40,
      translate: { z: 50, x: -35, y: 0 },
      stroke: false,
      backface: '#933',
    })
    illo.updateRenderGraph()
    setImmediate(() => {
      this.unregisterDrag = this.registerDragGraphic({
        graphic: this.draggerGraphic,
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
          console.log('render!')
          illo.updateRenderGraph()
        },
        onDrag: e => {
          store.commit('PAN_NODES', {
            x: e.movementX / illo.scale.x,
            y: e.movementY / illo.scale.y,
            nodeIds: store.state.selectedNodes,
          })
        },
      })
      this.unregisterOutput = this.registerPort({
        graphic: this.output,
        type: 'output',
        nodeId: this.nodeId,
        index: 0,
      })
    })
  }
  updateGraphics(illo, rotate) {
    const { x, y } = store.state.nodes[this.nodeId]
    this.root.translate = { z: 20, x, y }
    this.root.rotate = rotate
    const isSelected = store.state.selectedNodes.includes(this.nodeId)
    this.root.color = isSelected ? '#959' : '#636'
  }
  removeGraphics(illo) {
    if (this.unregisterGraphic) this.unregisterGraphic()
    if (this.unregisterOutput) this.unregisterOutput()
    this.removeGraphic(illo, this.root)
    this.removeGraphic(illo, this.output)
    this.removeGraphic(illo, this.draggerGraphic)
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

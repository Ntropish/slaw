import { pitchToFrequency, ValueScheduler } from './util'
import { store } from '../index'

import Brain from './Brain'

export default class Sin extends Brain {
  constructor(transporter, { id: nodeId }) {
    super(transporter)
    this.nodeId = nodeId
    const { context, bps } = transporter
    this.context = context
    this.bps = bps
    this.osc = context.createOscillator()
    this.osc.start()
    this.gainNode = context.createGain()
    this.gainNode.gain.setValueAtTime(0, context.currentTime)
    this.osc.connect(this.gainNode)
    this.gainScheduler = ValueScheduler(0)
    this.frequencyScheduler = ValueScheduler(440)
    // Extra time at the end for "release" phase
    this.tail = 0.5

    transporter.on('clear', () => {
      this.gainScheduler.schedulings = []
      this.frequencyScheduler.schedulings = []
      this.gainNode.gain.cancelScheduledValues(context.currentTime)
      this.gainNode.gain.setTargetAtTime(0, context.currentTime, 0.01)
    })
  }

  onEvent({ detail: { beats, time, data, id } }) {
    const frequency = pitchToFrequency(data.pitch)
    const now = this.context.currentTime
    const eventEnd = time + beats / this.bps
    this.gainNode.gain.cancelScheduledValues(now)
    this.osc.frequency.cancelScheduledValues(now)

    // This function uses fancy schedulers to determine
    // when to turn the gain on and change the frequency

    this.gainScheduler.addEvent(time, eventEnd + this.tail, data.velocity)
    this.gainScheduler.schedulings.forEach(({ value, time }) => {
      this.gainNode.gain.setValueAtTime(value, time)
    })

    this.frequencyScheduler.addState(time, frequency)
    this.frequencyScheduler.schedulings.forEach(({ value, time }) => {
      this.osc.frequency.setTargetAtTime(value, time, 0.001)
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
      color: '#663',
    })
    this.output = new Zdog.RoundedRect({
      addTo: this.root,
      color: '#877',
      width: 50,
      height: 30,
      translate: { z: 25, x: 40, y: 0 },
      fill: true,
      cornerRadius: 5,
    })
    this.input = new Zdog.RoundedRect({
      addTo: this.root,
      color: '#877',
      width: 50,
      height: 30,
      translate: { z: 25, x: -40, y: 0 },
      fill: true,
      cornerRadius: 5,
    })

    this.draggerGraphic = new Zdog.Hemisphere({
      addTo: this.root,
      color: '#993',
      diameter: 40,
      translate: { z: 50, x: 0, y: 0 },
      stroke: false,
      backface: '#933',
    })
    illo.updateRenderGraph()
    setImmediate(() => {
      this.unregisterDrag = this.registerDragGraphic(illo, this.draggerGraphic)
      this.unregisterInput = this.registerPort({
        graphic: this.input,
        type: 'input',
        nodeId: this.nodeId,
        index: 0,
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
    this.root.color = isSelected ? '#995' : '#441'
  }
}

Sin.prototype.inputs = [
  {
    type: 'event',
    args: n => [n.onEvent.bind(n)],
  },
]

Sin.prototype.outputs = [
  {
    type: 'buffer',
    connect: (n, node, index) => {
      n.gainNode.connect(...node.inputs[index].args(node))
    },
    disconnect: (n, node, index) => {
      n.gainNode.disconnect(...node.inputs[index].args(node))
    },
  },
]

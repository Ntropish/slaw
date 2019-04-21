import Brain from './Brain'
import Interface from 'components/nodeInterfaces/Curve.vue'
import { store } from '../index'

export default class Curve extends Brain {
  constructor(transporter, { id: nodeId, data }) {
    super(transporter)
    this.constantSource = transporter.context.createConstantSource()
    this.constantSource.offset.value = (data && data.value) || 0
    this.constantSource.start()
    this.nodeId = nodeId

    transporter.on('play', this.onPlay.bind(this))
    transporter.on('clear', () => {
      this.constantSource.offset.cancelScheduledValues(0)
      this.constantSource.offset.setTargetAtTime(0, 0, 0.001)
    })
  }

  onPlay({ now, position }) {
    const curveId = store.state.nodes[this.nodeId].data.curveId
    const points = store.state.curves[curveId].points
    points.forEach((point, i) => {
      const beatDifference = point.beat - position
      const timeDifference = beatDifference / this.transporter.bps
      const time = now + timeDifference
      if (i === 0) {
        this.constantSource.offset.setTargetAtTime(point.value, time, 0.002)
      } else {
        this.constantSource.offset.linearRampToValueAtTime(point.value, time)
      }
    })
  }

  set value(value) {
    const parsedValue = parseFloat(value)
    if (isNaN(parsedValue)) return
    store.commit('SET_NODE_DATA', {
      id: this.nodeId,
      data: { value: parsedValue },
    })
    this.constantSource.offset.value = parsedValue
  }

  get value() {
    return store.state.nodes[this.nodeId].data.value
  }
}

Curve.title = 'Curve'

Curve.prototype.inputs = []

Curve.prototype.outputs = [
  {
    type: 'buffer',
    connect: (n, node, index) => {
      n.constantSource.connect(...node.inputs[index].args(node))
    },
    disconnect: (n, node, index) => {
      // A delay could be added here to prevent clicking
      n.constantSource.disconnect(...node.inputs[index].args(node))
    },
  },
]

Curve.interface = Interface

import Brain from './Brain'
import Interface from 'components/nodeInterfaces/Curve.vue'
import { store } from '../index'

export default class Parameter extends Brain {
  constructor(transporter, { id: nodeId, data }) {
    super(transporter)
    this.constantSource = transporter.context.createConstantSource()
    this.constantSource.offset.value = (data && data.value) || 0
    this.constantSource.start()
    this.nodeId = nodeId
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

Parameter.title = 'Curve'

Parameter.prototype.inputs = []

Parameter.prototype.outputs = [
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

Parameter.interface = Interface

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

    transporter.on('play', ({ now, position }) => {
      const curveId = store.state.nodes[this.nodeId].data.curveId
      const curve = store.state.curves[curveId]
      console.log(data, store.state.nodes[this.nodeId].data.curveId)
      const pointBelow = curve.points
        .slice(1, curve.points.length - 1)
        .reduce((result, candidate) => {
          if (candidate.beat < position) {
            if (!result) return candidate
            if (candidate.beat > result.beat) return candidate
            return result
          }
        }, null)
      const scheduleFrom = pointBelow ? curve.points.indexOf(pointBelow) + 1 : 0

      // if (!pointBelow) {

      // }

      // Send events in this schedule chunk in order
      // Object.values(store.getters.eventsOfTrack(trackId))
      //   .filter(
      //     event =>
      //       event.beat >= data.beat && event.beat < data.beat + data.beats,
      //   )
      //   .map(event => {
      //     const now = transporter.context.getOutputTimestamp().contextTime
      //     const time = data.at + (event.beat - data.beat) / transporter.bps
      //     return { ...event, time }
      //   })
      //   .sort(timeSort)
      //   .forEach(event => {
      //     this.eventSender.dispatchEvent(
      //       new CustomEvent('event', { detail: event }),
      //     )
      //   })
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

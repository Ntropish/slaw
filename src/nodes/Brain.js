export default class NodeInterface {
  constructor(transporter) {
    this.transporter = transporter
    this.id = NodeInterface.lastId++
  }
  connect(brain, outputIndex, inputIndex) {
    // ports must exist
    if (
      (!this.outputs && !this.outputs[outputIndex]) ||
      (!brain.inputs && !brain.inputs[inputIndex])
    )
      return false
    // edge type must match
    if (this.outputs[outputIndex].type !== brain.inputs[inputIndex].type)
      return false
    this.outputs[outputIndex].connect(this, brain, inputIndex)
  }
}

NodeInterface.lastId = 0

export default class NodeInterface {
  constructor(transporter) {
    this.transporter = transporter
    this.id = NodeInterface.lastId++
  }
  connect(node, outputIndex, inputIndex) {
    // Auto choose input/outputs
    if (typeof outputIndex !== 'number' && typeof inputIndex !== 'number') {
      const inputTypes = node.inputs.map(input => input.type)
      const outputTypes = node.outputs.map(input => input.type)

      for (let i = 0; i < inputTypes.length; i++) {
        const j = outputTypes.indexOf(inputTypes[i])
        if (j !== -1) {
          inputIndex = i
          outputIndex = j
        }
      }
    }

    // ports must exist
    if (
      (!this.outputs && !this.outputs[outputIndex]) ||
      (!node.inputs && !node.inputs[inputIndex])
    )
      return false
    // edge type must match
    if (this.outputs[outputIndex].type !== node.inputs[inputIndex].type)
      return false
    this.outputs[outputIndex].connect(node, inputIndex)
  }
}

NodeInterface.lastId = 0

export function connect(node, outputIndex, inputIndex) {
  console.log('connect:', outputIndex, ' -> ', outputIndex, node)

  // edge type must match
  if (this.outputs[outputIndex].type !== node.inputs[inputIndex].type)
    return false
  this.outputs[outputIndex].connect(node, inputIndex)
  node.inputs[inputIndex].connect(this, outputIndex)
}

export function connect(node, outputIndex, inputIndex) {
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

  console.log('connect:', outputIndex, ' -> ', outputIndex, this, node)

  // edge type must match
  if (this.outputs[outputIndex].type !== node.inputs[inputIndex].type)
    return false
  this.outputs[outputIndex].connect(node, inputIndex)
}

export function timeSort({ time: aTime }, { time: bTime }) {
  return aTime - bTime
}

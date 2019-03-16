// The code in the main global scope.
export default class MyWorkletNode extends AudioWorkletNode {
  constructor(context) {
    super(context, 'my-worklet-processor')
  }
}

export const processors = ['processors/MyWorkletProcessor.js']

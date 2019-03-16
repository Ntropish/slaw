// This is "processor.js" file, evaluated in AudioWorkletGlobalScope upon
// audioWorklet.addModule() call in the main global scope.
class MyWorkletProcessor extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      {
        name: 'myParam',
        defaultValue: 0.8,
      },
    ]
  }
  constructor() {
    super()
  }

  process(inputs, outputs, parameters) {
    // audio processing code here.
    const { 0: inputChannel0 } = inputs[0]
    const { 0: outputChannel0 } = outputs[0]
    const { myParam } = parameters.myParam

    // if |myParam| has been a constant value during this render quantum, the
    // length of the array would be 1.
    if (myParam.length === 1) {
      // Simple gain (multiplication) processing over a render quantum
      // (128 samples). This processor only supports the mono channel.
      for (let i = 0; i < inputChannel0.length; ++i) {
        outputChannel0[i] = inputChannel0[i] * myParam[0]
      }
    } else {
      for (let i = 0; i < inputChannel0.length; ++i) {
        outputChannel0[i] = inputChannel0[i] * myParam[i]
      }
    }

    return true
  }
}

registerProcessor('my-worklet-processor', MyWorkletProcessor)

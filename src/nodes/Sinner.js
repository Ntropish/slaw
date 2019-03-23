export default class Sinner extends OscillatorNode {
  constructor(context) {
    super(context, 'port-processor')
    this.port.onmessage = event => {
      // Handling data from the processor.
      console.log(event.data) // eslint-ignore-line
    }

    this.port.postMessage('Hello!')
  }
}

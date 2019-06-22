import brainFactory from './Brain'

export default function destinationFactory(transporter) {
  return brainFactory({
    inputs: [['buffer', () => [transporter.context.destination]]],
  })
}

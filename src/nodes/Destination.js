import { connect, timeSort } from './util'

export default function DestinationFactory(transporter) {
  return {
    connect,
    outputs: [],
    inputs: [
      {
        type: 'buffer',
        // Connect to
        args: [transporter.context.destination],
      },
    ],
  }
}

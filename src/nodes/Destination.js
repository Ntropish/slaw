import Brain from './Brain'

export default class Destination extends Brain {}

Destination.inputs = [
  {
    type: 'buffer',
    args: n => n.transporter.context.destination,
  },
]

Destination.outputs = []

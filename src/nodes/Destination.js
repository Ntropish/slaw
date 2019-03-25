import Brain from './Brain'

export default class Destination extends Brain {}

Destination.prototype.inputs = [
  {
    type: 'buffer',
    args: n => [n.transporter.context.destination],
  },
]

Destination.prototype.outputs = []

import { connect } from './util'

export default function ADSRFactory({ context, bps }) {
  const gainNode = context.createGain()
  const asdr = [0.1, 0.3, 0.1, 0.2]

  function onEvent({ beats, time }) {
    const noteEnd = time + beats / bps
    const [a, d, s, r] = asdr

    gainNode.gain.setValueAtTime(0, time)
    // Math min to make sure gain doesn't come in after note should be stopping
    gainNode.gain.linearRampToValueAtTime(0.8, Math.min(noteEnd, time + a))
    gainNode.gain.linearRampToValueAtTime(s, Math.min(noteEnd, time + a + d))
    gainNode.gain.setValueAtTime(s, noteEnd)
    gainNode.gain.linearRampToValueAtTime(0, noteEnd + r)
  }

  return {
    connect,
    inputs: [
      {
        type: 'buffer',
        // Connect to
        args: [this.gainNode],
      },
      {
        type: 'event',
        args: [onEvent],
      },
    ],
    outputs: [
      {
        type: 'buffer',
        connect: (node, index) => {
          this.gainNode.connect(...node.inputs[index].args)
        },
        disconnect: (node, index) => {
          this.gainNode.disconnect(...node.inputs[index].args)
        },
      },
    ],
  }
}

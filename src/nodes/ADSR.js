import { connect } from './util'

export default function ADSRFactory(transporter) {
  const { context, bps } = transporter
  const gainNode = context.createGain()
  const adsr = [0.1, 0.3, 0.1, 0.2]

  transporter.on('clear', () => {
    gainNode.gain.cancelScheduledValues(
      context.getOutputTimestamp().contextTime,
    )
    gainNode.gain.setValueAtTime(0, context.getOutputTimestamp().contextTime)
  })

  function onEvent({ detail: { beats, time } }) {
    const noteEnd = time + beats / bps
    const [a, d, s, r] = adsr

    gainNode.gain.setValueAtTime(0, time)
    // Math min to make sure gain doesn't come in after note should be stopping
    gainNode.gain.linearRampToValueAtTime(0.8, Math.min(noteEnd, time + a))
    gainNode.gain.linearRampToValueAtTime(s, Math.min(noteEnd, time + a + d))
    gainNode.gain.setValueAtTime(s, noteEnd)
    gainNode.gain.linearRampToValueAtTime(0, noteEnd + r)
  }

  function stop(_time) {
    const time = _time || context.getOutputTimestamp().contextTime
    gainNode.gain.cancelScheduledValues(time)
    gainNode.gain.setTargetAtTime(0, time + 0.1)
  }

  return {
    connect,
    stop,
    inputs: [
      {
        type: 'buffer',
        // Connect to
        args: [gainNode],
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
          gainNode.connect(...node.inputs[index].args)
        },
        disconnect: (node, index) => {
          gainNode.disconnect(...node.inputs[index].args)
        },
      },
    ],
  }
}

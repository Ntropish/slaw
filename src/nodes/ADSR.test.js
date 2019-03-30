import ADSR from './ADSR'
// import Transporter from '../modules/Transporter'

// // jest.mock('./ADSR')
// jest.mock('./Transporter')

// beforeEach(() => {
//   // ADSR.mockClear()
//   Transporter.mockClear()
// })

test('schedules an envelope correctly', () => {
  const [env, spy] = buildMocks()
  env.adsr = [0.1, 0.2, 0.3, 0.5]

  env.onEvent({ detail: { beats: 1, time: 0.5, data: {} } })
  expect(spy.mock.calls).toEqual([
    ['cancel'],
    ['set', 0, 0.5],
    ['ramp', 1, 0.6],
    ['ramp', 0.3, 0.8],
    ['ramp', 0.3, 1.5],
    ['ramp', 0, 2],
  ])
})

test('schedules a second envelope correctly', () => {
  const [env, spy] = buildMocks()
  env.adsr = [0.1, 0.2, 0.3, 0.5]

  env.onEvent({ detail: { beats: 1, time: 0.5, data: {} } })
  spy.mockClear()
  env.onEvent({ detail: { beats: 1, time: 2.5, data: {} } })

  // Values can be 0.000000001 off, this checks that they're close
  // and doesn't need them to be equal
  ;[
    ['cancel'],
    ['set', 0, 0.5],
    ['ramp', 1, 0.6],
    ['ramp', 0.3, 0.8],
    ['ramp', 0.3, 1.5],
    ['ramp', 0, 2],
    ['set', 0, 2.5],
    ['ramp', 1, 2.6],
    ['ramp', 0.3, 2.8],
    ['ramp', 0.3, 3.5],
    ['ramp', 0, 4],
  ].forEach((call, i) => {
    expect(spy.mock.calls[i][0]).toEqual(call[0])
    for (let num = 1; num < call.length; num++) {
      expect(Math.abs(spy.mock.calls[i][num] - call[num])).toBeLessThan(0.001)
    }
  })
})

function buildMocks() {
  const spy = jest.fn()
  const gainWatcher = {
    gain: {
      setValueAtTime: (...args) => spy('set', ...args),
      setTargetAtTime: (...args) => spy('target', ...args),
      linearRampToValueAtTime: (...args) => spy('ramp', ...args),
      cancelScheduledValues: (...args) => spy('cancel', ...args),
    },
  }
  const transporter = {
    context: {
      createGain: () => gainWatcher,
    },
    on: () => {},
    bps: 1,
  }
  // const transporter = new Transporter(0)
  const env = new ADSR(transporter)
  return [env, spy]
}

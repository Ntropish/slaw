import ADSR from './ADSR'

expect.extend({
  // This is all for the fact that numbers can be off by 0.00001-ish
  // Unlike toEqual this just makes sure numbers are close
  toMatchParamCallList(recieved, list) {
    for (const [i, call] of Object.entries(list)) {
      if (recieved[i][0] !== call[0]) {
        return {
          pass: false,
          message: () =>
            `expected call ${i}, "${recieved[i][0]}", to be "${call[0]}"`,
        }
      }
      for (let num = 1; num < call.length; num++) {
        if (Math.abs(recieved[i][num] - call[num]) > 0.001) {
          return {
            pass: false,
            message: () =>
              `expected "${
                call[0]
              }" call numbers to match for call ${i} and argument ${num}\n\nRecieved: ${
                recieved[i][num]
              }\n\nExpected: ${call[num]} `,
          }
        }
      }
    }
    return {
      pass: true,
    }
  },
})

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

  expect(spy.mock.calls).toMatchParamCallList([
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
  ])
})

test('schedules a retrigger envelope intersecting previous release', () => {
  const [env, spy] = buildMocks()
  env.adsr = [0.1, 0.2, 0.3, 0.5]

  env.onEvent({ detail: { beats: 1, time: 0.5, data: {} } })
  spy.mockClear()
  env.onEvent({ detail: { beats: 1, time: 1.6, data: {} } })

  expect(spy.mock.calls).toMatchParamCallList([
    ['cancel'],
    ['set', 0, 0.5],
    ['ramp', 1, 0.6],
    ['ramp', 0.3, 0.8],
    ['ramp', 0.3, 1.5],
    ['ramp', 0, 2],
    ['cancel', 1.69],
    ['ramp', 0.905, 1.69],
    ['ramp', 1, 1.7],
    ['ramp', 0.3, 1.9],
    ['ramp', 0.3, 2.6],
    ['ramp', 0, 3.1],
  ])
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

import ADSR from './ADSR'
import { watchMaker } from '../test/util'

test('schedules an envelope correctly', () => {
  const [env, gainWatcher] = buildMocks()
  env.adsr = [0.1, 0.2, 0.3, 0.5]

  env.onEvent({ detail: { beats: 1, time: 0.5, data: {} } })
  expect(gainWatcher.$calls).toEqual(
    [
      [['cancelScheduledValues'], [42]], // 42 comes from "contextTime" in the mock
      [['setValueAtTime'], [0, 0.5]],
      [['linearRampToValueAtTime'], [1, 0.6]],
      [['linearRampToValueAtTime'], [0.3, 0.8]],
      [['linearRampToValueAtTime'], [0.3, 1.5]],
      [['linearRampToValueAtTime'], [0, 2]],
    ],
    { threashold: 0.001 },
  )
})

test('schedules a second envelope correctly', () => {
  const [env, gainWatcher] = buildMocks()
  env.adsr = [0.1, 0.2, 0.3, 0.5]

  env.onEvent({ detail: { beats: 1, time: 0.5, data: {} } })
  gainWatcher.$clear()
  env.onEvent({ detail: { beats: 1, time: 2.5, data: {} } })

  expect(gainWatcher.$calls).toMatchParamCallList(
    [
      [['cancelScheduledValues'], [42]],
      [['setValueAtTime'], [0, 0.5]],
      [['linearRampToValueAtTime'], [1, 0.6]],
      [['linearRampToValueAtTime'], [0.3, 0.8]],
      [['linearRampToValueAtTime'], [0.3, 1.5]],
      [['linearRampToValueAtTime'], [0, 2]],
      [['setValueAtTime'], [0, 2.5]],
      [['linearRampToValueAtTime'], [1, 2.6]],
      [['linearRampToValueAtTime'], [0.3, 2.8]],
      [['linearRampToValueAtTime'], [0.3, 3.5]],
      [['linearRampToValueAtTime'], [0, 4]],
    ],
    { threashold: 0.001 },
  )
})

test('schedules a retrigger envelope intersecting previous release', () => {
  const [env, gainWatcher] = buildMocks()
  env.adsr = [0.1, 0.2, 0.3, 0.5]

  env.onEvent({ detail: { beats: 1, time: 0.5, data: {} } })
  gainWatcher.$clear()
  env.onEvent({ detail: { beats: 1, time: 1.6, data: {} } })

  expect(gainWatcher.$calls).toMatchParamCallList(
    [
      [['cancelScheduledValues'], [42]],
      [['setValueAtTime'], [0, 0.5]],
      [['linearRampToValueAtTime'], [1, 0.6]],
      [['linearRampToValueAtTime'], [0.3, 0.8]],
      [['linearRampToValueAtTime'], [0.3, 1.5]],
      [['linearRampToValueAtTime'], [0, 2]],

      // Envelope intersects at beat/second 1.69 so
      // everything after that is canceled and the new
      // envelope is scheduled on top. 0.905 is the value
      // at the intersection point
      [['cancelScheduledValues'], [1.69]],
      [['linearRampToValueAtTime'], [0.905, 1.69]],
      [['linearRampToValueAtTime'], [1, 1.7]],
      [['linearRampToValueAtTime'], [0.3, 1.9]],
      [['linearRampToValueAtTime'], [0.3, 2.6]],
      [['linearRampToValueAtTime'], [0, 3.1]],
    ],
    { threashold: 0.001 },
  )
})

function buildMocks() {
  const gainWatcher = {
    gain: watchMaker(),
  }
  const transporter = {
    context: {
      createGain: () => gainWatcher,
      getOutputTimestamp: () => ({
        contextTime: 42,
      }),
    },
    on: () => {},
    bps: 1,
  }
  const env = new ADSR(transporter)
  return [env, gainWatcher.gain]
}

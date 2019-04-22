import Curve from './Curve'
import { watchMaker } from '../test/util'

jest.mock('components/nodeInterfaces/Curve.vue')
jest.mock('../index.js')

test('schedules a basic curve', () => {
  expect(true).toEqual(true)
  const [curve, watcher] = buildMocks('testNode01')
  curve.onPlay({ position: 0, now: 0 })
  expect(watcher.$calls).toMatchParamCallList(
    [
      [['start'], []],
      [['offset', 'setTargetAtTime'], [0, 0, 0.002]],
      [['offset', 'linearRampToValueAtTime'], [1, 1]],
      [['offset', 'linearRampToValueAtTime'], [0, 2.3]],
      [['offset', 'setTargetAtTime'], [0, 2.3, 0.003]],
    ],
    { threashold: 0.01 },
  )
})

test('schedules a curve starting above zero', () => {
  expect(true).toEqual(true)
  const [curve, watcher] = buildMocks('testNode02')
  curve.onPlay({ position: 0, now: 0 })
  expect(watcher.$calls).toMatchParamCallList(
    [
      [['start'], []],
      [['offset', 'setTargetAtTime'], [1, 2, 0.002]],
      [['offset', 'setTargetAtTime'], [0.1, 2.1, 0.003]],
      [['offset', 'linearRampToValueAtTime'], [0, 2.3]],
      [['offset', 'setTargetAtTime'], [0, 2.3, 0.003]],
    ],
    { threashold: 0.01 },
  )
})

function buildMocks(nodeId) {
  const constantSourceWatcher = watchMaker()
  const transporter = {
    context: {
      createConstantSource: () => constantSourceWatcher,
      getOutputTimestamp: () => ({
        contextTime: 42,
      }),
    },
    on: () => {},
    bps: 1,
    bpm: 60,
  }
  const curve = new Curve(transporter, { id: nodeId, data: {} })
  return [curve, constantSourceWatcher]
}

import { ValueScheduler } from './util'

test('adding an event works', () => {
  const scheduler = ValueScheduler(false)
  scheduler.addEvent(0.2, 0.5, true)
  expect(scheduler.schedulings).toEqual([
    { time: 0.2, value: true },
    { time: 0.5, value: false },
  ])
})

test('adding event inside another event', () => {
  const scheduler = ValueScheduler(0)
  scheduler.addEvent(0.2, 0.5, 1)
  scheduler.addEvent(0.3, 0.4, 2)
  expect(scheduler.schedulings).toEqual([
    { time: 0.2, value: 1 },
    { time: 0.3, value: 2 },
    { time: 0.4, value: 1 },
    { time: 0.5, value: 0 },
  ])
})

test('adding event overlapping another events trailing edge', () => {
  const scheduler = ValueScheduler(0)
  scheduler.addEvent(0.2, 0.5, 1)
  scheduler.addEvent(0.3, 0.6, 2)
  expect(scheduler.schedulings).toEqual([
    { time: 0.2, value: 1 },
    { time: 0.3, value: 2 },
    { time: 0.6, value: 0 },
  ])
})

test('adding a trigger works', () => {
  const scheduler = ValueScheduler(false)
  scheduler.addTrigger(0.2, 0.5, true)
  expect(scheduler.schedulings).toEqual([
    { time: 0.2, value: true },
    { time: 0.5, value: false },
  ])
})

test('adding trigger inside another trigger', () => {
  const scheduler = ValueScheduler(0)
  scheduler.addTrigger(0.2, 0.5, 1)
  scheduler.addTrigger(0.3, 0.4, 2)
  expect(scheduler.schedulings).toEqual([
    { time: 0.2, value: 1 },
    { time: 0.3, value: 2 },
    { time: 0.5, value: 0 },
  ])
})

test('adding trigger overlapping another triggers falling edge', () => {
  const scheduler = ValueScheduler(0)
  scheduler.addTrigger(0.2, 0.5, 1)
  scheduler.addTrigger(0.3, 0.6, 2)
  expect(scheduler.schedulings).toEqual([
    { time: 0.2, value: 1 },
    { time: 0.3, value: 2 },
    { time: 0.6, value: 0 },
  ])
})

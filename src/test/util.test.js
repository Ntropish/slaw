import { watchMaker } from './util.js'

test('watches a basic function call', () => {
  const watcher = watchMaker()

  watcher.test.deep('args', 42)

  expect(watcher.$calls.length).toEqual(1)
  expect(watcher.$calls[0][0]).toEqual(['test', 'deep'])
  expect(watcher.$calls[0][1]).toEqual(['args', 42])
})

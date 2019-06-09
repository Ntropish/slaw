import { differ } from './util'

test('differ diffs a list addition', () => {
  const dif = differ.array([])
  expect(dif(['a']).add).toEqual(['a'])
})

test('differ diffs a list deletion', () => {
  const dif = differ.array(['a'])
  expect(dif([]).remove).toEqual(['a'])
})

test('differ diffs a list addition AND deletion', () => {
  const dif = differ.array(['a'])
  expect(dif(['b'])).toEqual({
    add: ['b'],
    remove: ['a'],
  })
})

test('differ diffs a clear', () => {
  const dif = differ.array(['a', 'b'])
  expect(dif([])).toEqual({
    add: [],
    remove: ['a', 'b'],
  })
})

test('differ keeps track of duplicates', () => {
  const dif = differ.array(['a', 'a'])
  expect(dif(['a'])).toEqual({
    add: [],
    remove: ['a'],
  })
})

test('differ keeps on diffing', () => {
  const dif = differ.array([])
  expect(dif([])).toEqual({
    add: [],
    remove: [],
  })
  expect(dif([])).toEqual({
    add: [],
    remove: [],
  })
  expect(dif(['a'])).toEqual({
    add: ['a'],
    remove: [],
  })
  expect(dif(['a'])).toEqual({
    add: [],
    remove: [],
  })
  expect(dif(['a'])).toEqual({
    add: [],
    remove: [],
  })
  expect(dif([])).toEqual({
    add: [],
    remove: ['a'],
  })
})

test('differ uses a custom diff function', () => {
  // Uses a custom case insensitive comparer
  const dif = differ.array(
    ['a', 'b'],
    (a, b) => a.toLowerCase() === b.toLowerCase(),
  )
  expect(dif(['A'])).toEqual({
    add: [],
    remove: ['b'],
  })
})

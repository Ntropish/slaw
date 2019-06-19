export function clamp(min, val, max) {
  return Math.max(min, Math.min(max, val))
}

// Small adapter, used for setting a promise for "loaded" state
// right as the application starts. Then, using an event
// handler later to resolve that promise.
export const callbackPromise = () => {
  let resolver
  let rejecter
  const promise = new Promise((resolve, reject) => {
    resolver = resolve
    rejecter = reject
  })
  return [promise, resolver, rejecter]
}

// Util for finding differences
export const differ = {
  // Finds differences in arrays and returns what has
  // been added in one list and what has been removed
  // in another
  array: (array, comparer) => {
    let lastArray = array
    return newArray => {
      const add = differ.arrayDifference(newArray, lastArray, comparer)
      const remove = differ.arrayDifference(lastArray, newArray, comparer)
      lastArray = newArray
      return {
        add,
        remove,
      }
    }
  },
  // For each item in b, the item is removed from a.
  // This method preserves the correct counts when
  // duplicates are present but with a speed tradeoff.
  arrayDifference: (a, b, _comparer) => {
    const comparer = _comparer || ((a, b) => a == b)
    const result = [...a]
    // Because I like FP too much, I would normally find all
    // of the indexes first by mapping b to those indexes, use
    // a filter to remove -1, and then use a forEach to splice
    // each one out. But, a splice would invalidate the other
    // indexes so the entire operation must be done at once
    for (const bItem of b) {
      const index = result.findIndex(a => comparer(a, bItem))
      if (index !== -1) {
        result.splice(index, 1)
      }
    }
    return result
  },
}

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

export const differ = {
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
  arrayDifference: (a, b, _comparer) => {
    const comparer = _comparer || ((a, b) => a == b)
    const result = [...a]
    for (const bItem of b) {
      const index = result.findIndex(a => comparer(a, bItem))
      if (index !== -1) {
        result.splice(index, 1)
      }
    }
    return result
  },
}

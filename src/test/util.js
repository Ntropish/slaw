expect.extend({
  // The watchers made by watchMaker below output the format used
  // by this matcher; an array of [path, arguments] tuples
  // Options:
  // threashold - A number that, if supplied, will assume all
  // arguments are numbers and allow them to be at most this far
  // apart from each other
  toMatchParamCallList(recieved, list, { threashold } = {}) {
    if (recieved.length !== list.length) {
      return {
        pass: false,
        message: () =>
          `length ${recieved.length} doesn't match the expected length of ${
            list.length
          }`,
      }
    }
    for (const [i, call] of Object.entries(list)) {
      const difference = findCallDifference(call, recieved[i], { threashold })
      if (difference) {
        return {
          pass: false,
          message: () => `${difference} in call ${i}`,
        }
      }
    }
    // If the above logic didn't fail the test then it passed!
    return {
      pass: true,
    }
  },
  // TODO: a toMatchSubCallList matcher could be nice
})

function findCallDifference(
  [recievedPath, recievedArgs],
  [path, args],
  { threashold } = {},
) {
  if (!Array.isArray(recievedPath)) {
    return `didn't recieve path array, got "${recievedPath}"`
  }
  if (!Array.isArray(recievedArgs)) {
    return `didn't recieve arg array, got "${recievedArgs}"`
  }
  if (recievedPath.length !== path.length) {
    return `path length [${recievedPath.join()}] doesn't match [${path.join()}]`
  }
  const pathDifference = path.reduce((difference, item, i) => {
    if (difference) return difference
    return item !== recievedPath[i]
      ? `path [${recievedPath.join()}] doesn't match [${path.join()}]`
      : false
  }, false)
  if (pathDifference) return pathDifference

  if (recievedArgs.length !== args.length) {
    return `arguments length [${recievedArgs.join()}] doesn't match [${args.join()}]`
  }

  const argComparer = threashold
    ? (a, b) => a - b > threashold
    : (a, b) => a !== b

  const argsDifference = args.reduce((difference, item, i) => {
    if (difference) return difference
    return difference || argComparer(item, recievedArgs[i])
      ? `arguments [${recievedArgs.join()}] don't match [${args.join()}]`
      : false
  }, false)

  if (argsDifference) return argsDifference
}

export function watchMaker(target = () => {}, path = []) {
  let children = []
  const calls = []
  const handler = {
    get: (target, prop) => {
      if (prop === '$calls') return getCalls()
      if (prop === '$clear') return clear
      const newProxy = watchMaker(target, path.concat(prop))
      children.push(newProxy)
      return newProxy
    },
    apply: (target, thisArg, argumentList) => {
      calls.push([path, argumentList])
    },
  }
  function clear() {
    children = []
    children.forEach(child => child.$clear())
  }
  function getCalls() {
    return calls.concat(
      ...children.map(watcher => watcher.$calls).filter(arr => arr.length),
    )
  }
  return new Proxy(target, handler)
}

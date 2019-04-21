export function watchMaker(target = () => {}, path = []) {
  const children = []
  const calls = []
  const handler = {
    get: (target, prop) => {
      if (prop === '$calls') return getCalls()
      const newProxy = watchMaker(target, path.concat(prop))
      children.push(newProxy)
      return newProxy
    },
    apply: (target, thisArg, argumentList) => {
      calls.push([path, argumentList])
    },
  }
  function getCalls() {
    return calls.concat(
      ...children.map(watcher => watcher.$calls).filter(arr => arr.length),
    )
  }
  return new Proxy(target, handler)
}

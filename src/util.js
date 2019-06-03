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

export function timeSort({ time: aTime }, { time: bTime }) {
  return aTime - bTime
}

export function pitchToFrequency(pitch) {
  return 440 * 2 ** (pitch / 1200)
}

export function ValueScheduler(defaultValue = false) {
  const api = {
    schedulings: [],
    addEvent,
    addTrigger,
    scan,
    scanForward,
  }

  return api

  function addEvent(startTime, endTime, value) {
    const endState = scan(endTime)

    // Remove schedulings in the middle with 1ms of extra width
    api.schedulings = api.schedulings.filter(
      scheduling =>
        scheduling.time + 0.001 < startTime ||
        scheduling.time - 0.001 > endTime,
    )

    // Then just add the start and end schedulings at their respective positions
    const originalValue = endState ? endState.value : defaultValue
    api.schedulings.push({ time: startTime, value })
    api.schedulings.push({ time: endTime, value: originalValue })

    api.schedulings = api.schedulings.sort(timeSort)
  }

  function addTrigger(startTime, endTime, value) {
    // Remove schedulings in the middle with 1ms of extra width
    api.schedulings = api.schedulings.filter(
      scheduling =>
        scheduling.time + 0.001 < startTime ||
        scheduling.time - 0.001 > endTime,
    )

    api.schedulings.push({ time: startTime, value })
    const nextState = scanForward(startTime)
    if (!nextState) {
      api.schedulings.push({ time: endTime, value: defaultValue })
    }

    api.schedulings = api.schedulings.sort(timeSort)
  }

  // Find the highest timed event below or equal the time
  function scanForward(time) {
    const result = api.schedulings.reduce((acc, event) => {
      if (!acc && event.time > time) return event
      if (acc && event.time < acc.time && event.time >= time) return event
      return acc
    }, null)
    return result
  }

  // Find the highest timed event below or equal the time
  function scan(time) {
    const result = api.schedulings.reduce((acc, event) => {
      if (!acc && event.time < time) return event
      if (acc && event.time > acc.time && event.time <= time) return event
      return acc
    }, null)
    return result
  }
}

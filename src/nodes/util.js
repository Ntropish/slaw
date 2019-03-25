export function timeSort({ time: aTime }, { time: bTime }) {
  return aTime - bTime
}

export function pitchToFrequency(pitch) {
  return 440 * 2 ** (pitch / 1200)
}

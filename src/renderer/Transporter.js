import EventEmitter from 'events'

export default class Transporter extends EventEmitter {
  constructor(context, position) {
    super()
    // Position is in beats, beats after this still need to be scheduled
    this.position = position
    // Store this to make calculating stuff easier
    this.startPosition = position
    this.bpm = 80
    this.bps = this.bpm / 60
    this.bpms = this.bps / 1000

    this.lastSchedule = 0
    this.scheduleAhead = 100
    this.scheduleSize = 30
    this.scheduleBeatsSize = this.scheduleSize * 60000 * this.bpm
    this.timerID = null
    this.context = context
    this.isPlaying = false
  }

  play() {
    if (this.isPlaying) return
    this.isPlaying = true
    this.jump(this.position)
    this.schedule()
  }

  pause() {
    if (!this.isPlaying) return
    window.clearTimeout(this.timerID)
    this.emit('clear')
    this.emit('positionUpdate', this.currentPosition)
    this.position = this.currentPosition
    this.isPlaying = false
  }

  jump(time) {
    if (this.isPlaying) this.emit('clear')
    this.position = time
    this.startPosition = time
    this.startTime = this.context.getOutputTimestamp().contextTime
    this.emit('positionUpdate', this.currentPosition)
  }

  // This function automatically speeds up or slows down
  // to try to maintain a lead of this.scheduleAhead ms on current time
  schedule() {
    // positionUpdate is mostly just to update time cursor
    // Could be moved to a setInterval instead of here
    const currentPosition = this.currentPosition
    this.emit('positionUpdate', currentPosition)

    // This is how far ahead things are currently scheduled
    const ahead = this.position - currentPosition

    // Number of ms needed to schedule to maintain scheduleAhead
    const schedulingNeeded = this.scheduleAhead - ahead / this.bpms

    const nextSchedule = Math.max(0, ahead) / this.bpms

    // Number of beats going to be scheduled in this function call
    const beats = clamp(0, schedulingNeeded * this.bpms, this.scheduleBeatsSize)
    this.emit('schedule', {
      beat: this.position,
      after: ahead,
      beats,
    })
    this.position += beats
    this.timerID = window.setTimeout(this.schedule.bind(this), nextSchedule)
  }

  // Only really valid while playing
  get currentPosition() {
    const now = this.context.getOutputTimestamp().contextTime
    return this.startPosition + (now - this.startTime) * this.bps
  }
}

function clamp(min, val, max) {
  return Math.max(min, Math.min(max, val))
}

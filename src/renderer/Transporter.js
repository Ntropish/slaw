import EventEmitter from 'events'

export default class Transporter extends EventEmitter {
  constructor(context) {
    super()
    this.position = 0
    this.bpm = 80
    this.lastSchedule = 0
    this.scheduleAhead = 100
    this.scheduleSize = 20
    this.timerID = null
    this.context = context
    this.isPlaying = false

    // Tracks the last scheduling so
    // current position can be calculated on pause
    this.lastPosition = this.position
    this.lastNow = 0
    this.lastAfter = 0
  }

  play(start) {
    this.isPlaying = true
    window.clearTimeout(this.timerID)
    if (typeof start === 'number') this.position = start
    this.lastSchedule = this.context.getOutputTimestamp().contextTime * 1000
    this.schedule()
  }

  pause(start) {
    if (this.isPlaying) {
      window.clearTimeout(this.timerID)
      if (typeof start === 'number') this.position = start
      this.emit('clear')
    }
    const now = this.context.getOutputTimestamp().contextTime
    let beat = start
    // If an exact time wasn't given we have to calculate the current position
    // (Only the buffered position is tracked)
    if (typeof start !== 'number') {
      const timeDiff = now - this.lastNow
      beat =
        this.lastPosition - ((this.lastAfter + timeDiff) / 60000) * this.bpm
    }

    this.emit('schedule', {
      beat,
      now: now,
      after: 0,
      beats: 0,
    })
    this.isPlaying = false
  }

  jump(time) {
    if (this.isPlaying) {
      this.play(time)
    } else {
      this.pause(time)
    }
  }

  // This function automatically speeds up or slows down
  // to try to maintain a lead of this.scheduleAhead ms
  schedule() {
    const now = this.context.getOutputTimestamp().contextTime

    const after = this.lastSchedule - now * 1000

    // // Number of beats progressed
    const beats = (this.scheduleSize / 60000) * this.bpm

    this.emit('schedule', {
      beat: this.position,
      now: now,
      after,
      beats,
    })
    this.position += beats

    this.lastPosition = this.position
    this.lastNow = now
    this.lastAfter = after

    this.lastSchedule += this.scheduleSize

    // Always work off of these context given times to maintain parity
    const schedulingNeeded = this.scheduleAhead - after
    const nextSchedule = Math.max(20, -schedulingNeeded)
    this.timerID = window.setTimeout(() => {
      // requestAnimationFrame(() => this.schedule())
      this.schedule()
    }, nextSchedule)
  }
}

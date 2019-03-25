import EventEmitter from 'events'
import { clamp } from '../util'

export default class Transporter extends EventEmitter {
  constructor(context, position) {
    super()
    // Position is in beats, beats after this still need to be scheduled
    this.position = position || 0
    // Store this to make calculating stuff easier
    this.startPosition = this.position
    this.bpm = 80
    this.bps = this.bpm / 60
    this.bpms = this.bps / 1000

    this.lastSchedule = 0
    this.scheduleAhead = 5000
    this.scheduleSize = 10
    this.scheduleBeatsSize = this.scheduleSize * 60000 * this.bpm
    this.timerID = null
    this.positionUpdateID = null
    this.context = context
    this.isPlaying = false
  }

  play() {
    const now = this.context.getOutputTimestamp().contextTime

    console.log('play?', now)
    if (this.isPlaying) return
    this.isPlaying = true
    this.jump(this.position)
    this.schedule()
    // Update 60 times a second
    this.positionUpdateID = setInterval(() => {
      this.emit('positionUpdate', this.currentPosition)
    }, 16)
  }

  pause() {
    if (!this.isPlaying) return
    window.clearInterval(this.positionUpdateID)
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
    const now = this.context.getOutputTimestamp().contextTime

    // This is how far ahead things are currently scheduled
    const ahead = this.position - this.currentPosition

    // Number of ms needed to schedule to maintain scheduleAhead
    const schedulingNeeded = this.scheduleAhead - ahead / this.bpms

    const nextSchedule = Math.max(0, ahead) / this.bpms

    // Number of beats going to be scheduled in this function call
    const beats = clamp(0, schedulingNeeded * this.bpms, this.scheduleBeatsSize)
    this.emit('schedule', {
      beat: this.position,
      after: ahead,
      at: now + ahead,
      beats,
      now,
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

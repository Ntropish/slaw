import { Store } from 'vuex'
import Transporter from 'modules/Transporter'
import { getDiffieHellman } from 'crypto'

const lastIds = {
  event: 3,
}
function getId(type) {
  let id = lastIds[type] || 0
  lastIds[type] += 1
  return (id + 1).toString()
}

export default () => {
  return new Store({
    state: {
      selectedTrackId: '',
      transporter: null,
      playbackStart: 0,
      beatSnap: 1 / 4,
      pianoSnap: 100,
      events: {},
      tracks: {},
      nodes: {},
      edges: {},
      keyboardState: [],
      mouseState: [],
    },
    mutations: {
      SET_NODES(state, nodes) {
        state.nodes = nodes
      },
      SET_EDGES(state, edges) {
        state.edges = edges
      },
      SET_EVENTS(state, events) {
        state.events = events
      },
      SET_EVENT(state, event) {
        state.events[event.id] = event
      },
      COPY_EVENTS(state, { eventIds, trackId }) {
        for (const id of eventIds) {
          const newNoteId = getId('event')
          const copyFrom = state.events[id]
          state.events[newNoteId] = {
            ...copyFrom,
            id: newNoteId,
          }
          state.tracks[trackId].events.push(newNoteId)
        }
      },
      QUANTIZE_EVENTS(state, { eventIds }) {
        for (const id of eventIds) {
          const event = state.events[id]
          event.beat = Math.round(event.beat / state.beatSnap) * state.beatSnap
          event.beats =
            Math.round(event.beats / state.beatSnap) * state.beatSnap
        }
      },
      SET_TRACKS(state, tracks) {
        state.tracks = tracks
      },
      SET_SELECTED_TRACK(state, id) {
        state.selectedTrackId = id
      },
      BUILD_TRANSPORTER(state) {
        state.transporter = new Transporter(new AudioContext())
      },
      SET_PLAYBACK_START(state, beat) {
        state.playbackStart = beat
      },
    },
    actions: {
      fetchSomething(context) {
        // context.commit ('SET_NODES', [])
        // do async stuff
        // do more commits
      },
    },
    getters: {
      eventsOfTrack(state) {
        return id => {
          const track = state.tracks[id]
          if (!track) return []
          return track.events.map(id => state.events[id])
        }
      },
    },
  })
}

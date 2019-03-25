import { Store } from 'vuex'
import Transporter from 'modules/Transporter'
import inputTracker from './inputTracker'
import nodeMap from 'nodes'

const lastIds = {
  event: 4,
}
function getId(type) {
  let id = lastIds[type] || 0
  lastIds[type] += 1
  return (id + 1).toString()
}

export default () => {
  const store = new Store({
    state: {
      selectedTrackId: '',
      transporter: null,
      playbackStart: 0,
      beatSnap: 1 / 4,
      centsSnap: 100,
      events: {},
      tracks: {},
      nodes: {},
      brains: {},
      edges: {},
      keyboardState: [],
      mouseState: [],
      // Last element clicked - scan upwards to see the focus
      focus: null,
    },
    mutations: {
      BRAINIFY_NODE(state, { nodeId }) {
        const node = state.nodes[nodeId]
        const brain = new nodeMap[node.type](node.data)
        node.brain = brain.id
        state.brains[brain.id] = brain
      },
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
      ADD_MOUSE_BUTTON(state, button) {
        if (!state.mouseState.includes(button)) state.mouseState.push(button)
      },
      REMOVE_MOUSE_BUTTON(state, button) {
        const index = state.mouseState.indexOf(button)
        if (index !== -1) state.mouseState.splice(index)
      },
      ADD_KEYBOARD_KEY(state, key) {
        if (!state.keyboardState.includes(key)) state.keyboardState.push(key)
      },
      REMOVE_KEYBOARD_KEY(state, key) {
        const index = state.keyboardState.indexOf(key)
        if (index !== -1) state.keyboardState.splice(index, 1)
      },
      FOCUS_ELEMENT(state, element) {
        state.focus = element
      },
    },
    actions: {
      fetchSomething(context) {
        // context.commit ('SET_NODES', [])
        // do async stuff
        // do more commits
      },
      makeTransporter(context) {
        if (context.state.transporter) return
        context.commit('BUILD_TRANSPORTER')
        for (const node of Object.keys(context.state.nodes)) {
          context.commit('BRAINIFY_NODE', node)
        }
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
  inputTracker(store)
  return store
}

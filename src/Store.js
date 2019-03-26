import { Store } from 'vuex'
import Transporter from 'modules/Transporter'
import inputTracker from './inputTracker'
import nodeMap from 'nodes'
import Vue from 'vue'

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
      transporter: new Transporter(),
      playbackStart: 0,
      playbackPosition: 0,
      beatSnap: 1 / 4,
      centsSnap: 100,
      events: {},
      tracks: {},
      nodes: {},
      brains: {},
      edges: {},
      keyboardState: [],
      mouseState: [],
      mousePosition: { x: 0, y: 0 },
      // Last element clicked - scan upwards to see the focus
      focus: null,
    },
    mutations: {
      ADD_BRAIN(state, { brain }) {
        Vue.set(state.brains, brain.id, brain)
      },
      ADD_NODE(state, { node, id }) {
        Vue.set(state.nodes, id, node)
      },
      PAN_NODES(state, { x, y, nodeIds }) {
        for (const id of nodeIds) {
          state.nodes[id].x = state.nodes[id].x + x
          state.nodes[id].y = state.nodes[id].y + y
        }
      },
      ADD_EDGE(state, { id, edge }) {
        Vue.set(state.edges, id, edge)
      },
      REMOVE_EDGE(state, { id }) {
        Vue.delete(state.edges, id)
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
      SET_PLAYBACK_POSITION(state, position) {
        state.playbackPosition = position
      },
      SET_MOUSE_POSITION(state, position) {
        state.mousePosition = position
      },
    },
    actions: {
      fetchSomething(context) {
        // context.commit ('SET_NODES', [])
        // do async stuff
        // do more commits
      },
      addEdge(context, edgeDescriptor) {
        context.commit('ADD_EDGE', {
          id: Object.keys(context.state.edges).length,
          edge: edgeDescriptor,
        })
        const [fromId, output, toId, input] = edgeDescriptor
        const fromBrainId = context.state.nodes[fromId].brain
        const toBrainId = context.state.nodes[toId].brain
        context.state.brains[fromBrainId].connect(
          context.state.brains[toBrainId],
          output,
          input,
        )
      },
      removeEdge(context, id) {
        const [fromId, output, toId, input] = context.state.edges[id]
        context.commit('REMOVE_EDGE', { id })
        const fromBrainId = context.state.nodes[fromId].brain
        const toBrainId = context.state.nodes[toId].brain

        context.state.brains[fromBrainId].disconnect(
          context.state.brains[toBrainId],
          output,
          input,
        )
      },
      async addNode(context, node) {
        const brain = new nodeMap[node.type](
          context.state.transporter,
          node.data,
        )
        context.commit('ADD_BRAIN', { brain })

        const id = Object.keys(context.state.nodes).length
        context.commit('ADD_NODE', {
          id,
          node: { id, ...node, brain: brain.id },
        })
        return id
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
  store.state.transporter.on('positionUpdate', position => {
    store.commit('SET_PLAYBACK_POSITION', position)
  })
  return store
}

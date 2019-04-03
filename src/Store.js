import { Store } from 'vuex'
import Transporter from 'modules/Transporter'
import inputTracker from './inputTracker'
import nodeMap from 'nodes'
import Vue from 'vue'
import { clamp } from './util'

const lastIds = {
  event: 4,
  track: 1,
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
      songStart: 0,
      songEnd: 60,
      viewStart: 0,
      viewEnd: 4,
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
      PAN_TRACK_VIEW(state, { deltaX }) {
        state.viewStart += deltaX
        state.viewEnd += deltaX
      },
      ZOOM_TRACK_VIEW(state, { x }) {
        const width = state.viewEnd - state.viewStart
        const newWidth = clamp(4, x + width, 160)
        const deltaX = width - newWidth
        state.viewStart += deltaX / 2
        state.viewEnd -= deltaX / 2
      },
      ADD_BRAIN(state, { brain }) {
        Vue.set(state.brains, brain.id, brain)
      },
      ADD_NODE(state, { node, id }) {
        Vue.set(state.nodes, id, node)
      },
      ADD_NODE_EDGE(state, { from, to, input, output }) {
        state.nodes[from].outputs.push([output, to, input])
        state.nodes[to].inputs.push([input, from, output])
      },
      REMOVE_NODE_EDGE(state, { from, to, input, output }) {
        const index = state.nodes[from].outputs.findIndex(([a, b, c]) => {
          return a === output && b === to && c === input
        })

        if (index !== -1) {
          state.nodes[from].outputs.splice(index, 1)
        }

        const inputIndex = state.nodes[to].inputs.findIndex(([a, b, c]) => {
          return a === input && b === from && c === output
        })
        if (inputIndex !== -1) {
          state.nodes[to].inputs.splice(inputIndex, 1)
        }
      },
      PAN_NODES(state, { x, y, nodeIds }) {
        for (const id of nodeIds) {
          state.nodes[id].x += x
          state.nodes[id].y += y
        }
      },
      ADD_EVENT(state, event) {
        Vue.set(state.events, event.id, event)
        state.tracks[event.trackId].events.push(event.id)
      },
      REMOVE_EVENT(state, id) {
        const trackId = state.events[id].trackId
        const track = state.tracks[trackId]
        Vue.set(track, 'events', track.events.filter(_id => id !== _id))
        Vue.delete(state.events, id)
      },
      SET_EVENT(state, event) {
        Vue.set(state.events, event.id, event)
      },
      COPY_EVENTS(state, { eventIds }) {
        for (const id of eventIds) {
          const newNoteId = getId('event')
          const copyFrom = state.events[id]
          const trackId = copyFrom.trackId
          Vue.set(state.events, newNoteId, {
            ...copyFrom,
            id: newNoteId,
          })
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
      ADD_TRACK(state, track) {
        Vue.set(state.tracks, track.id, track)
      },
      SET_TRACK(state, { id, ...changes }) {
        Object.assign(state.tracks[id], changes)
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
      removeEvents(context, events) {
        events.forEach(event => context.commit('REMOVE_EVENT', event))
      },
      addEdge(context, { from, to, input, output }) {
        context.commit('ADD_NODE_EDGE', {
          from,
          to,
          input,
          output,
        })
        const fromBrainId = context.state.nodes[from].brain
        const toBrainId = context.state.nodes[to].brain
        context.state.brains[fromBrainId].connect(
          context.state.brains[toBrainId],
          output,
          input,
        )
      },
      removeEdge(context, { from, to, input, output }) {
        context.commit('REMOVE_NODE_EDGE', {
          from,
          to,
          input,
          output,
        })
        const fromBrainId = context.state.nodes[from].brain
        const toBrainId = context.state.nodes[to].brain
        context.state.brains[fromBrainId].disconnect(
          context.state.brains[toBrainId],
          output,
          input,
        )
      },
      async addNode(context, node) {
        Object.assign(node, {
          data: {},
          width: 100,
          height: 150,
          outputs: [],
          inputs: [],
        })
        if (node.type === 'track') {
          const hue = Math.floor(Math.random() * 360)
          const trackId = getId('track')
          context.commit('ADD_TRACK', { id: trackId, events: [], hue })
          node.data.trackId = trackId
        }
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
      addEvent(context, { type, beat, beats, data, trackId }) {
        const id = getId('event')
        context.commit('ADD_EVENT', { id, type, beat, beats, data, trackId })
      },
    },
    getters: {
      eventsOfTrack(state) {
        return id => {
          const track = state.tracks[id]
          if (!track) return []
          const events = {}
          track.events.forEach(
            eventId => (events[eventId] = state.events[eventId]),
          )
          return events
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

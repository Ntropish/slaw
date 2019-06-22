import { Store } from 'vuex'
import nodeMap from 'nodes'
import Vue from 'vue'
import { clamp } from '../util'

import * as project from 'backendApi/project'
import defaultState from './defaultState'
import projectModule from './project'
import userModule from './user'

const lastIds = {
  event: 4,
  track: 1,
}
function getId(type) {
  let id = lastIds[type] || 0
  lastIds[type] = id + 1
  return (id + 1).toString()
}

// This file should eventually be sorted into modules to reduce file
// size and make navigating the code easier. At the time of writing
// however, the Vuex api has made everything super loosely coupled
// so I'm not as worried about large file size here than I normally
// would be.
export default {
  modules: {
    project: projectModule,
    user: userModule,
  },
  state: defaultState(),
  mutations: {
    DRAG(state, value) {
      Vue.set(state, 'dragPayload', value)
    },
    DROP(state, value) {
      Vue.delete(state, 'dragPayload')
    },
    SET_PANEL_SHELF_HEIGHT(state, value) {
      state.panelShelfHeight = clamp(5, Math.round(value), 95)
    },
    SET_PROJECT_ID(state, id) {
      state._id = id
    },
    ZOOM_NODE_EDITOR(state, { amount, xOrigin, yOrigin, yRatio }) {
      // Orthographic viewport, so zoom both axis the same
      state.nodeWidth += amount
      state.nodeX -= amount * xOrigin
      // amount is for x increase, multiply by yRatio to get y increase
      state.nodeY -= amount * yOrigin * yRatio
    },
    PAN_NODE_EDITOR(state, { x, y }) {
      state.nodeX += x
      state.nodeY += y
    },
    SET_NODE_EDITOR(state, { nodeX, nodeY, nodeWidth }) {
      state.nodeX = nodeX
      state.nodeY = nodeY
      state.nodeWidth = nodeWidth
    },
    SET_SELECTED_NODES(state, nodes) {
      Vue.set(state, 'selectedNodes', nodes)
    },
    SELECT_NODE(state, id) {
      if (state.selectedNodes.includes(id)) return
      state.selectedNodes.push(id)
    },
    REMOVE_NODE(state, id) {
      Vue.delete(state.nodes, id)
    },
    PAN_TRACK_VIEW(state, { deltaX }) {
      state.viewStart += deltaX
      state.viewEnd += deltaX
    },
    ZOOM_TRACK_VIEW(state, { x, xOrigin = 0.5 }) {
      const width = state.viewEnd - state.viewStart
      const newWidth = clamp(1, width * x + width, 160)
      const deltaX = width - newWidth
      state.viewStart += deltaX * xOrigin
      state.viewEnd -= deltaX * (1 - xOrigin)
    },
    SET_TRACK_VIEW(state, { viewStart, viewEnd }) {
      state.viewStart = viewStart
      state.viewEnd = viewEnd
    },
    ADD_BRAIN(state, { brain }) {
      Vue.set(state.brains, brain.id, brain)
    },
    SET_NODE_DATA(state, { data, id }) {
      Vue.set(
        state.nodes[id] || {},
        'data',
        Object.assign(state.nodes[id].data, data),
      )
    },
    ADD_NODE(state, { node, id }) {
      Vue.set(state.nodes, id, node)
    },
    ADD_EDGE(state, edge) {
      const { from, to } = edge

      // If an edge isn't to the pointer then it is to a node
      // and needs to be added to those nodes
      if (from.type !== 'pointer') {
        Vue.set(state.nodes[from.id].outputs, from.index, {
          id: to.id,
          index: to.index,
        })
      }
      if (to.type !== 'pointer') {
        Vue.set(state.nodes[to.id].inputs, to.index, {
          id: from.id,
          index: from.index,
        })
      }
    },
    REMOVE_EDGE(state, edge) {
      const { from, to } = edge

      if (from.type !== 'pointer') {
        const outputs = state.nodes[from.id].outputs
        const index = outputs.indexOf(edge)
        state.nodes[from.id].outputs.splice(index, 1)
      }
      if (to.type !== 'pointer') {
        const inputs = state.nodes[to.id].inputs
        const index = inputs.indexOf(edge)
        state.nodes[to.id].inputs.splice(index, 1)
      }
    },
    PAN_NODES(state, { x, y, nodeIds }) {
      for (const id of nodeIds) {
        const node = state.nodes[id]

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
        event.beats = Math.round(event.beats / state.beatSnap) * state.beatSnap
      }
    },
    ADD_TRACK(state, track) {
      Vue.set(state.tracks, track.id, track)
    },
    ADD_CURVE(state, { id, points, global, view }) {
      const curve = {
        id,
        points: points || [],
        global: typeof global === 'boolean' ? global : true,
        min: 0,
        max: 1,
        view: view || [-1, 2, 6, -1],
      }
      Vue.set(state.curves, curve.id, curve)
    },
    SET_TRACK(state, { id, ...changes }) {
      Object.assign(state.tracks[id], changes)
    },
    SET_CURVE(state, { id, ...changes }) {
      Object.assign(state.curves[id], changes)
    },
    REMOVE_TRACK(state, id) {
      Vue.delete(state.tracks, id)
    },
    REMOVE_CURVE(state, id) {
      Vue.delete(state.curves, id)
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
    async addNode(context, node) {
      const newId = getId('node')
      Object.assign(node, {
        width: 100,
        height: 150,
        outputs: [],
        inputs: [],
        id: newId,
      })
      if (!node.data) node.data = {}
      if (node.type === 'track') {
        const hue = Math.floor(Math.random() * 360)
        const trackId = getId('track')
        context.commit('ADD_TRACK', { id: trackId, events: [], hue })
        node.data.trackId = trackId
      }
      if (node.type === 'curve') {
        const hue = Math.floor(Math.random() * 360)

        const curveId = getId('curve')
        context.commit('ADD_CURVE', { id: curveId })
        node.data.curveId = curveId
        node.data.hue = hue
        node.data.name = 'Curve ' + curveId
      }
      const brain = new nodeMap[node.type](context.state.transporter, node)
      context.commit('ADD_BRAIN', { brain })

      context.commit('ADD_NODE', {
        id: newId,
        node: { ...node, brain: brain.id },
      })

      return newId
    },
    async removeNode(context, id) {
      const node = context.state.nodes[id]
      for (const [input, from, output] of node.inputs) {
        await context.dispatch('removeEdge', {
          from,
          to: id,
          input,
          output,
        })
      }
      for (const [output, to, input] of node.outputs) {
        await context.dispatch('removeEdge', {
          from: id,
          to,
          input,
          output,
        })
      }
      const trackId = node.data.trackId
      const curveId = node.data.curveId
      if (trackId) context.commit('REMOVE_TRACK', trackId)
      if (curveId) context.commit('REMOVE_CURVE', trackId)
      context.commit('REMOVE_NODE', id)
    },
    addEvent(context, { type, beat, beats, data, trackId }) {
      const id = getId('event')
      context.commit('ADD_EVENT', { id, type, beat, beats, data, trackId })
    },
    selectNode(context, { id, preserveSelection }) {
      if (preserveSelection || context.state.selectedNodes.includes(id)) {
        const selected = context.state.selectedNodes
        if (selected.includes(id)) return
        context.commit('SET_SELECTED_NODES', selected.concat(id))
      } else {
        context.commit('SET_SELECTED_NODES', [id])
      }
    },
    async removeSelectedNodes(context) {
      const ids = context.state.selectedNodes
      context.commit('SET_SELECTED_NODES', [])
      for (const id of ids) {
        context.dispatch('removeNode', id)
      }
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
}

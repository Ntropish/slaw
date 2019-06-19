import defaultState from './defaultState'
import * as project from 'backendApi/project'

const mutations = {
  SET_ID(state, id) {
    state._id = id
  },
}
const actions = {
  async loadProject(context, id) {
    const { data: projectToLoad } = await project.get(id)
    await context.dispatch('setState', projectToLoad)
    // Loading a new project can change the split view location
    // so a resize must be fired
    document.dispatchEvent(new CustomEvent('resize'))
  },
  // Action for loading a saved state
  // This was made before I knew about replaceState but it
  // has some nuggets where stuff that can't be serialized
  // is built so it's needed until those are pulled out
  async setState(context, oldState) {
    const nodeIdMap = {}
    const connections = []
    // Fill in missing properties if not present on oldState so
    // stuff like array operations don't fail
    oldState = {
      ...defaultState(),
      ...oldState,
    }

    // Clear out old state
    Object.assign(context.rootState, defaultState())

    context.commit('SET_PROJECT_ID', oldState._id ? oldState._id : '')

    // Remake each node, but save connections/outputs until later
    // when the node id map is completely full
    for (const oldNode of Object.values(oldState.nodes)) {
      const { type, x, y, data, outputs, id: oldId } = oldNode

      const newNodeId = await context.dispatch('addNode', {
        type,
        data: {},
        x,
        y,
      })

      nodeIdMap[oldId] = newNodeId
      // Tracks need hue and events set on cooresponding track object
      if (type === 'track') {
        const oldTrack = oldState.tracks[data.trackId]
        const trackId = context.rootState.nodes[newNodeId].data.trackId
        // Data is currupt so just delete this node and return
        if (!oldTrack) {
          return context.dispatch('removeNode', newNodeId)
        }
        if (oldTrack.hue) {
          context.commit('SET_TRACK', { id: trackId, hue: oldTrack.hue })
        }
        oldTrack.events.forEach(eventId => {
          const oldEvent = oldState.events[eventId]
          context.dispatch('addEvent', { ...oldEvent, trackId })
        })
      }
      // Curve nodes need their cooresponding curve built
      if (type === 'curve') {
        const oldCurve = oldState.curves[data.curveId]
        const newCurveId = context.rootState.nodes[newNodeId].data.curveId
        // Data is currupt so just delete this node and return
        if (!oldCurve) {
          return context.dispatch('removeNode', newNodeId)
        }
        context.commit('ADD_CURVE', {
          id: newCurveId,
          points: oldCurve.points,
          global: oldCurve.global,
          view: oldCurve.view,
        })
      }

      connections.push(
        ...outputs.map(([output, to, input]) => ({
          from: newNodeId,
          output,
          to,
          input,
        })),
      )
    }

    if (oldState.selectedNodes) {
      context.commit(
        'SET_SELECTED_NODES',
        oldState.selectedNodes.map(oldId => nodeIdMap[oldId]),
      )
    }

    if (oldState.selectedTrackId) {
      context.commit('SET_SELECTED_TRACK', oldState.selectedTrackId)
    }

    context.commit('SET_NODE_EDITOR', {
      nodeX: oldState.nodeX,
      nodeY: oldState.nodeY,
      nodeWidth: oldState.nodeWidth,
    })

    context.commit('SET_TRACK_VIEW', {
      viewStart: oldState.viewStart,
      viewEnd: oldState.viewEnd,
    })

    // Build connections here now that new node ids are known
    for (const { from, to: oldTo, input, output } of connections) {
      for (const num of [from, oldTo, input, output]) {
        if (typeof num !== 'number' && typeof num !== 'string') {
          return
        }
      }
      context.dispatch('addEdge', {
        from,
        output,
        to: nodeIdMap[oldTo],
        input,
      })
    }

    if (typeof oldState.panelShelfHeight === 'number') {
      context.commit('SET_PANEL_SHELF_HEIGHT', oldState.panelShelfHeight)
    }
  },
}

export default {
  mutations,
  actions,
}

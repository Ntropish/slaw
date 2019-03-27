import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import Store from './Store'

Vue.use(Vuex)

export const store = Store()

new Vue({
  el: '#app',
  store,
  components: {
    App,
  },
  render: h => h('app'),
})

// Temp code below
;(async () => {
  const id1 = await store.dispatch('addNode', {
    type: 'track',
    x: 50,
    y: 100,
  })
  store.commit('SET_TRACK', {
    id: store.state.nodes[id1].data.trackId,
    name: 'Track 1',
    hue: 90,
  })
  const id2 = await store.dispatch('addNode', {
    type: 'sin',
    x: 200,
    y: 30,
  })
  const id3 = await store.dispatch('addNode', {
    type: 'destination',
    x: 470,
    y: 140,
  })
  const id4 = await store.dispatch('addNode', {
    type: 'adsr',
    x: 330,
    y: 130,
  })
  // store.dispatch('addEdge', { from: id1, output: 0, to: id2, input: 0 })
  // store.dispatch('addEdge', { from: id2, output: 0, to: id4, input: 0 })
  // store.dispatch('addEdge', { from: id1, output: 0, to: id4, input: 1 })
  // store.dispatch('addEdge', { from: id4, output: 0, to: id3, input: 0 })
  store.dispatch('addEdge', { from: id1, output: 0, to: id2, input: 0 })
  store.dispatch('addEdge', { from: id2, output: 0, to: id3, input: 0 })

  store.dispatch('addEvent', {
    type: 'note',
    beat: 0,
    beats: 0.295,
    data: { pitch: -2500, velocity: 0.8 },
    trackId: store.state.nodes[id1].data.trackId,
  })
  store.dispatch('addEvent', {
    type: 'note',
    beat: 0.3,
    beats: 0.295,
    data: { pitch: -2600, velocity: 0.7 },
    trackId: store.state.nodes[id1].data.trackId,
  })
  store.dispatch('addEvent', {
    type: 'note',
    beat: 0.6,
    beats: 0.295,
    data: { pitch: -2550, velocity: 0.5 },
    trackId: store.state.nodes[id1].data.trackId,
  })
  store.dispatch('addEvent', {
    type: 'note',
    beat: 0.9,
    beats: 0.295,
    data: { pitch: -2520, velocity: 0.8 },
    trackId: store.state.nodes[id1].data.trackId,
  })

  store.commit('SET_SELECTED_TRACK', store.state.nodes[id1].data.trackId)
})()

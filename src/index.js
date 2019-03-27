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
    x: 100,
    y: 100,
  })
  store.commit('SET_TRACK', {
    id: store.state.nodes[id1].data.trackId,
    name: 'Track 1',
    hue: 90,
  })
  const id2 = await store.dispatch('addNode', {
    type: 'sin',
    x: 300,
    y: 130,
  })
  const id3 = await store.dispatch('addNode', {
    type: 'destination',
    x: 450,
    y: 110,
  })
  const id4 = await store.dispatch('addNode', {
    type: 'adsr',
    x: 300,
    y: 330,
  })
  store.dispatch('addEdge', { from: id1, output: 0, to: id2, input: 0 })
  store.dispatch('addEdge', { from: id2, output: 0, to: id4, input: 0 })
  store.dispatch('addEdge', { from: id1, output: 0, to: id4, input: 1 })
  store.dispatch('addEdge', { from: id4, output: 0, to: id3, input: 0 })

  store.dispatch('addEvent', {
    type: 'note',
    beat: 0,
    beats: 0.25,
    data: { pitch: -2500, velocity: 0.8 },
    trackId: store.state.nodes[id1].data.trackId,
  })
  store.dispatch('addEvent', {
    type: 'note',
    beat: 1,
    beats: 0.4,
    data: { pitch: -2550, velocity: 0.5 },
    trackId: store.state.nodes[id1].data.trackId,
  })
  store.dispatch('addEvent', {
    type: 'note',
    beat: 1.5,
    beats: 0.25,
    data: { pitch: -2520, velocity: 0.8 },
    trackId: store.state.nodes[id1].data.trackId,
  })

  store.commit('SET_SELECTED_TRACK', store.state.nodes[id1].data.trackId)
})()

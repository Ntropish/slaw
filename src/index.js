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
const events = {
  '0': {
    id: '0',
    pitch: -2500,
    beat: 0,
    velocity: 0.8,
    beats: 0.45,
  },
  '1': {
    id: '1',
    pitch: -2550,
    beat: 1,
    velocity: 0.4,
    beats: 0.25,
  },
  '2': {
    id: '2',
    pitch: -2520,
    beat: 1.5,
    velocity: 0.8,
    beats: 0.25,
  },
  '3': {
    id: '3',
    pitch: -2600,
    beat: 3,
    velocity: 0.6,
    beats: 1,
  },
  '4': {
    id: '4',
    pitch: -3700,
    beat: 4,
    velocity: 0.5,
    beats: 1,
  },
}

;(async () => {
  const id1 = await store.dispatch('addNode', {
    type: 'track',
    x: 100,
    y: 100,
  })
  const a = store.commit('SET_TRACK', {
    id: store.state.nodes[id1].data.trackId,
    name: 'Track 1',
    events: ['0', '1', '2', '3', '4'],
    hue: 90,
  })

  const id2 = await store.dispatch('addNode', {
    type: 'sin',
    x: 300,
    y: 130,
  })
  const id3 = await store.dispatch('addNode', {
    type: 'destination',
    x: 600,
    y: 110,
  })
  store.dispatch('addEdge', { from: id1, output: 0, to: id2, input: 0 })
  store.dispatch('addEdge', { from: id2, output: 0, to: id3, input: 0 })
  store.commit('SET_EVENTS', events)
  store.commit('SET_SELECTED_TRACK', store.state.nodes[id1].data.trackId)
})()

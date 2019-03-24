import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import Store from './Store'

Vue.use(Vuex)

const store = Store()

new Vue({
  el: '#app',
  store,
  components: {
    App,
  },
  render: h => h('app'),
})

// Temp code below

const nodes = {
  '0': {
    id: '0',
    type: 'track',
    data: {
      track: '0',
    },
    position: {
      x: 100,
      y: 100,
    },
    inputs: [],
    outputs: ['MIDI'],
  },
  '1': {
    id: '1',
    type: 'worklet',
    data: {
      track: '0',
    },
    position: {
      x: 300,
      y: 130,
    },
    inputs: ['MIDI'],
    outputs: [],
  },
}

const edges = {
  '0': {
    from: {
      node: '0',
      output: '0',
    },
    to: {
      node: '1',
      output: '0',
    },
  },
}

const tracks = {
  '0': {
    id: '0',
    name: 'Track 1',
    events: ['0', '1', '2', '3'],
    hue: 90,
  },
}

const events = {
  '0': {
    id: '0',
    pitch: -2500,
    beat: 0,
    velocity: 0.8,
    beats: 0.25,
  },
  '1': {
    id: '1',
    pitch: -2600,
    beat: 1,
    velocity: 0.3,
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
}

store.commit('SET_NODES', nodes)
store.commit('SET_EDGES', edges)
store.commit('SET_EVENTS', events)
store.commit('SET_TRACKS', tracks)
store.commit('SET_SELECTED_TRACK', '0')

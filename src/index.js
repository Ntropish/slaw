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

const nodes = {
  '0': {
    id: '0',
    type: 'track',
    data: {
      trackId: '0',
    },
    x: 100,
    y: 100,
    width: 100,
    height: 150,
  },
  '1': {
    id: '1',
    type: 'sin',
    data: {},
    x: 300,
    y: 130,
    width: 100,
    height: 150,
  },
  '2': {
    id: '2',
    type: 'destination',
    data: {},
    x: 600,
    y: 110,
    width: 100,
    height: 150,
  },
}

const edges = {
  '0': ['0', '0', '1', '0'],
  '1': ['1', '0', '2', '0'],
}

const tracks = {
  '0': {
    id: '0',
    name: 'Track 1',
    events: ['0', '1', '2', '3', '4'],
    hue: 90,
  },
}

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

store.commit('SET_NODES', nodes)
store.commit('SET_EDGES', edges)
store.commit('SET_EVENTS', events)
store.commit('SET_TRACKS', tracks)
store.commit('SET_SELECTED_TRACK', '0')

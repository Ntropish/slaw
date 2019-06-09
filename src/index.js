import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import storeConfig from './store'
import inputTracker from './store/inputTracker'
import { Store } from 'vuex'
import axios from 'axios'

import { library } from '@fortawesome/fontawesome-svg-core'
import {
  faBars,
  faSave,
  faUser,
  faPlusCircle,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { put } from 'backendApi/project'
import { VTooltip } from 'v-tooltip'
import { registerEventListener as userLoginAtStart } from './store/user'

library.add(faBars)
library.add(faSave)
library.add(faUser)
library.add(faPlusCircle)
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.config.productionTip = false

Vue.directive('tooltip', VTooltip)

Vue.use(Vuex)
const store = new Store(storeConfig)

inputTracker(store)
store.state.transporter.on('positionUpdate', position => {
  store.commit('SET_PLAYBACK_POSITION', position)
})
// Save whenever the state changes that's part of the project
// store.subscribe((mutation, state) => {
//   if (mutation.type === 'FOCUS_ELEMENT') return
//   window.requestAnimationFrame(() => {
//     const { focus, ...stateToStore } = state
//     localStorage.setItem('store', JSON.stringify(stateToStore))
//   })
// })

new Vue({
  el: '#app',
  store,
  components: {
    App,
  },
  render: h => h('app'),
})

userLoginAtStart(store)
window.addEventListener('beforeunload', e => {
  // put(store.state)
})

// var tokenGetSettings = {
//   crossDomain: true,
//   url: 'https://slaw.auth0.com/oauth/token',
//   method: 'POST',
//   headers: {
//     'content-type': 'application/json',
//   },
//   data:
//     '{"client_id":"uT8eqs93fP6GOcLcEyx4T6CE9blviwPh","client_secret":"YkXYxZT-jSA0erUM0swI4FeLkrHtp56SonpbAk2yeFUkaZGE4gcCYt4S2_4mTyKF","audience":"server","grant_type":"client_credentials"}',
// }

// axios(tokenGetSettings).then(response => {
//   console.log(response)
//   return
//   // store.dispatch('SET_API_ACCESS_TOKEN', 'token')
// })

export { store }

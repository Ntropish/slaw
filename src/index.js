import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import Store from './Store'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faBars, faSave, faPlusCircle } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { put } from 'backendApi/project'
import { VTooltip } from 'v-tooltip'

library.add(faBars)
library.add(faSave)
library.add(faPlusCircle)
Vue.component('font-awesome-icon', FontAwesomeIcon)
Vue.config.productionTip = false

Vue.directive('tooltip', VTooltip)

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

// TEST CODE: Loads this project at startup for easy development
store.dispatch('loadProject', '5ccd09ddc208c42a2c73ef3e')

window.addEventListener('beforeunload', e => {
  // put(store.state)
})

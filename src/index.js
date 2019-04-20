import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import Store from './Store'

import { library } from '@fortawesome/fontawesome-svg-core'
import { faBars } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

import { VTooltip } from 'v-tooltip'

library.add(faBars)
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

try {
  const savedStore = JSON.parse(localStorage.getItem('store'))
  if (savedStore) {
    store.dispatch('setState', savedStore)
  }
} catch (e) {
  // console.log('Failed to load previous state')
}

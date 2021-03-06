import auth from '../auth0'
import { callbackPromise } from '../util'

const defaultState = () => ({
  accessToken: '',
  idToken: '',
  profile: null,
})

const mutations = {
  SET_USER(state, { accessToken, idToken }) {
    state.accessToken = accessToken
    state.idToken = idToken
  },
  SET_API_ACCESS_TOKEN(state, token) {
    state.apiAccessToken = token
  },
  SET_PROFILE(state, profile) {
    state.profile = profile
  },
}

const actions = {
  logout(context) {
    context.commit('SET_USER', { accessToken: '', idToken: '' })
    localStorage.removeItem('user')
    auth.logout({
      returnTo: window.location.origin,
    })
  },
  flagUserLoad(context) {
    context.rootState.userLoadedResolver()
  },
}

export default {
  state: defaultState(),
  actions,
  mutations,
}

// Manages user loading at startup
//
// Stores user in store for access by the application
// and another copy in localStorage to load from on
// subsequent page re/loads
export function registerEventListener(store) {
  const user = JSON.parse(localStorage.getItem('user'))
  window.addEventListener('load', function() {
    if (user && user.accessToken && user.idToken) {
      renewTokens()
    } else if (window.location.hash) {
      handleAuthentication()
    } else {
      store.dispatch('flagUserLoad')
    }
    window.location.hash = ''
  })

  function renewTokens() {
    auth.checkSession({}, handleUserResponse)
  }

  function handleAuthentication() {
    auth.parseHash(handleUserResponse)
  }

  function handleUserResponse(err, result) {
    const { accessToken, idToken } = result || {}
    // To track if a callback will commit the USER_LOAD_COMPLETE later
    let willLoad = false
    if (accessToken && idToken) {
      // Result came back with correct tokens so the user
      // can now be set
      store.commit('SET_USER', result)
      localStorage.setItem('user', JSON.stringify(result))
      willLoad = true
      auth.client.userInfo(accessToken, (err, profile) => {
        if (profile) {
          store.commit('SET_PROFILE', profile)
        }
        store.dispatch('flagUserLoad')
      })
    } else if (err) {
      // alert('Coult not get a new token')
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }
      logout()
    }

    if (!willLoad) {
      store.dispatch('flagUserLoad')
    }
  }

  function logout() {
    store.commit('SET_USER', { accessToken: '', idToken: '' })
    localStorage.removeItem('user')
  }
}

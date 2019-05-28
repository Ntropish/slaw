import auth from '../auth0'

const defaultState = () => ({
  username: '',
  accessToken: '',
  idToken: '',
  profile: null,
})

const mutations = {
  SET_USER(state, { accessToken, idToken }) {
    state.accessToken = accessToken
    state.idToken = idToken
  },
  SET_PROFILE(state, profile) {
    state.profile = profile
  },
}

export default {
  state: defaultState(),
  mutations,
}

export function registerEventListener(store) {
  window.addEventListener('load', function() {
    if (store.state.user.accessToken && store.state.user.idToken) {
      renewTokens()
    } else {
      handleAuthentication()
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
    if (accessToken && idToken) {
      // Result came back with correct tokens so the user
      // can now be set
      store.commit('SET_USER', result)
      auth.client.userInfo(accessToken, (err, profile) => {
        if (profile) {
          store.commit('SET_PROFILE', profile)
        }
      })
    } else if (err) {
      // alert('Coult not get a new token')
      if (process.env.NODE_ENV === 'development') {
        console.error(err)
      }
      logout()
    }
  }

  function logout() {
    store.commit('SET_USER', { accessToken: '', idToken: '' })
  }
}

// import '../node_modules/auth0-js/build/auth0'
import auth0 from 'auth0-js'
import EventEmitter from 'events'
import authConfig from '../auth_config.json'

const webAuth = new auth0.WebAuth({
  domain: authConfig.domain,
  redirectUri: `${window.location.origin}`,
  clientID: authConfig.clientId,
  responseType: 'id_token',
  scope: 'openid profile email',
})

class AuthService extends EventEmitter {
  login(customState) {
    webAuth.authorize({
      appState: customState,
    })
  }
}

export default new AuthService()

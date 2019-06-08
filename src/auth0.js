import auth0 from 'auth0-js'
import authConfig from '../auth_config.json'

const webAuth = new auth0.WebAuth({
  domain: authConfig.domain,
  redirectUri: window.location.href,
  clientID: authConfig.clientId,
  responseType: 'code token id_token',
  scope: 'openid profile email',
  audience: 'server',
})

export default webAuth

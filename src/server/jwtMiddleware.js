const jwksRsa = require('jwks-rsa')
const expressJwt = require('express-jwt')
const authConfig = require('../../auth_config.json')

module.exports = jwks => {
  return expressJwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`,
    }),

    audience: authConfig.audience,
    issuer: `https://${authConfig.domain}/`,
    algorithm: ['RS256'],
  })
}

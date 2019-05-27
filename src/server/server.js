try {
  const path = require('path')
  const express = require('express')
  const morgan = require('morgan')
  const app = express()
  const port = process.env.PORT || 8088

  if (process.env.NODE_ENV !== 'production') {
    // populates environment variables so the env looks
    // like it would while deployed. This file must be created
    // for each deployment of this app!
    require('../../config')
  }

  const projectRouter = require('./api/project.js')

  app.use(morgan('tiny'))

  // Statically serve these two directories:
  // the built application and the static assets
  app.use(express.static(path.resolve(process.cwd(), './static')))
  app.use(express.static(path.resolve(process.cwd(), './dist')))
  app.use(
    express.static(
      path.resolve(process.cwd(), '../../node_modules/auth0-js/build/'),
    ),
  )

  const api = express.Router()
  api.use('/project', projectRouter)

  app.use('/api', api)

  // All unknown requests are sent index.html which is
  // a requirement for SPAs without a hash router
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(process.cwd(), './static/index.html'))
  })
  app.listen(port, () => console.log(`Slaw Server listening on port ${port}!`))
} catch (e) {
  console.log(e)
}

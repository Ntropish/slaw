const path = require('path')
const express = require('express')
const app = express()
const port = process.env.PORT || 8080

// Statically serve these two directories:
// the built application and the static assets
app.use(express.static(path.resolve(process.cwd(), './static')))
app.use(express.static(path.resolve(process.cwd(), './dist')))

// All unknown requests are sent index.html which is
// a requirement for SPAs without a hash router
app.get('*', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), './static/index.html'))
})

app.listen(port, () => console.log(`Slaw Server listening on port ${port}!`))

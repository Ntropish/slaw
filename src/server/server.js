const path = require('path')
const express = require('express')
const app = express()
const port = 8080

app.use(express.static(path.resolve(process.cwd(), './static')))
app.use(express.static(path.resolve(process.cwd(), './dist')))

app.get('*', (req, res) => {
  res.sendFile(path.resolve(process.cwd(), './static/index.html'))
})

app.listen(port, () => console.log(`Slaw Server listening on port ${port}!`))

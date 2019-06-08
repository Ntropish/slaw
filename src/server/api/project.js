const express = require('express')
const mongoose = require('mongoose')
const jwtMiddleware = require('../jwtMiddleware')

const util = require('../util')
const _endpointGuard = util.endpointGuard

// All endpoints need to be authorized so it's injected here
const endpointGuard = cb => {
  return _endpointGuard((req, res) => {
    if (!req.user) return unauthorized(res)
    return cb(req, res)
  })
}

// Util so each of these is the same
const unauthorized = res => res.status(401).send('Unauthorized')

connect()

async function connect() {
  const mongoUri = process.env.mongoUri
  try {
    await mongoose.connect(mongoUri, { useNewUrlParser: true })
  } catch (e) {
    console.log('Failed to connect to mongo:', e)
  }
}

const projectSchema = new mongoose.Schema({
  selectedTrackId: String,
  playbackStart: Number,
  playbackPosition: Number,
  songStart: Number,
  songEnd: Number,
  viewStart: Number,
  viewEnd: Number,

  // Node editor viewport position
  nodeX: Number,
  nodeY: Number,
  nodeWidth: Number,

  beatSnap: Number,
  centsSnap: Number,

  events: { type: Map, of: {} },
  tracks: { type: Map, of: {} },
  nodes: { type: Map, of: {} },
  curves: { type: Map, of: {} },
  edges: { type: Map, of: {} },

  selectedNodes: [String],

  owner: String,
})

const Project = new mongoose.model('Project', projectSchema)

module.exports = jwks => {
  const router = express.Router()
  router.use(express.json())
  router.use(jwtMiddleware(jwks))

  router.get(
    '/all',
    endpointGuard(async (req, res) => {
      const project = await Project.find({ owner: req.user.sub }).exec()
      if (!project) res.status(404)
      res.json(project)
    }),
  )

  router.get(
    '/:id',
    endpointGuard(async (req, res) => {
      const project = await Project.findById(req.params.id).exec()
      if (!project || project.owner !== req.user.sub) res.status(404)
      else res.json(project)
    }),
  )

  router.post(
    '/',
    endpointGuard(async (req, res) => {
      const newProject = new Project({ ...req.body, owner: req.user.sub })
      const saveResult = newProject.save()
      res.json(saveResult)
    }),
  )

  router.put(
    '/:id',
    endpointGuard(async ({ params, body, user }, res) => {
      const project = await Project.findById(params.id)
      if (project.owner !== user.sub) return unauthorized(res)
      const updateResult = await Project.findByIdAndUpdate(
        params.id,
        body,
      ).exec()
      res.json(updateResult)
    }),
  )

  router.delete(
    '/:id',
    endpointGuard(async ({ params, user }, res) => {
      const project = await Project.findById(params.id)
      if (project.owner !== user.sub) return unauthorized(res)
      const deleteResult = await Project.findByIdAndDelete(params.id).exec()
      res.json(deleteResult)
    }),
  )

  return router
}

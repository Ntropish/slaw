const express = require('express')
const mongoose = require('mongoose')

const util = require('../util')
const endpointGuard = util.endpointGuard

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

  // Node editor
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
})

const Project = new mongoose.model('Project', projectSchema)

const router = express.Router()
router.use(express.json())

router.get(
  '/all',
  endpointGuard(async (req, res) => {
    const project = await Project.find().exec()
    if (!project) res.status(404)
    res.json(project)
  }),
)

router.get(
  '/:id',
  endpointGuard(async (req, res) => {
    const project = await Project.findById(req.params.id).exec()
    if (!project) res.status(404)
    else res.json(project)
  }),
)

router.post(
  '/',
  endpointGuard(async (req, res) => {
    if (!req.authenticated) {
      res.status(401).send('Unauthorized')
    }
    const newProject = new Project(req.body)
    const saveResult = newProject.save()
    res.json(saveResult)
  }),
)

router.put(
  '/:id',
  endpointGuard(async ({ params, body, authenticated }, res) => {
    if (!authenticated) {
      res.status(401).send('Unauthorized')
    }
    const updateResult = await Project.findByIdAndUpdate(params.id, body).exec()
    res.json(updateResult)
  }),
)

router.delete(
  '/',
  endpointGuard(async (req, res) => {
    if (!req.authenticated) {
      res.status(401).send('Unauthorized')
    }
    const deleteResult = await Project.findByIdAndDelete(req.params.id).exec()
    res.json(deleteResult)
  }),
)

module.exports = router

import Transporter from 'modules/Transporter'
import { callbackPromise } from '../util'

const [loadedPromise, loadedResolver] = callbackPromise()

export default () => ({
  _id: '',
  selectedTrackId: '',
  transporter: new Transporter(),
  panelShelfHeight: 50,
  playbackStart: 0,
  playbackPosition: 0,
  songStart: 0,
  songEnd: 24,
  viewStart: 0,
  viewEnd: 4,
  // Node editor
  nodeX: 0,
  nodeY: 0,
  nodeWidth: 800,
  beatSnap: 1 / 4,
  centsSnap: 100,
  events: {},
  tracks: {},
  nodes: {},
  curves: {},
  selectedNodes: [],
  brains: {},
  edges: {},
  keyboardState: [],
  mouseState: [],
  mousePosition: { x: 0, y: 0 },
  // Last element clicked - scan upwards to see the focus ( element.closest() )
  focus: null,
  userLoaded: loadedPromise,
  userLoadedResolver: loadedResolver,
})

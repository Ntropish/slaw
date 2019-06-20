import { store } from '../index'

export default class NodeInterface {
  constructor(transporter) {
    this.transporter = transporter
    this.id = NodeInterface.lastId++
    // this.down = this.down.bind(this)
    // this.move = this.move.bind(this)
    // this.up = this.up.bind(this)
  }
  connect(brain, outputIndex, inputIndex) {
    // ports must exist
    if (
      (!this.outputs && !this.outputs[outputIndex]) ||
      (!brain.inputs && !brain.inputs[inputIndex])
    )
      return false
    // edge type must match
    if (this.outputs[outputIndex].type !== brain.inputs[inputIndex].type)
      return false
    this.outputs[outputIndex].connect(this, brain, inputIndex)
  }

  disconnect(brain, outputIndex, inputIndex) {
    // ports must exist
    if (
      (!this.outputs && !this.outputs[outputIndex]) ||
      (!brain.inputs && !brain.inputs[inputIndex])
    )
      return false

    this.outputs[outputIndex].disconnect(this, brain, inputIndex)
  }

  addGraphics(illo) {}
  updateGraphics(illo) {}
  removeGraphic(illo, graphic) {
    const index = this.illo.children.indexOf(graphic)
    this.illo.children.splice(index, 1)
  }
  // Util to wrangle the event handlers needed for dragging.
  // Also adds a special option to send PAN_NODES events
  registerDragGraphic({ graphic, pan, onDrag, onDown }) {
    graphic.svgElement.addEventListener('pointerdown', down)
    function down(e) {
      if (onDown) onDown(e)
      e.target.setPointerCapture(e.pointerId)
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', up)
    }
    function move(e) {
      if (onDrag) onDrag(e)
    }
    function up(e) {
      e.target.releasePointerCapture(e.pointerId)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }
    return function unregisterDragGraphic(graphic, nodeId) {
      this.panGraphic.svgElement.removeEventListener('pointerdown', down)
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerup', up)
    }
  }

  registerPort({ graphic, type, nodeId, index }) {
    graphic.svgElement.addEventListener('pointerdown', down)
    graphic.svgElement.addEventListener('pointerup', up)
    function down(e) {
      graphic.svgElement.addEventListener('pointerup', () => {
        store.commit('DROP')
      })

      store.commit('DRAG', {
        type: 'NODE_PORT',
        data: {
          id: nodeId,
          type,
          index,
        },
      })
    }
    function up(e) {
      // You have to add back temporary edges
    }
    handleOutputDrop(from, output) {
      this.temporaryEdges.forEach(([type, to, input]) => {
        // Can't drag an output to an output so just abort
        if (type === "output") return;
        this.$store.dispatch("addEdge", { from, to, input, output });
    }
    return function unregisterDragGraphic(graphic, nodeId) {
      graphic.svgElement.removeEventListener('pointerdown', down)
      graphic.svgElement.removeEventListener('pointerup', up)
    }
  }
}

NodeInterface.lastId = 0

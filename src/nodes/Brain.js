import { store } from '../index'

export default class NodeInterface {
  constructor(transporter) {
    this.transporter = transporter
    this.id = NodeInterface.lastId++
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
  registerDragGraphic(illo, graphic) {
    graphic.svgElement.addEventListener('pointerdown', down)

    function down(e) {
      const selectedIndex = store.state.selectedNodes.indexOf(this.nodeId)
      if (!e.ctrlKey) {
        // Select just the clicked node
        store.commit('SET_SELECTED_NODES', [this.nodeId])
      } else if (selectedIndex !== -1) {
        // Deselect the clicked node
        store.commit('SET_SELECTED_NODES', [
          ...store.state.selectedNodes.slice(0, selectedIndex),
          ...store.state.selectedNodes.slice(selectedIndex + 1),
        ])
      } else {
        // Else just select the node
        store.commit('SELECT_NODE', this.nodeId)
      }
      e.target.setPointerCapture(e.pointerId)
      document.addEventListener('pointermove', move)
      document.addEventListener('pointerup', up)
    }
    function move(e) {
      store.commit('PAN_NODES', {
        x: e.movementX / illo.scale.x,
        y: e.movementY / illo.scale.y,
        nodeIds: store.state.selectedNodes,
      })
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
      // Clear this data on next pointerup only
      document.addEventListener(
        'pointerup',
        () => {
          store.commit('DROP')
        },
        { once: true },
      )

      store.commit('DRAG', {
        type: 'NODE_PORT',
        data: {
          type,
          id: nodeId,
          index,
        },
      })
    }
    function up(e) {
      // You have to add back temporary edges
      const drop = store.state.dragPayload
      if (drop.type === 'NODE_PORT') {
        store.commit('ADD_EDGE', {
          from: drop.data,
          to: {
            type,
            id: nodeId,
            index,
          },
        })
      }
    }
    return function unregisterDragGraphic(graphic, nodeId) {
      graphic.svgElement.removeEventListener('pointerdown', down)
      graphic.svgElement.removeEventListener('pointerup', up)
    }
  }

  registerRoot(graphic) {}

  buildEdges(inputs, outputs) {
    console.log(inputs, outputs)
  }

  removeGraphics() {
    while (this.unregisterFunctions.length) {
      this.unregisterFunctions.pop()()
    }
    while (this.graphics.length) {
      this.removeGraphic(this.graphics.pop())
    }
  }
}

NodeInterface.lastId = 0

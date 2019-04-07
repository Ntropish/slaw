<template>
  <div class="node-editor" @mousedown="onMouseDown" @wheel="onWheel">
    <canvas ref="background" class="canvas background" oncontextmenu="return false"/>
    <canvas ref="nodes" class="canvas nodes" oncontextmenu="return false"/>
    <canvas
      ref="edges"
      class="canvas edges"
      oncontextmenu="return false"
      @mousedown="canvasMouseDown"
    />
    <Audio-node
      v-for="(node, id) in nodes"
      :key="id"
      class="node"
      :node="node"
      :style="computeNodeStyle(node)"
      :handle-spacing="handleSpace * pxPerY"
      :selected="selectedNodes.includes(node.id)"
      @handle-input-drag="handleInputDrag(node.id, $event.i)"
      @handle-output-drag="handleOutputDrag(node.id, $event.i)"
      @handle-input-drop="handleInputDrop(node.id, $event.i)"
      @handle-output-drop="handleOutputDrop(node.id, $event.i)"
    />
    <add-menu
      class="add-menu"
      :selected-node-type="selectedNodeType"
      @selected-node-type-change="selectNodeType"
    />
  </div>
</template>

<script>
import { range } from "lodash";
import GridLand from "modules/GridLand";
import AudioNode from "components/AudioNode.vue";
import AddMenu from "components/AddMenu.vue";
import SinFactory from "nodes/Sin";
import EventTrackFactory from "nodes/EventTrack";
import ADSRFactory from "nodes/ADSR";
import DestinationFactory from "nodes/Destination";
import { mapState } from "vuex";
import nodeMap from "nodes";
const tools = {};
export default {
  components: { AudioNode, AddMenu },
  mixins: [GridLand],
  props: {},
  data: () => ({
    gridSize: 25,
    nodeBuffer: [],
    temporaryEdges: [],
    xStart: 0,
    xEnd: 800,
    yStart: 0,
    xSnap: 25,
    ySnap: 25,
    isDraggingHandle: false,
    handleSpace: 28,
    selectedNodeType: "track"
  }),

  computed: {
    canvases() {
      const canvasNames = ["background", "nodes", "edges"];
      return canvasNames.map(name => this.$refs[name]);
    },
    viewHeight() {
      return this.pxPerUnit * this.canvasHeight;
    },
    yEnd() {
      return this.yStart + (this.xCount * this.canvasHeight) / this.canvasWidth;
    },
    ...mapState([
      "nodes",
      "selectedNodes",
      "edges",
      "tracks",
      "mouseState",
      "keyboardState",
      "mousePosition",
      "brains"
    ])
  },
  watch: {
    nodes: {
      handler() {
        this.render();
      },
      deep: true
    },
    edges(edges) {
      this.render();
    }
  },
  mounted() {
    this.render();
  },
  methods: {
    computeNodeStyle(node) {
      const maxPorts = Math.max(
        this.brains[node.brain].inputs.length,
        this.brains[node.brain].outputs.length
      );

      return {
        left: this.pxOfX(node.x) + "px",
        top: this.pxOfY(node.y) + "px",
        width: node.width * this.pxPerX + "px",
        height: this.handleSpace * (1 + maxPorts) * this.pxPerY + "px"
      };
    },
    handleInputDrag(to, input) {
      const ports = this.nodes[to].inputs.filter(edge => edge[0] === input);
      ports.forEach(([_input, from, output]) => {
        this.$store.dispatch("removeEdge", { from, to, input, output });
        this.temporaryEdges.push(["output", from, output]);
      });
      if (!ports.length) {
        this.temporaryEdges.push(["input", to, input]);
      }
    },
    // Dragging an output can only create a new edge
    handleOutputDrag(from, output) {
      const ports = this.nodes[from].outputs.filter(edge => edge[0] === output);
      this.temporaryEdges.push(["output", from, output]);
    },
    handleInputDrop(to, input) {
      this.temporaryEdges.forEach(([type, from, output]) => {
        // Can't drag an input to an input so just abort
        if (type === "input") return;
        this.$store.dispatch("addEdge", { from, to, input, output });
      });
    },
    handleOutputDrop(from, output) {
      this.temporaryEdges.forEach(([type, to, input]) => {
        // Can't drag an output to an output so just abort
        if (type === "output") return;
        this.$store.dispatch("addEdge", { from, to, input, output });
      });
    },

    handleDrop(node, type, index) {
      // console.log("from", this.isDraggingHandle, "to", [node, type, index]);
      // this.isDraggingHandle = false;
    },

    render() {
      // Prepare canvases
      this.contexts.forEach(ctx =>
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      );
      const [backgroundCtx, nodesCtx, edgesCtx] = this.contexts;

      // Draw beat marks
      const horizontalStart =
        Math.floor(this.xStart / this.gridSize) * this.gridSize;
      const horizontalEnd =
        Math.ceil(this.xEnd / this.gridSize) * this.gridSize;

      const verticalStart =
        Math.floor(this.yStart / this.gridSize) * this.gridSize;
      const verticalEnd = Math.ceil(this.yEnd / this.gridSize) * this.gridSize;

      const horizontalLines = range(
        horizontalStart,
        horizontalEnd,
        this.gridSize
      );
      const verticallLines = range(verticalStart, verticalEnd, this.gridSize);
      backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.2)`;

      for (const line of horizontalLines) {
        const x = this.pxOfX(line);

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x, 0);
        backgroundCtx.lineTo(x, this.canvasHeight);
        backgroundCtx.stroke();
      }

      for (const line of verticallLines) {
        const y = this.pxOfY(line);

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(0, y);
        backgroundCtx.lineTo(this.canvasWidth, y);
        backgroundCtx.stroke();
      }

      nodesCtx.strokeStyle = "hsla(0, 0%, 30%, 1)";
      nodesCtx.lineWidth = "2";

      Object.values(this.nodes).forEach(node => {
        node.outputs.forEach(([output, to, input]) => {
          const fromNode = node;
          const toNode = this.nodes[to];

          const inputLength = nodeMap[toNode.type].prototype.inputs.length;

          const { x: fromX, y: fromY } = this.xyOfPort(
            "output",
            fromNode.id,
            output
          );
          const { x: toX, y: toY } = this.xyOfPort("input", toNode.id, input);
          this.drawEdge(nodesCtx, fromX, fromY, toX, toY);
        });
      });

      // Render temporary edges, these exist when dragging an edge
      for (const port of this.temporaryEdges) {
        const { x, y } = this.xyOfPort(...port);
        const { x: mouseX, y: mouseY } = this.xyOfMouse();
        if (port[0] === "output") {
          this.drawEdge(nodesCtx, x, y, mouseX, mouseY);
        } else {
          this.drawEdge(nodesCtx, mouseX, mouseY, x, y);
        }
      }
    },
    xyOfMouse() {
      return {
        x: this.mousePosition.x - this.$el.offsetLeft,
        y: this.mousePosition.y - this.$el.offsetTop
      };
    },
    xyOfPort(type, nodeId, index) {
      const node = this.nodes[nodeId];
      const inputCount = nodeMap[node.type].prototype.inputs.length;
      const outputCount = nodeMap[node.type].prototype.outputs.length;
      const maxPorts = Math.max(inputCount, outputCount);
      const headerSpace = this.handleSpace;
      const handleSpace = this.handleSpace;
      if (type === "output") {
        return {
          x: this.pxOfX(node.x + node.width),
          y: this.pxOfY(node.y + headerSpace + handleSpace * (index + 0.5))
        };
      } else {
        return {
          x: this.pxOfX(node.x),
          y: this.pxOfY(node.y + headerSpace + handleSpace * (index + 0.5))
        };
      }
    },
    drawEdge(context, fromX, fromY, toX, toY) {
      const handleWidth = this.pxPerX * 50;
      context.beginPath();
      context.moveTo(fromX, fromY);
      context.bezierCurveTo(
        fromX + handleWidth,
        fromY,
        toX - handleWidth,
        toY,
        toX,
        toY
      );
      context.stroke();
    },
    canvasMouseDown(e) {
      if (this.keyboardState.includes("control")) {
        this.$store.dispatch("addNode", {
          type: this.selectedNodeType,
          x: this.pxToX(e.offsetX),
          y: this.pxToY(e.offsetY)
        });
      } else if (this.mouseState.includes(0)) {
        this.deselect();
      }
      this.render();
    },
    deselect() {
      this.$store.commit("SET_SELECTED_NODES", []);
    },
    pan({ x, y }) {
      this.xStart = this.xStart + x;
      this.xEnd = this.xEnd + x;
      this.yStart = this.yStart + y;
      this.render();
    },
    zoom({ x, y, xOrigin, yOrigin }) {
      // Orthographic viewport, so zoom both axis the same
      const zoom = (y * this.yCount) / 5;
      this.xStart -= zoom * xOrigin;
      this.xEnd += zoom * (1 - xOrigin);
      this.yStart -= (zoom * yOrigin) / 2;
      this.render();
    },
    keyDown(e) {},

    mouseDown(e) {},
    mouseUp(e) {
      this.temporaryEdges = [];
    },
    mouseMove({ e }) {
      if (this.mouseState.includes(0) && this.temporaryEdges.length === 0) {
        this.$store.commit("PAN_NODES", {
          x: e.movementX / this.pxPerX,
          y: e.movementY / this.pxPerY,
          nodeIds: this.selectedNodes
        });
      }
    },
    selectNodeType(nodeType) {
      this.selectedNodeType = nodeType;
    },
    bufferNodes() {},
    unbufferNodes() {}
  }
};
</script>

<style scoped>
.node-editor {
  position: relative;
  overflow: hidden;
}
.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.node {
  z-index: 10;
}
.add-menu {
  z-index: 11;
  position: absolute;
  right: 1em;
  top: 1em;
}
</style>


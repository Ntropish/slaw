<template>
  <div class="node-editor" @mousedown="onMouseDown" @wheel="onWheel">
    <canvas ref="background" class="canvas background" oncontextmenu="return false"/>
    <canvas ref="nodes" class="canvas nodes" oncontextmenu="return false"/>
    <canvas ref="edges" class="canvas edges" oncontextmenu="return false" @click="deselect"/>
    <Audio-node
      v-for="(node, id) in nodes"
      :key="id"
      class="node"
      :node="node"
      :style="computeNodeStyle(node)"
      :handle-spacing="10 * pxPerY"
      :selected="selectedNodes.includes(node.id)"
      @mousedown.native="nodeMouseDown(node.id)"
      @handle-drag="handleDrag(node.id, $event.type, $event.i)"
      @handle-drop="handleDrop(node.id, $event.type, $event.i)"
    />
    <add-menu class="add-menu" type="node"/>
    <!-- {{ keyboardState }} {{ mouseState }} -->
    {{ mousePosition }}
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
    selectedNodes: [],
    nodeBuffer: [],
    temporaryEdge: [],
    xStart: 0,
    xEnd: 800,
    yStart: 0,
    xSnap: 25,
    ySnap: 25,
    isDraggingHandle: false
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
      "edges",
      "tracks",
      "mouseState",
      "keyboardState",
      "mousePosition"
    ])
  },
  watch: {
    nodes(nodes) {
      this.render();
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
      return {
        left: this.pxOfX(node.x) + "px",
        top: this.pxOfY(node.y) + "px",
        width: node.width * this.pxPerX + "px",
        height: node.height * this.pxPerY + "px"
      };
    },
    handleDrag(nodeId, type, index) {
      this.$store.dispatch("removeEdge", nodeId);
      this.isDraggingHandle = [nodeId, type, index];
    },

    handleDrop(node, type, index) {
      console.log("from", this.isDraggingHandle, "to", [node, type, index]);
      this.isDraggingHandle = false;
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

      nodesCtx.strokeStyle = "hsla(0, 0%, 20%, 1)";
      nodesCtx.lineWidth = "2";

      for (const [from, output, to, input] of Object.values(this.edges)) {
        const fromNode = this.nodes[from];
        const toNode = this.nodes[to];

        const inputLength = nodeMap[toNode.type].prototype.inputs.length;

        const handleSpace = 10;

        this.drawEdge(
          nodesCtx,
          this.pxOfX(fromNode.x + fromNode.width),
          this.pxOfY(fromNode.y + handleSpace + handleSpace * output),
          this.pxOfX(toNode.x),
          this.pxOfY(
            toNode.y +
              toNode.height -
              handleSpace * inputLength +
              handleSpace * input
          )
        );
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
    deselect() {
      this.selectedNodes.splice(0);
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
    nodeMouseDown(id) {
      if (!this.keyboardState.includes("control")) this.deselect();
      if (!this.selectedNodes.includes(id)) this.selectedNodes.push(id);
    },
    mouseDown(e) {},
    mouseUp(e) {
      this.isDraggingHandle = false;
    },
    mouseMove({ e }) {
      if (this.mouseState.includes(0)) {
        this.$store.commit("PAN_NODES", {
          x: e.movementX,
          y: e.movementY,
          nodeIds: this.selectedNodes
        });
      }
    },
    loadModule: async function(moduleSpecifier) {
      // const moduleToLoad = import("src/" + moduleSpecifier);
      // for (const processor of moduleToLoad.processors) {
      //   if (this.processors.includes(processor)) continue;
      //   await this.transporter.context.audioWorklet.addModule(processor);
      //   this.processors.push(processor);
      // }
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


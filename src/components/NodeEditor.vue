<template>
  <div class="node-editor" @mousedown="onMouseDown" @wheel="onWheel">
    <canvas ref="background" class="canvas background" oncontextmenu="return false"/>
    <canvas ref="nodes" class="canvas nodes" oncontextmenu="return false"/>
    <canvas ref="edges" class="canvas edges" oncontextmenu="return false"/>
    <Audio-node
      v-for="node in displayNodes"
      :key="node.node.id"
      :node="node.node"
      :style="node.style"
    />
    <!-- {{ keyboardState }} {{ mouseState }} -->
  </div>
</template>

<script>
import { range } from "lodash";
import GridLand from "modules/GridLand";
import AudioNode from "components/AudioNode.vue";
import { setTimeout } from "timers";
import SinFactory from "nodes/Sin";
import EventTrackFactory from "nodes/EventTrack";
import ADSRFactory from "nodes/ADSR";
import DestinationFactory from "nodes/Destination";
import { mapState } from "vuex";
import nodeMap from "nodes";
const tools = {};
export default {
  components: { AudioNode },
  mixins: [GridLand],
  props: {},
  data: () => ({
    processors: [],
    modules: {},
    gridSize: 25,
    selectedNodes: [],
    xStart: 0,
    xEnd: 800,
    yStart: 0,
    xSnap: 25,
    ySnap: 25,
    nodeWorkers: {}
  }),

  computed: {
    canvases() {
      const canvasNames = ["background", "nodes", "edges"];
      return canvasNames.map(name => this.$refs[name]);
    },
    viewHeight() {
      return this.pxPerUnit * this.canvasHeight;
    },
    displayNodes() {
      return Object.values(this.nodes).map(node => {
        return {
          style: {
            left: this.pxOfX(node.x) + "px",
            top: this.pxOfY(node.y) + "px",
            width: node.width * this.pxPerX + "px",
            height: node.height * this.pxPerY + "px"
          },
          node
        };
      });
    },
    yEnd() {
      return this.yStart + (this.xCount * this.canvasHeight) / this.canvasWidth;
    },
    ...mapState([
      "nodes",
      "edges",
      "tracks",
      "events",
      "mouseState",
      "keyboardState"
    ]),
    ...mapState({
      _transporter: "transporter",
      transporter() {
        if (!this._transporter) {
          this.$store.commit("BUILD_TRANSPORTER");
        }
        return this._transporter;
      }
    })
  },
  watch: {
    nodes(nodes) {
      this.render();
    },
    transporter(transporter) {
      if (transporter) this.onTransporter();
    }
  },
  methods: {
    onTransporter() {
      for (const node of Object.values(this.nodes)) {
        this.nodeWorkers[node.id] = nodeMap[node.type](
          this.transporter,
          node.data
        );
      }

      for (const [from, output, to, input] of Object.values(this.edges)) {
        this.nodeWorkers[from].connect(this.nodeWorkers[to], output, input);
      }
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

      nodesCtx.strokeStyle = "hsla(0, 0%, 100%, 0.6)";
      nodesCtx.lineWidth = "3";

      for (const [from, output, to, input] of Object.values(this.edges)) {
        const fromNode = this.nodes[from];
        const toNode = this.nodes[to];

        this.drawEdge(
          nodesCtx,
          this.pxOfX(fromNode.x + fromNode.width),
          this.pxOfY(fromNode.y + 10 + 10 * output),
          this.pxOfX(toNode.x),
          this.pxOfY(toNode.y + 10 + 10 * input)
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
    keyDown(e) {
      // console.log("keydown");
    },
    mouseDown(e) {
      // console.log("mousedown");
    },
    mouseUp(e) {
      // console.log("mouseup");
    },
    mouseMove(e) {
      // console.log("move");
    },
    loadModule: async function(moduleSpecifier) {
      // const moduleToLoad = import("src/" + moduleSpecifier);
      // for (const processor of moduleToLoad.processors) {
      //   if (this.processors.includes(processor)) continue;
      //   await this.transporter.context.audioWorklet.addModule(processor);
      //   this.processors.push(processor);
      // }
    }
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
</style>


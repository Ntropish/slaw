<template>
  <div class="root" @mousedown="onMouseDown">
    <canvas ref="background" class="canvas background"/>
    <canvas ref="nodes" class="canvas nodes"/>
    <canvas ref="edges" class="canvas edges"/>
    {{ keysState }} {{ mouseState}}
  </div>
</template>

<script>
import { range } from "lodash";
import GridLand from "./GridLand";
const tools = {};
export default {
  mixins: [GridLand],
  props: {
    nodes: {
      type: Object,
      default: () => {}
    },
    edges: {
      type: Object,
      default: () => {}
    },
    tracks: {
      type: Object,
      default: () => {}
    },
    events: {
      type: Object,
      default: () => {}
    }
  },
  data: () => ({
    context: new AudioContext(),
    processors: [],
    modules: {},
    gridSize: 25,
    selectedNodes: []
  }),
  computed: {
    canvases() {
      const canvasNames = ["background", "nodes", "edges"];
      return canvasNames.map(name => this.$refs[name]);
    },
    viewHeight() {
      return this.pxPerUnit * this.canvasHeight;
    }
  },
  watch: {
    nodes(nodes) {
      this.render();
    }
  },

  methods: {
    render() {
      // Prepare canvases
      this.contexts.forEach(ctx =>
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      );
      const [backgroundCtx, nodesCtx, edgesCtx] = this.contexts;

      // Draw beat marks
      const horizontalStart = Math.ceil(this.xStart);
      const horizontalEnd = Math.floor(this.xEnd);

      const verticalStart = Math.ceil(this.yStart);
      const verticalEnd = Math.floor(this.yEnd);

      const horizontalLines = range(
        horizontalStart,
        horizontalEnd,
        this.gridSize
      );
      const verticallLines = range(verticalStart, verticalEnd, this.gridSize);

      for (const line of horizontalLines) {
        const x = Math.round(line * this.pxPerX - this.xStart);

        if (line % 2 === 0) {
          backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.4)`;
        } else {
          backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.2)`;
        }

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(x, 0);
        backgroundCtx.lineTo(x, this.canvasHeight);
        backgroundCtx.stroke();
      }

      for (const line of verticallLines) {
        const y = Math.round(line * this.pxPerY - this.yStart);

        if (line % 2 === 0) {
          backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.4)`;
        } else {
          backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.2)`;
        }

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(0, y);
        backgroundCtx.lineTo(this.canvasWidth, y);
        backgroundCtx.stroke();
      }

      nodesCtx.fillStyle = `hsla(0, 0%, 60%, 0.9)`;
      for (const node of Object.values(this.nodes)) {
        nodesCtx.fillRect(
          node.position.x * this.pxPerX,
          node.position.y * this.pxPerY,
          150 * this.pxPerX,
          200 * this.pxPerY
        );
      }
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
      const moduleToLoad = import("renderer/" + moduleSpecifier);
      for (const processor of moduleToLoad.processors) {
        if (this.processors.includes(processor)) continue;
        await this.context.audioWorklet.addModule(processor);
        this.processors.push(processor);
      }
    }
  }
};
</script>

<style scoped>
.root {
  position: relative;
}
.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
</style>


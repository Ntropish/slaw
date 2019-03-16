<template>
  <div class="root">
    <canvas ref="background" class="canvas background"/>
    <canvas ref="nodes" class="canvas nodes"/>
    <canvas ref="edges" class="canvas edges"/>
  </div>
</template>

<script>
import { range } from "lodash";

export default {
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
    canvasWidth: 300,
    canvasHeight: 150,
    view: {
      top: 0,
      left: 0,
      width: 600 // aspect ratio is determined by the layout
    }
  }),
  computed: {
    canvases() {
      const canvasNames = ["background", "nodes", "edges"];
      return canvasNames.map(name => this.$refs[name]);
    },
    viewHeight() {
      return this.pxPerUnit * this.canvasHeight;
    },
    pxPerUnit() {
      return this.canvasWidth / this.view.width;
    }
  },
  watch: {
    nodes(nodes) {
      this.render();
    }
  },
  mounted() {
    window.addEventListener("resize", this.sizeCanvas);
    this.sizeCanvas();
    this.render();
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.sizeCanvas);
  },
  methods: {
    render() {
      // Prepare canvases
      const contexts = this.canvases.map(c => c.getContext("2d"));
      contexts.forEach(ctx =>
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      );
      const [backgroundCtx, nodesCtx, edgesCtx] = contexts;

      // Draw beat marks
      const horizontalStart = Math.ceil(this.view.left);
      const horizontalEnd = Math.floor(this.view.left + this.view.width);

      const verticalStart = Math.ceil(this.view.top);
      const verticalEnd = Math.floor(this.view.top + this.viewHeight);

      const horizontalLines = range(
        horizontalStart,
        horizontalEnd,
        this.gridSize
      );
      const verticallLines = range(verticalStart, verticalEnd, this.gridSize);

      for (const line of horizontalLines) {
        const x = Math.round(line * this.pxPerUnit - this.view.left);

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
        const y = Math.round(line * this.pxPerUnit - this.view.left);

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
        nodesCtx.fillRect(node.position.x, node.position.y, 150, 200);
      }
    },

    loadModule: async function(moduleSpecifier) {
      const moduleToLoad = import("renderer/" + moduleSpecifier);
      for (const processor of moduleToLoad.processors) {
        if (this.processors.includes(processor)) continue;
        await this.context.audioWorklet.addModule(processor);
        this.processors.push(processor);
      }
    },
    sizeCanvas() {
      const styles = getComputedStyle(this.canvases[0]);
      const w = parseInt(styles.getPropertyValue("width"), 10);
      const h = parseInt(styles.getPropertyValue("height"), 10);

      this.canvases.forEach(canvas => {
        canvas.width = w;
        canvas.height = h;
      });

      this.canvasWidth = w;
      this.canvasHeight = h;

      this.render();
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


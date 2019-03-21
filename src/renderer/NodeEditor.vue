<template>
  <div class="node-editor" @mousedown="onMouseDown" @wheel="onWheel">
    <canvas ref="background" class="canvas background"/>
    <canvas ref="nodes" class="canvas nodes"/>
    <canvas ref="edges" class="canvas edges"/>
    <Audio-node
      v-for="node in displayNodes"
      :key="node.node.id"
      :node="node.node"
      :style="node.style"
    />
    {{ keysState }} {{ mouseState }}
  </div>
</template>

<script>
import { range } from "lodash";
import GridLand from "./GridLand";
import AudioNode from "./AudioNode.vue";
import { setTimeout } from "timers";
const tools = {};
export default {
  components: { AudioNode },
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
    },
    tempo: {
      type: Number,
      default: () => 60
    },
    transporter: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    processors: [],
    modules: {},
    gridSize: 25,
    selectedNodes: [],
    xStart: 0,
    xEnd: 800,
    yStart: 0,
    xSnap: {
      type: Number,
      default: () => 1 / 4
    },
    ySnap: {
      type: Number,
      default: () => 1
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
    displayNodes() {
      return Object.values(this.nodes).map(node => {
        return {
          style: {
            left: this.pxOfX(node.position.x) + "px",
            top: this.pxOfY(node.position.y) + "px",
            width: 150 * this.pxPerX + "px",
            height: 200 * this.pxPerY + "px"
          },
          node
        };
      });
    },
    yEnd() {
      return this.yStart + (this.xCount * this.canvasHeight) / this.canvasWidth;
    }
  },
  watch: {
    nodes(nodes) {
      this.render();
    }
  },
  mounted() {
    const osc = this.transporter.context.createOscillator();
    osc.connect(this.transporter.context.destination);
    const track = this.tracks[0];
    const notesPlaying = [];
    const timeoutBufferSize = 50;
    const timeoutBuffer = new Array(timeoutBufferSize);
    let timeoutIndex = 0;

    this.transporter.on("schedule", data => {
      track.events
        .map(id => this.events[id])
        .forEach(note => {
          if (note.beat >= data.beat && note.beat < data.beat + data.beats) {
            const bpms = this.transporter.bpms;
            const delay = data.after + (note.beat - data.beat) / bpms;
            timeoutBuffer[timeoutIndex++] = window.setTimeout(() => {
              // Because this is monophonic clear playing notes
              clearNotes();
              triggerNote(note.id, delay);
              notesPlaying.push(note.id);
            }, delay);
            const offDelay =
              data.after + (note.beat + note.beats - data.beat) / bpms;
            timeoutBuffer[timeoutIndex++] = window.setTimeout(() => {
              clearNote(note.id);
            }, offDelay);
          }
        });
    });

    this.transporter.on("clear", () => {
      for (let i = 0; i < timeoutBufferSize; i++) {
        window.clearTimeout(timeoutBuffer[i]);
      }
      clearNotes();
    });

    function triggerNote(id) {
      console.log("on", id);
    }

    function clearNote(id) {
      const index = notesPlaying.indexOf(id);
      if (index === -1) return;
      console.log("off", id);
      notesPlaying.splice(index);
    }

    function clearNotes() {
      while (notesPlaying.length) {
        const note = notesPlaying[0];
        clearNote(note);
      }
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

      nodesCtx.strokeStyle = `hsla(0, 0%, 60%, 0.9)`;
      for (const node of Object.values(this.nodes)) {
        const x = this.pxOfX(node.position.x);
        const y = this.pxOfY(node.position.y);
        const width = 150 * this.pxPerX;
        const height = 200 * this.pxPerY;

        nodesCtx.strokeRect(x, y, width, height);
      }
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
      const moduleToLoad = import("renderer/" + moduleSpecifier);
      for (const processor of moduleToLoad.processors) {
        if (this.processors.includes(processor)) continue;
        await this.transporter.context.audioWorklet.addModule(processor);
        this.processors.push(processor);
      }
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


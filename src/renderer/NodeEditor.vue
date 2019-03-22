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
    const now = this.transporter.context.getOutputTimestamp().contextTime;
    const track = this.tracks[0];
    let timers = [];
    let timerIndex = 0;
    let isPlaying = false;
    const delay = (fn, seconds, msg) => {
      console.log("register delay", msg);
      if (!seconds) return fn();
      timers[timerIndex++] = window.setTimeout(fn, seconds * 1000);
    };
    this.transporter.on("schedule", data => {
      console.log(data);
      const events = [];
      track.events
        .map(id => this.events[id])
        .forEach(note => {
          const at = data.at + (note.beat - data.beat) / this.transporter.bps;
          // console.log(note, data);
          if (note.beat >= data.beat && note.beat < data.beat + data.beats) {
            events.push({
              type: "on",
              beat: note.beat,
              frequency: 440 * 2 ** (note.pitch / 1200),
              at
            });
          }
          if (
            note.beat + note.beats >= data.beat &&
            note.beat + note.beats < data.beat + data.beats
          ) {
            events.push({
              type: "off",
              beat: note.beat + note.beats,
              at: at + note.beats / this.transporter.bps
            });
          }
        });

      let state = "off";
      let filteredEvents = events
        .sort((a, b) => {
          return a.beat - b.beat;
        })
        .filter(event => {
          if (event.type === state) return false;

          if (event.type === "off") {
            const matchingNoteOn = events.find(
              e => e.type === "on" && e.beat === event.beat
            );
            if (matchingNoteOn) return false;
          }
          state = event.state;
          return true;
        });

      console.log(events, filteredEvents);

      filteredEvents.forEach((event, index) => {
        // Every frequency change can be scheduled immediately
        if (event.type === "on") {
          osc.frequency.setValueAtTime(event.frequency, event.at);
        }
        const now = this.transporter.context.getOutputTimestamp().contextTime;
        const delayAmount = Math.max(0, event.at - now);

        if (event.type === "on") {
          // console.log("start", delayAmount);

          delay(
            () => {
              const now = this.transporter.context.getOutputTimestamp()
                .contextTime;
              // if (isPlaying) return console.log("abort play");
              console.log("starting", now, index, event);
              osc.start();
              isPlaying = true;
            },
            delayAmount,
            "start" + index
          );
        } else {
          // console.log("stop", delayAmount, event.at, now);

          delay(
            () => {
              const now = this.transporter.context.getOutputTimestamp()
                .contextTime;
              if (!isPlaying) return console.log("abort stop");
              console.log("stopping", now, index, event);
              osc.stop();
              isPlaying = false;
            },
            delayAmount,
            "stop" + index
          );
        }
      });
    });
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


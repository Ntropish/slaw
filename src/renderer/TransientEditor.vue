<template>
  <div class="root">
    <canvas ref="background" class="canvas background"/>
    <canvas ref="notes" class="canvas notes"/>
  </div>
</template>

<script>
import { range } from "lodash";

const dark = "hsla(0, 0%, 0%, 0.2)";
const light = "hsla(0, 0%, 100%, 0.4)";
const pianoNoteColors = [
  light,
  dark,
  light,
  dark,
  light,
  light,
  dark,
  light,
  dark,
  light,
  dark,
  light
];
export default {
  data: () => ({
    octaveStart: -2,
    octaveEnd: 2,
    canvasWidth: 300,
    canvasHeight: 150,
    renders: 0
  }),
  computed: {
    octaves() {
      return range(this.octaveStart, this.octaveEnd);
    },
    pianoNoteCount() {
      return this.octaves.length * 12;
    },
    pianoNoteHeight() {
      return this.canvasHeight / this.pianoNoteCount;
    },
    beatCount() {
      return this.end - this.start;
    },
    pxPerBeat() {
      return this.canvasWidth / this.beatCount;
    }
  },
  props: {
    start: {
      type: Number,
      required: true
    },
    end: {
      type: Number,
      required: true
    },
    tracks: {
      type: Array,
      default: () => []
    }
  },
  mounted() {
    this.sizeCanvas();
    window.addEventListener("resize", this.sizeCanvas);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.sizeCanvas);
  },
  methods: {
    render() {
      this.renders++;
      const canvas = this.$refs.background;
      const ctx = canvas.getContext("2d");

      for (let pianoNote = 0; pianoNote < this.pianoNoteCount; pianoNote++) {
        ctx.fillStyle = pianoNoteColors[pianoNote % 12];
        ctx.fillRect(
          0,
          pianoNote * this.pianoNoteHeight,
          this.canvasWidth,
          this.pianoNoteHeight
        );
      }

      for (let track of this.tracks) {
        ctx.fillStyle = `hsla(${track.hue}, 20%, 80%, 1)`;
        for (let note of track.events) {
          ctx.fillRect(note.beat * this.pxPerBeat);
        }
      }
    },
    sizeCanvas() {
      const background = this.$refs.background;
      const notes = this.$refs.background;
      const styles = getComputedStyle(background);
      const w = parseInt(styles.getPropertyValue("width"), 10);
      const h = parseInt(styles.getPropertyValue("height"), 10);

      background.width = w;
      background.height = h;

      notes.width = w;
      notes.height = h;

      this.canvasWidth = w;
      this.canvasHeight = h;

      this.render();
    }
  }
};
</script>

<style scoped>
.root {
  overflow: hidden;
}

.canvas {
  width: 100%;
  height: 100%;
}
</style>


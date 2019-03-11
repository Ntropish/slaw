<template>
  <div class="root" @mousedown="onMouseDown" @mouseup="onMouseUp">
    <canvas ref="notes" class="canvas notes"/>
    
    <canvas ref="background" class="canvas background"/>
  </div>
</template>

<script>
import { range } from "lodash";

const dark = "hsla(0, 0%, 0%, 0.1)";
const light = "hsla(0, 0%, 100%, 0.1)";
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
].reverse();
export default {
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
  data: () => ({
    octaveStart: -2,
    octaveEnd: 2,
    canvasWidth: 300,
    canvasHeight: 150,
    renders: 0,
    mouseIsDown: false,
    noteSelection: []
  }),
  computed: {
    octaves() {
      return range(this.octaveStart, this.octaveEnd);
    },
    octavesCount() {
      return this.octaveEnd - this.octaveStart;
    },
    octaveHeight() {
      return this.canvasHeight / this.octavesCount;
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
    },
    middleCY() {
      // As in the y position of middle C
      return this.octaveEnd * this.octaveHeight;
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
      const backgroundCanvas = this.$refs.background;
      const backgroundCtx = backgroundCanvas.getContext("2d");

      const notesCanvas = this.$refs.notes;
      const notesCtx = notesCanvas.getContext("2d");

      for (let pianoNote = 0; pianoNote < this.pianoNoteCount; pianoNote++) {
        backgroundCtx.fillStyle = pianoNoteColors[pianoNote % 12];
        backgroundCtx.fillRect(
          0,
          pianoNote * this.pianoNoteHeight,
          this.canvasWidth,
          this.pianoNoteHeight
        );
      }

      for (let track of this.tracks) {
        notesCtx.fillStyle = `hsla(${track.hue}, 20%, 80%, 1)`;
        for (let note of track.events) {
          notesCtx.fillRect(
            note.beat * this.pxPerBeat - this.start,
            this.middleCY - (note.pitch / 100) * this.pianoNoteHeight,
            this.pxPerBeat * note.beats,
            this.pianoNoteHeight
          );
        }
      }
    },
    onMouseDown(e) {
      const noteId = this.scanForNote(e.offsetX, e.offsetY);
    },
    onMouseUp(e) {},
    scanForNote(x, y) {
      const notesFromTop = Math.floor(y / this.pianoNoteHeight);
      const notesFromC = this.octaveEnd * 12 - notesFromTop;
      const pitch = notesFromC * 100;

      const beat = this.start + (x / this.canvasWidth) * this.beatCount;

      const clickedNotes = this.tracks
        .flatMap(track => track.events)
        .filter(note => {
          if (Math.abs(note.pitch - pitch) > 50) return false;
          if (note.beat < beat && beat < note.beat + note.beats) return true;
        });

      console.log(pitch, beat, clickedNotes.count);
    },

    sizeCanvas() {
      const background = this.$refs.background;
      const notes = this.$refs.notes;
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
  position: relative;
  background: hsla(0, 0%, 20%, 1);
}

.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

.canvas.notes {
  filter: drop-shadow();
}
</style>


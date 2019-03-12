<template>
  <div class="root" @mousedown="onMouseDown" @mouseup="onMouseUp" @mousemove="onMouseMove">
    <canvas ref="notes" class="canvas notes"/>
    <canvas ref="background" class="canvas background"/>
    {{ selectedNotes }}
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

let eventMoveBufferX = 0;
let eventMoveBufferY = 0;

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
    },
    events: {
      type: Object,
      default: () => {}
    }
  },
  data: () => ({
    octaveStart: -2,
    octaveEnd: 2,
    canvasWidth: 300,
    canvasHeight: 150,
    selectedNotes: [],
    mouseIsDown: false
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
      const backgroundCanvas = this.$refs.background;
      const backgroundCtx = backgroundCanvas.getContext("2d");

      const notesCanvas = this.$refs.notes;
      const notesCtx = notesCanvas.getContext("2d");

      backgroundCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      notesCtx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);

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
        track.events.forEach(eventId => {
          const note = this.events[eventId];
          if (this.isNoteSelected(eventId)) {
            notesCtx.fillStyle = `hsla(${track.hue}, 40%, 90%, 1)`;
          } else {
            notesCtx.fillStyle = `hsla(${track.hue}, 30%, 60%, 1)`;
          }
          notesCtx.fillRect(
            note.beat * this.pxPerBeat - this.start,
            this.middleCY - (note.pitch / 100 - 2) * this.pianoNoteHeight,
            this.pxPerBeat * note.beats,
            this.pianoNoteHeight
          );
        });
      }
    },
    onMouseDown(e) {
      this.mouseIsDown = true;

      const noteClicked = this.scanForNotes(e.offsetX, e.offsetY)[0];
      const { selectedNotes } = this;

      if (!noteClicked) {
        selectedNotes.splice(0);
      } else if (selectedNotes.length === 1) {
        selectedNotes.splice(0);
        selectedNotes.push(noteClicked);
      } else if (!this.isNoteSelected(noteClicked)) {
        selectedNotes.push(noteClicked);
      }

      this.render();
    },
    onMouseUp(e) {
      this.mouseIsDown = false;
      eventMoveBufferX = 0;
      eventMoveBufferY = 0;
    },
    onMouseMove(e) {
      if (this.mouseIsDown && this.selectedNotes.length) {
        eventMoveBufferX += e.movementX;
        eventMoveBufferY -= e.movementY;

        const beatsDrug = eventMoveBufferX / this.pxPerBeat;
        const centsDrug = (eventMoveBufferY / this.pianoNoteHeight) * 100;

        const beatsMoved = Math.floor(beatsDrug / 0.25);
        eventMoveBufferX -= beatsMoved * this.pxPerBeat * 0.25;

        const centsMoved = Math.floor(centsDrug / 100);
        eventMoveBufferY -= centsMoved * this.pianoNoteHeight;

        if (beatsMoved || centsMoved) {
          this.moveSelectedNotes(beatsMoved, centsMoved);
        }
      }
    },
    moveSelectedNotes(beats, cents) {
      this.$emit("notemove", {
        notes: this.selectedNotes,
        beats,
        cents
      });
    },
    scanForNotes(x, y) {
      const notesFromTop = Math.floor(y / this.pianoNoteHeight);
      const notesFromA = this.octaveEnd * 12 - notesFromTop + 2;
      const pitch = notesFromA * 100;
      const beat = this.start + (x / this.canvasWidth) * this.beatCount;

      const foundNotes = [];
      for (const [id, note] of Object.entries(this.events)) {
        if (
          Math.abs(note.pitch - pitch) < 50 &&
          note.beat < beat &&
          beat < note.beat + note.beats
        ) {
          foundNotes.push(id);
        }
      }

      return foundNotes;
    },
    isNoteSelected(id) {
      return this.selectedNotes.includes(id);
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


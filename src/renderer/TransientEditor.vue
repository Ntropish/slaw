<template>
  <div
    class="root"
    ondragstart="return false"
    :style="{cursor: cursor}"
    @mousedown="onMouseDown"
    @mouseleave="onMouseLeave"
  >
    <canvas ref="background" class="canvas background"/>
    <canvas ref="notes" class="canvas notes"/>
    <canvas ref="util" class="canvas util"/>
  </div>
</template>

<script>
import { range } from "lodash";
import GridLand from "./GridLand";

const dark = "hsla(0, 0%, 0%, 0.1)";
const light = "hsla(0, 0%, 100%, 0.00)";
const lighter = "hsla(0, 0%, 100%, 0.01)";
const pianoNoteColors = [
  lighter,
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

// Event dragging ammounts are stored here until
// they get big enough to turn into an action.
// This allows drag to snap to grid
let eventMoveBufferX = 0;
let eventMoveBufferY = 0;
let eventResizeBuffer = 0;

let selectedNotesStash = null;

const tools = {
  resize: {
    noteHovered: {
      cursor: "ew-resize",
      cursorDown: "ew-resize"
    },
    noteNotHovered: {
      cursor: "ew-resize",
      cursorDown: "ew-resize"
    }
  },
  move: {
    noteHovered: {
      cursor: "grab",
      cursorDown: "grabbing"
    },
    noteNotHovered: {
      cursor: "default",
      cursorDown: "grabbing"
    }
  }
};
export default {
  mixins: [GridLand],
  props: {
    xStart: {
      type: Number,
      required: true
    },
    xEnd: {
      type: Number,
      required: true
    },
    track: {
      type: Object,
      default: () => {}
    },
    events: {
      type: Object,
      default: () => {}
    },
    xSnap: {
      type: Number,
      default: () => 1 / 4
    },
    ySnap: {
      type: Number,
      default: () => 1
    },
    beatCursor: {
      type: Number,
      default: () => 0
    }
  },
  data: () => ({
    yStart: -5000,
    yEnd: 5000,
    canvasWidth: 300,
    canvasHeight: 150,
    selectedNotes: [],
    temporarySelectedNotes: [],
    hoveredNotes: [],
    cursor: "default"
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
    middleCY() {
      // As in the y position of middle C
      return this.octaveEnd * this.octaveHeight;
    },
    canvases() {
      return [this.$refs.background, this.$refs.notes, this.$refs.util];
    },
    dragTool() {
      if (this.keysState.includes("r")) return "resize";
      return "move";
    }
  },
  methods: {
    render() {
      // Prepare canvases
      this.contexts.forEach(ctx =>
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      );
      const [backgroundCtx, notesCtx, utilCtx] = this.contexts;

      // // Draw piano keys
      // for (let pianoNote = 0; pianoNote < this.pianoNoteCount; pianoNote++) {
      //   backgroundCtx.fillStyle = pianoNoteColors[pianoNote % 12];
      //   backgroundCtx.fillRect(
      //     0,
      //     pianoNote * this.pianoNoteHeight,
      //     this.canvasWidth,
      //     this.pianoNoteHeight
      //   );
      // }

      // // Draw beat marks
      // const start = Math.ceil(this.start);
      // const end = Math.floor(this.end);

      // const lines = range(start, end);

      // for (const line of lines) {
      //   const x = Math.round(line * this.pxPerBeat - this.start);

      //   if (line % 4 === 0) {
      //     backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.4)`;
      //   } else {
      //     backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.2)`;
      //   }

      //   backgroundCtx.beginPath();
      //   backgroundCtx.moveTo(x, 0);
      //   backgroundCtx.lineTo(x, this.canvasHeight);
      //   backgroundCtx.stroke();
      // }

      // Draw notes
      this.track.events.forEach(eventId => {
        const note = this.events[eventId];
        if (this.temporarySelectedNotes.includes(eventId)) {
          notesCtx.fillStyle = `hsla(${this.track.hue}, 40%, 80%, 1)`;
        } else if (this.selectedNotes.includes(eventId)) {
          notesCtx.fillStyle = `hsla(${this.track.hue}, 40%, 90%, 1)`;
        } else {
          notesCtx.fillStyle = `hsla(${this.track.hue}, 30%, 60%, 1)`;
        }
        // notesCtx.fillRect
        notesCtx.fillRect(
          this.pxOfX(note.beat),
          this.pxOfY(note.pitch),
          this.pxPerX * note.beats,
          this.pxPerY * 100
        );
      });

      if (this.boxSelectStart && this.boxSelectEnd) {
        utilCtx.strokeStyle = `hsla(0, 0%, 100%, 0.4)`;
        // Draw box selector
        utilCtx.strokeRect(
          this.boxSelectStart.x,
          this.boxSelectStart.y,
          this.boxSelectEnd.x - this.boxSelectStart.x,
          this.boxSelectEnd.y - this.boxSelectStart.y
        );
      }

      const cursorX = this.pxOfX(this.beatCursor);
      utilCtx.strokeStyle = `hsla(0, 0%, 100%, 0.4)`;
      utilCtx.beginPath();
      utilCtx.moveTo(cursorX, 0);
      utilCtx.lineTo(cursorX, this.canvasHeight);
      utilCtx.stroke();
    },
    updateCursor() {
      const noteIsHovered = this.hoveredNotes.length !== 0;
      const keyOne = noteIsHovered ? "noteHovered" : "noteNotHovered";
      const keyTwo = this.mouseIsDown ? "cursorDown" : "cursor";
      this.cursor = tools[this.dragTool][keyOne][keyTwo];
    },
    keyDown(e) {
      if (this.keysState.includes("q")) this.quantize();
    },
    keyUp(e) {
      const index = this.keysState.indexOf(e.key);
      if (index === -1) return;
      this.keysState.splice(index, 1);
    },
    clearkeysState(e) {
      this.keysState.splice(0);
    },
    mouseDown(e) {
      const x = e.offsetX;
      const y = e.offsetY;

      const noteClicked = this.scanForNotes(x, y)[0];
      const { selectedNotes } = this;

      if (noteClicked && !this.selectedNotes.includes(noteClicked)) {
        if (!e.ctrlKey) selectedNotes.splice(0);
        selectedNotes.push(noteClicked);
      }

      if (this.keysState.includes("Shift")) {
        if (!noteClicked) {
          // Trigger box select
          if (!this.keysState.includes("Control")) selectedNotes.splice(0);
          return this.boxSelect(e);
        } else {
          // Trigger note copy
          this.$emit("notecopy", {
            notes: selectedNotes,
            trackId: this.track.id
          });
        }
      }

      if (!noteClicked) {
        selectedNotes.splice(0);
        // Ctrl click to add note
        if (this.keysState.includes("Control")) {
          const [unsnappedBeat, unsnappedPitch] = this.xyToBeatPitch(x, y);
          const pitch =
            Math.round(unsnappedPitch / this.pitchSnap) * this.pitchSnap;
          const beat =
            Math.round(unsnappedBeat / this.beatSnap) * this.beatSnap;

          this.$emit("noteadd", { beat, pitch, trackId: this.track.id });
        } else {
          // Else just move the cursor to the clicked location
          // Snapping can't be disabled on click because ctrl click
          // is already for adding notes
          const beatClicked = this.xToBeat(x);
          const beat = Math.round(beatClicked / this.beatSnap) * this.beatSnap;
          this.$emit("cursorset", {
            beat
          });
        }
      }

      if (e.altKey && selectedNotes.length) {
        this.$emit("noteremove", {
          notes: selectedNotes,
          trackId: this.track.id
        });
      }

      this.updateCursor();
      this.render();
    },
    mouseUp(e) {
      const note = this.scanForNotes(e.offsetX, e.offsetY)[0];
      this.mouseIsDown = false;
      eventMoveBufferX = 0;
      eventMoveBufferY = 0;
      if (this.boxSelectStart) {
        this.boxSelectFinish(e);
        this.boxSelectStart = null;
        this.boxSelectEnd = null;
      }
      this.updateCursor();
      this.render();
    },
    mouseMove(e) {
      const notes = this.scanForNotes(e.offsetX, e.offsetY);
      this.hoveredNotes = notes;
      const note = notes && notes[0];

      if (!note && !this.mouseIsDown && this.dragTool === "move") {
        this.updateCursor();
        return;
      }

      if (this.boxSelectStart) {
        this.boxSelectUpdate(e);
      } else if (this.mouseIsDown && this.selectedNotes.length) {
        if (this.dragTool === "move") {
          this.moveTool(e);
        } else if (this.dragTool === "resize") {
          this.resizeTool(e);
        }
      } else if (this.mouseIsDown) {
        const beatClicked = this.xToBeat(e.offsetX);
        const beat = e.ctrlKey
          ? beatClicked
          : Math.round(beatClicked / this.beatSnap) * this.beatSnap;
        this.$emit("cursorset", {
          beat
        });
      }

      this.render();
      this.updateCursor();
    },
    moveTool(e) {
      // Hold control to move without snap
      const snap = !this.keysState.includes("Control");

      // Snapping shouldn't be disabled for pitch
      eventMoveBufferY -= e.movementY;

      if (snap) {
        eventMoveBufferX += e.movementX;
      } else {
        eventMoveBufferX = e.movementX;
      }

      const beatsDrug = eventMoveBufferX / this.pxPerBeat;
      const centsDrug = (eventMoveBufferY / this.pianoNoteHeight) * 100;

      const beatsMoved = snap
        ? Math.round(beatsDrug / this.beatSnap) * this.beatSnap
        : beatsDrug;
      const centsMoved = Math.round(centsDrug / 100) * 100;

      eventMoveBufferX -= beatsMoved * this.pxPerBeat;
      eventMoveBufferY -= (centsMoved * this.pianoNoteHeight) / 100;

      if (beatsMoved || centsMoved) {
        this.moveSelectedNotes(beatsMoved, centsMoved);
      }
    },
    resizeTool(e) {
      eventResizeBuffer += e.movementX;
      const beats = eventResizeBuffer / this.pxPerBeat;

      // Hold control to move without snap
      const snap = !this.keysState.includes("Control");

      const beatsMoved = snap
        ? Math.floor(beats / this.beatSnap) * this.beatSnap
        : beats;
      eventResizeBuffer -= beatsMoved * this.pxPerBeat;
      this.$emit("noteresize", {
        notes: this.selectedNotes,
        beats: beatsMoved
      });
    },
    quantize() {
      this.$emit("notequantize", {
        notes: this.selectedNotes
      });
      this.updateCursor();
      this.render();
    },
    onMouseLeave(e) {
      this.onMouseUp(e);
    },
    boxSelect(e) {
      this.temporarySelectedNotes.push(...this.selectedNotes);
      this.boxSelectStart = { x: e.offsetX, y: e.offsetY };
    },
    boxSelectFinish(e) {
      this.boxSelectUpdate(e);
      this.temporarySelectedNotes.forEach(noteId => {
        if (!this.selectedNotes.includes(noteId)) {
          this.selectedNotes.push(noteId);
        }
      });
      this.temporarySelectedNotes.splice(0);
    },
    boxSelectUpdate(e) {
      this.boxSelectEnd = { x: e.offsetX, y: e.offsetY };

      const notes = this.scanBoxForNotes(
        Math.min(this.boxSelectStart.x, this.boxSelectEnd.x),
        Math.min(this.boxSelectStart.y, this.boxSelectEnd.y),
        Math.max(this.boxSelectStart.x, this.boxSelectEnd.x),
        Math.max(this.boxSelectStart.y, this.boxSelectEnd.y)
      );

      this.selectedNotes.splice(0);
      this.selectedNotes.push(...notes);

      this.render({});
    },
    moveSelectedNotes(beats, cents) {
      this.$emit("notemove", {
        notes: this.selectedNotes,
        beats,
        cents
      });
      this.render();
    },
    scanBoxForNotes(x1, y1, x2, y2) {
      let [beat1, pitch1] = this.xyToBeatPitch(x1, y1);
      let [beat2, pitch2] = this.xyToBeatPitch(x2, y2);

      const foundNotes = [];
      for (const noteId of this.track.events) {
        const note = this.events[noteId];
        const a = note.pitch - 50 < pitch1;
        const b = note.pitch + 50 > pitch2;
        const c = note.beat + note.beats > beat1;
        const d = note.beat < beat2;
        if (a && b && c && d) {
          foundNotes.push(noteId);
        }
      }

      return foundNotes;
    },
    scanForNotes(x, y) {
      let [beat, pitch] = this.xyToBeatPitch(x, y);

      const foundNotes = [];
      for (const noteId of this.track.events) {
        const note = this.events[noteId];
        if (
          Math.abs(note.pitch - pitch) < 50 &&
          note.beat < beat &&
          beat < note.beat + note.beats
        ) {
          foundNotes.push(noteId);
        }
      }

      return foundNotes;
    },
    xyToBeatPitch(x, y) {
      const notesFromTop = y / this.pianoNoteHeight;
      const notesFromA = this.octaveEnd * 12 - notesFromTop + 2;
      // Add 50 cents to make the center of the piano key the center of the note
      const pitch = notesFromA * 100 + 50;
      const beat = this.start + (x / this.canvasWidth) * this.beatCount;
      return [beat, pitch];
    },
    xToBeat(x) {
      return this.start + (x / this.canvasWidth) * this.beatCount;
    },
    sizeCanvas() {
      const background = this.$refs.background;
      const notes = this.$refs.notes;

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
    },
    pan() {
      console.log("pan");
    }
  },
  watch: {
    beatCursor(val) {
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
  padding: 0.4em;
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


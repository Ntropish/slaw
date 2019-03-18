<template>
  <div class="root" ondragstart="return false" :style="{cursor: cursor}" @mousedown="onMouseDown">
    <canvas ref="background" class="canvas background"/>
    <canvas ref="notes" class="canvas notes"/>
    <canvas ref="util" class="canvas util"/>
    {{ keysState }} {{ noteBuffer }} {{ ids }} {{ selectedNotes }}
  </div>
</template>

<script>
import Vue from "vue";
import { range } from "lodash";
import GridLand from "./GridLand";

const dark = "hsla(0, 0%, 0%, 0.09)";
const light = "hsla(0, 0%, 100%, 0.00)";
const lighter = "hsla(0, 0%, 100%, 0.04)";
const pianoNoteColors = [
  light,
  dark,
  light,
  light,
  dark,
  light,
  dark,
  lighter,
  light,
  dark,
  light,
  dark,
  light
];

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
    yStart: -2000,
    yEnd: 1000,
    canvasWidth: 300,
    canvasHeight: 150,
    selectedNotes: [],
    noteBuffer: {},
    hoveredNotes: [],
    cursor: "default",
    boxSelecting: false
  }),
  computed: {
    pianoNoteHeight() {
      return (this.canvasHeight / this.yCount) * 100;
    },
    canvases() {
      return [this.$refs.background, this.$refs.notes, this.$refs.util];
    },
    dragTool() {
      if (this.keysState.includes("r")) return "resize";
      return "move";
    },
    ids() {
      return Object.keys(this.events);
    }
  },
  watch: {
    beatCursor(val) {
      this.render();
    }
  },
  methods: {
    render() {
      // Prepare canvases
      this.contexts.forEach(ctx => {
        return ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
      });
      const [backgroundCtx, notesCtx, utilCtx] = this.contexts;

      // Draw piano keys, assume snap is 100, traditional keyboard layout
      const verticalStart = Math.floor(this.yStart / 100) * 100;
      const verticalEnd = Math.ceil(this.yEnd / 100) * 100;

      const verticalLines = range(verticalStart, verticalEnd, 100);
      backgroundCtx.fillStyle = `hsla(0, 0%, 0%, 0.2)`;

      for (const line of verticalLines) {
        let modCents = Math.floor(line % 1200);
        if (modCents < 0) modCents += 1200;
        const noteNumber = modCents / 100;
        backgroundCtx.fillStyle = pianoNoteColors[noteNumber];
        const y = this.pxOfY(line - 50);

        backgroundCtx.fillRect(0, y, this.canvasWidth, 100 * this.pxPerY);
        // backgroundCtx.stroke();
      }

      // Draw beat marks
      const lines = range(Math.floor(this.xStart), Math.ceil(this.xEnd));

      for (const line of lines) {
        const pxX = Math.round(this.pxOfX(line));

        if (pxX < 0 || line > this.xEnd) continue;

        backgroundCtx.strokeStyle =
          line % 4 === 0 ? `hsla(0, 0%, 0%, 0.4)` : `hsla(0, 0%, 0%, 0.2)`;

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(pxX, 0);
        backgroundCtx.lineTo(pxX, this.canvasHeight);
        backgroundCtx.stroke();
      }

      const bufferedIds = Object.keys(this.noteBuffer);

      // Draw notes
      this.track.events.forEach(eventId => {
        const note = this.events[eventId];
        // Detuned notes need some indication
        let hueMod =
          (note.pitch - Math.round(note.pitch / this.ySnap) * this.ySnap) / 2;
        if (hueMod) hueMod += hueMod > 0 ? 10 : -10;
        if (bufferedIds.includes(eventId)) {
          notesCtx.fillStyle = `hsla(${this.track.hue -
            hueMod}, 40%, 60%, 0.2)`;
        } else if (this.selectedNotes.includes(eventId)) {
          notesCtx.fillStyle = `hsla(${this.track.hue -
            hueMod}, 40%, 90%, 0.8)`;
        } else {
          notesCtx.fillStyle = `hsla(${this.track.hue -
            hueMod}, 30%, 60%, 0.7)`;
        }
        // notesCtx.fillRect
        notesCtx.fillRect(
          this.pxOfX(note.beat),
          this.pxOfY(note.pitch - 50),
          this.pxPerX * note.beats,
          this.pxPerY * 100
        );
      });

      (Object.values(this.noteBuffer) || []).forEach(note => {
        // Detuned notes need some indication
        let hueMod =
          (note.pitch - Math.round(note.pitch / this.ySnap) * this.ySnap) / 2;
        if (hueMod) hueMod += hueMod > 0 ? 10 : -10;
        if (this.selectedNotes.includes(note.id)) {
          notesCtx.fillStyle = `hsla(${this.track.hue -
            hueMod}, 40%, 90%, 0.8)`;
        } else {
          notesCtx.fillStyle = `hsla(${this.track.hue -
            hueMod}, 30%, 60%, 0.7)`;
        }
        // notesCtx.fillRect
        notesCtx.fillRect(
          this.pxOfX(note.beat),
          this.pxOfY(note.pitch - 50),
          this.pxPerX * note.beats,
          this.pxPerY * 100
        );
      });

      if (this.boxSelecting) {
        utilCtx.strokeStyle = `hsla(0, 0%, 100%, 0.4)`;
        // Draw box selector
        utilCtx.strokeRect(
          this.dragStart.x,
          this.dragStart.y,
          this.dragEnd.x - this.dragStart.x,
          this.dragEnd.y - this.dragStart.y
        );
      }

      // const cursorX = this.pxOfX(this.beatCursor);
      // utilCtx.strokeStyle = `hsla(0, 0%, 100%, 0.4)`;
      // utilCtx.beginPath();
      // utilCtx.moveTo(cursorX, 0);
      // utilCtx.lineTo(cursorX, this.canvasHeight);
      // utilCtx.stroke();
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
    mouseDown({ offsetX: x, offsetY: y }) {
      const noteClicked = this.scanForNotes(x, y)[0];
      const { selectedNotes } = this;

      // Handle selection first
      if (noteClicked && !this.selectedNotes.includes(noteClicked)) {
        if (!this.keysState.includes("Control")) selectedNotes.splice(0);
        selectedNotes.push(noteClicked);
      }

      if (this.keysState.includes("Shift")) {
        if (!noteClicked) {
          // Trigger box select
          if (!this.keysState.includes("Control")) selectedNotes.splice(0);
          this.boxSelectStart();
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
          const [unsnappedBeat, unsnappedPitch] = this.pxToXY(x, y);
          const pitch =
            Math.round(unsnappedPitch / this.pitchSnap) * this.pitchSnap;
          const beat =
            Math.round(unsnappedBeat / this.beatSnap) * this.beatSnap;

          this.$emit("noteadd", { beat, pitch, trackId: this.track.id });
        } else {
          // Else just move the cursor to the clicked location
          // Snapping can't be disabled on click because ctrl click
          // is already for adding notes
          const beatClicked = this.pxOfX(x);
          const beat = Math.round(beatClicked / this.beatSnap) * this.beatSnap;
          this.$emit("cursorset", {
            beat
          });
        }
      }

      if (this.keysState.includes("Alt") && selectedNotes.length) {
        this.$emit("noteremove", {
          notes: selectedNotes,
          trackId: this.track.id
        });
      }

      this.bufferNotes();
    },
    mouseUp(e) {
      const note = this.scanForNotes(e.offsetX, e.offsetY)[0];
      eventMoveBufferX = 0;
      eventMoveBufferY = 0;
      if (this.boxSelecting) {
        this.boxSelectFinish(e);
      }
      this.unbufferNotes();
    },
    mouseMove({ x, y, e }) {
      const notes = this.scanForNotes(x, y);
      this.hoveredNotes = notes;
      const note = notes && notes[0];

      // if (!note && !this.mouseState.length && this.dragTool === "move") {
      //   this.updateCursor();
      //   return;
      // }

      if (this.boxSelecting) {
        this.boxSelectUpdate(e);
      } else if (this.mouseState.includes(0) && this.selectedNotes.length) {
        // Hold control to move without snap
        const snap = !this.keysState.includes("Control");

        const xDelta = (this.dragEnd.x - this.dragStart.x) / this.pxPerX;
        const yDelta = (this.dragEnd.y - this.dragStart.y) / this.pxPerY;

        const xMove = snap
          ? Math.round(xDelta / this.xSnap) * this.xSnap
          : xDelta;
        const yMove = snap
          ? Math.round(yDelta / this.ySnap) * this.ySnap
          : yDelta;
        if (this.dragTool === "move") {
          this.moveToolUpdate(xMove, yMove);
        } else if (this.dragTool === "resize") {
          this.resizeTool(xMove, yMove);
        }
      } else if (this.mouseIsDown) {
        this.$emit("cursorset", {
          beat: x
        });
      }
    },
    bufferNotes(e) {
      Vue.set(this, "noteBuffer", {});
      this.selectedNotes.forEach(noteId => {
        this.noteBuffer[noteId] = { ...this.events[noteId] };
      });
    },
    unbufferNotes(e) {
      this.$emit("noteset", this.noteBuffer);
      Vue.set(this, "noteBuffer", {});
    },
    moveToolUpdate(xMove, yMove) {
      Object.values(this.noteBuffer).forEach(note => {
        note.beat = this.events[note.id].beat + xMove;
        note.pitch = this.events[note.id].pitch + yMove;
      });
    },
    resizeTool(xMove, yMove) {
      Object.values(this.noteBuffer).forEach(note => {
        note.beats = this.events[note.id].beats + xMove;
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
    boxSelectStart() {
      console.log("start");

      this.bufferNotes();
      this.boxSelecting = true;
    },
    boxSelectFinish(e) {
      console.log("done");
      this.boxSelectUpdate(e);
      Object.values(this.noteBuffer).forEach(note => {
        if (!this.selectedNotes.includes(note.id)) {
          this.selectedNotes.push(note.id);
        }
      });
      this.unbufferNotes();
      this.boxSelecting = false;
    },
    boxSelectUpdate(e) {
      this.boxSelectEnd = { x: e.offsetX, y: e.offsetY };

      const notes = this.scanBoxForNotes(
        Math.min(this.dragStart.x, this.dragEnd.x),
        Math.min(this.dragStart.y, this.dragEnd.y),
        Math.max(this.dragStart.x, this.dragEnd.x),
        Math.max(this.dragStart.y, this.dragEnd.y)
      );

      this.selectedNotes.splice(0);
      this.selectedNotes.push(...notes);

      this.render();
    },
    scanBoxForNotes(x1, y1, x2, y2) {
      let [beat1, pitch1] = this.pxToXY(x1, y1);
      let [beat2, pitch2] = this.pxToXY(x2, y2);

      const foundNotes = [];
      for (const noteId of this.track.events) {
        const note = this.events[noteId];
        const a = note.pitch + 50 > pitch1;
        const b = note.pitch - 50 < pitch2;
        const c = note.beat + note.beats > beat1;
        const d = note.beat < beat2;
        if (a && b && c && d) {
          foundNotes.push(noteId);
        }
      }

      return foundNotes;
    },
    scanForNotes(x, y) {
      let [beat, pitch] = this.pxToXY(x, y);

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
    pan(data) {
      this.$emit("pan", data);
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


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
    {{ hoveredNotes}}
  </div>
</template>

<script>
import { range } from "lodash";

const dark = "hsla(0, 0%, 0%, 0.05)";
const light = "hsla(0, 0%, 100%, 0.05)";
const lighter = "hsla(0, 0%, 100%, 0.1)";
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
  props: {
    start: {
      type: Number,
      required: true
    },
    end: {
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
    }
  },
  data: () => ({
    octaveStart: -2,
    octaveEnd: 2,
    canvasWidth: 300,
    canvasHeight: 150,
    selectedNotes: [],
    temporarySelectedNotes: [],
    boxSelectStart: null,
    boxSelectEnd: null,
    mouseIsDown: false,
    keysPressed: [],
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
    beatCount() {
      return this.end - this.start;
    },
    pxPerBeat() {
      return this.canvasWidth / this.beatCount;
    },
    middleCY() {
      // As in the y position of middle C
      return this.octaveEnd * this.octaveHeight;
    },
    canvases() {
      return [this.$refs.background, this.$refs.notes, this.$refs.util];
    },
    dragTool() {
      if (this.keysPressed.length === 1 && this.keysPressed[0] === "r")
        return "resize";
      return "move";
    }
  },
  mounted() {
    this.sizeCanvas();
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("resize", this.sizeCanvas);
    window.addEventListener("mouseup", this.onMouseUp);
    window.addEventListener("mousemove", this.onMouseMove);
    // Keys won't be cleared if user changes focus before releasing a key so we need this
    window.addEventListener("blur", this.clearKeysPressed);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("resize", this.sizeCanvas);
    window.removeEventListener("mouseup", this.onMouseUp);
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("blur", this.onMouseMove);
  },
  methods: {
    render() {
      // Prepare canvases
      const contexts = this.canvases.map(c => c.getContext("2d"));
      contexts.forEach(ctx =>
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      );
      const [backgroundCtx, notesCtx, utilCtx] = contexts;

      // Draw piano keys
      for (let pianoNote = 0; pianoNote < this.pianoNoteCount; pianoNote++) {
        backgroundCtx.fillStyle = pianoNoteColors[pianoNote % 12];
        backgroundCtx.fillRect(
          0,
          pianoNote * this.pianoNoteHeight,
          this.canvasWidth,
          this.pianoNoteHeight
        );
      }

      // Draw notes
      this.track.events.forEach(eventId => {
        const note = this.events[eventId];
        if (this.temporarySelectedNotes.includes(eventId)) {
          notesCtx.fillStyle = `hsla(${this.track.hue}, 40%, 80%, 1)`;
        } else if (this.isNoteSelected(eventId)) {
          notesCtx.fillStyle = `hsla(${this.track.hue}, 40%, 90%, 1)`;
        } else {
          notesCtx.fillStyle = `hsla(${this.track.hue}, 30%, 60%, 1)`;
        }
        notesCtx.fillRect(
          note.beat * this.pxPerBeat - this.start,
          this.middleCY - (note.pitch / 100 - 2) * this.pianoNoteHeight,
          this.pxPerBeat * note.beats,
          this.pianoNoteHeight
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
    },
    updateCursor() {
      const noteIsHovered = this.hoveredNotes.length !== 0;
      const keyOne = noteIsHovered ? "noteHovered" : "noteNotHovered";
      const keyTwo = this.mouseIsDown ? "cursorDown" : "cursor";
      this.cursor = tools[this.dragTool][keyOne][keyTwo];
    },
    onKeyDown(e) {
      if (!this.keysPressed.includes(e.key)) this.keysPressed.push(e.key);
      this.updateCursor();
    },
    onKeyUp(e) {
      const index = this.keysPressed.indexOf(e.key);
      if (index === -1) return;
      this.keysPressed.splice(index, 1);
      this.updateCursor();
    },
    clearKeysPressed(e) {
      this.keysPressed.splice(0);
    },
    onMouseDown(e) {
      this.mouseIsDown = true;

      const x = e.offsetX;
      const y = e.offsetY;

      const noteClicked = this.scanForNotes(x, y)[0];
      const { selectedNotes } = this;

      if (e.shiftKey) {
        if (!e.ctrlKey) selectedNotes.splice(0);
        return this.boxSelect(e);
      }

      if (!noteClicked) {
        selectedNotes.splice(0);
        if (e.ctrlKey) {
          const [beat, pitch] = this.xyToBeatPitch(x, y);
          this.$emit("noteadd", { beat, pitch, trackId: this.track.id });
        }
      }

      if (noteClicked && !this.isNoteSelected(noteClicked)) {
        if (!e.ctrlKey) selectedNotes.splice(0);
        selectedNotes.push(noteClicked);
        // this.cursor = tools[this.dragTool].cursorDown;
      } else if (noteClicked) {
        // this.cursor = tools[this.dragTool].cursorDown;
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
    onMouseUp(e) {
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
    onMouseMove(e) {
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
      }

      this.render();
      this.updateCursor();
    },
    moveTool(e) {
      eventMoveBufferX += e.movementX;
      eventMoveBufferY -= e.movementY;

      const beatsDrug = eventMoveBufferX / this.pxPerBeat;
      const centsDrug = (eventMoveBufferY / this.pianoNoteHeight) * 100;

      const beatsMoved = Math.floor(beatsDrug / 0.25);
      eventMoveBufferX -= beatsMoved * this.pxPerBeat * 0.25;

      const centsMoved = Math.floor(centsDrug / 100);
      eventMoveBufferY -= centsMoved * this.pianoNoteHeight;

      if (beatsMoved || centsMoved) {
        this.moveSelectedNotes(beatsMoved / 4, centsMoved * 100);
      }
    },
    resizeTool(e) {
      eventResizeBuffer += e.movementX;
      const beats = eventResizeBuffer / this.pxPerBeat;

      const beatsMoved = Math.floor(beats / 0.25);
      eventResizeBuffer -= beatsMoved * this.pxPerBeat * 0.25;
      this.$emit("noteresize", {
        notes: this.selectedNotes,
        beats: beatsMoved / 4
      });
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
    isNoteSelected(id) {
      return this.selectedNotes.includes(id);
    },
    xyToBeatPitch(x, y) {
      const notesFromTop = y / this.pianoNoteHeight;
      const notesFromA = this.octaveEnd * 12 - notesFromTop + 2;
      // Add 50 cents to make the center of the piano key the center of the note
      const pitch = notesFromA * 100 + 50;
      const beat = this.start + (x / this.canvasWidth) * this.beatCount;
      return [beat, pitch];
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


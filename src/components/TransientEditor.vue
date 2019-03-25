<template>
  <div class="root" ondragstart="return false" :style="{cursor: cursor}" @mousedown="onMouseDown">
    <canvas ref="background" class="canvas background"/>
    <canvas ref="notes" class="canvas notes"/>
    <canvas ref="util" class="canvas util"/>
    {{ mouseState }} {{ keyboardState }}
  </div>
</template>

<script>
import Vue from "vue";
import { range } from "lodash";
import GridLand from "modules/GridLand";
import { clamp } from "../util";
import { mapState, mapGetters } from "vuex";

const dark = 0;
const light = 1;
const lighter = 2;
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
    xSnap: {
      type: Number,
      default: () => 1 / 4
    },
    ySnap: {
      type: Number,
      default: () => 1
    }
  },
  data: () => ({
    yStart: 1000,
    yEnd: -4000,
    canvasWidth: 300,
    canvasHeight: 150,
    selectedNotes: [],
    noteBuffer: {},
    hoveredNotes: [],
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
      if (this.keyboardState.includes("a")) return "resize";
      return "move";
    },
    cursor() {
      const key2 = this.hoveredNotes.length ? "noteHovered" : "noteNotHovered";
      const key3 = this.mouseState.length ? "cursorDown" : "cursor";
      return tools[this.dragTool][key2][key3];
    },
    gradients() {
      const [backgroundCtx] = this.contexts;
      return [
        this.buildBeatMark(backgroundCtx, 0.02, 0, 0.4),
        this.buildBeatMark(backgroundCtx, 0.03, 100),
        this.buildBeatMark(backgroundCtx, 0.06, 100),
        this.buildBeatMark(backgroundCtx, 0.11, 100),
        this.buildBeatMark(backgroundCtx, 0.3, 100, 0.1)
      ];
    },
    events() {
      return this.$store.getters.eventsOfTrack(this.trackId);
    },
    ...mapState({
      trackId: "selectedTrackId",
      track: state => state.tracks[state.selectedTrackId]
    }),
    ...mapState([
      "playbackStart",
      "mouseState",
      "keyboardState",
      "beatSnap",
      "centsSnap"
    ]),
    ...mapState({
      _transporter: "transporter",
      transporter() {
        if (!this._transporter) this.$store.dispatch("makeTransporter");

        return this._transporter;
      }
    })
  },
  watch: {
    beatCursor(val) {
      this.render();
    },
    dragTool(val) {
      // start a new transform start/end when changing tools
      this.redrag();
    },
    transporter(newTransporter, oldTransporter) {
      if (oldTransporter)
        oldTransporter.off("positionUpdate", this.setPlaybackStart);
      if (newTransporter)
        newTransporter.on("positionUpdate", this.setPlaybackStart);
    },
    playbackStart(val) {
      this.render();
    },
    events(val) {
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
      const verticalStart =
        Math.ceil(this.yStart / this.centsSnap) * this.centsSnap;
      const verticalEnd =
        Math.floor(this.yEnd / this.centsSnap) * this.centsSnap - 50;

      const verticalLines = range(verticalStart, verticalEnd, -100);
      backgroundCtx.fillStyle = `hsla(0, 0%, 0%, 0.2)`;

      for (const line of verticalLines) {
        let modCents = Math.floor(line % 1200);
        if (modCents < 0) modCents += 1200;
        const noteNumber = modCents / 100;
        backgroundCtx.fillStyle = this.gradients[pianoNoteColors[noteNumber]];
        const y = this.pxOfY(line - 50);

        backgroundCtx.fillRect(0, y, this.canvasWidth, 100 * this.pxPerY);
      }

      // Draw beat marks
      const lines = range(Math.floor(this.xStart), Math.ceil(this.xEnd));

      for (const line of lines) {
        const pxX = Math.round(this.pxOfX(line));

        if (pxX < 0 || line > this.xEnd) continue;

        backgroundCtx.strokeStyle =
          line % 4 === 0
            ? this.gradients[3]
            : line % 2 === 0
            ? this.gradients[2]
            : this.gradients[1];

        backgroundCtx.beginPath();
        backgroundCtx.moveTo(pxX, 0);
        backgroundCtx.lineTo(pxX, this.canvasHeight);
        backgroundCtx.stroke();
      }

      const bufferedIds = Object.keys(this.noteBuffer);

      // Draw notes
      this.events.forEach(note => {
        // Detuned notes need some indication so shift their hue
        let hueMod =
          (note.pitch - Math.round(note.pitch / this.ySnap) * this.ySnap) / 2;
        if (hueMod) hueMod += hueMod > 0 ? 10 : -10;
        if (bufferedIds.includes(note.id)) {
          notesCtx.fillStyle = `hsla(${this.track.hue -
            hueMod}, 40%, 60%, 0.15)`;
        } else if (this.selectedNotes.includes(note.id)) {
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

      const cursorX = Math.round(this.pxOfX(this.playbackStart));
      utilCtx.strokeStyle = this.gradients[4];
      utilCtx.beginPath();
      utilCtx.moveTo(cursorX, 0);
      utilCtx.lineTo(cursorX, this.canvasHeight);
      utilCtx.stroke();
    },
    setPlaybackStart(beat) {
      this.$store.commit("SET_PLAYBACK_START", beat);
    },
    buildBeatMark(ctx, opacity, lightness, spread = 0.0) {
      var gradient = ctx.createLinearGradient(0, 0, 0, this.canvasHeight);
      gradient.addColorStop("0", "hsla(0, 0%, 0%, 0)");
      gradient.addColorStop(spread, `hsla(0, 0%, ${lightness}%, ${opacity})`);
      gradient.addColorStop(
        1 - spread,
        `hsla(0, 0%, ${lightness}%, ${opacity})`
      );
      gradient.addColorStop("1.0", "hsla(0, 0%, 0%, 0)");
      return gradient;
    },
    keyDown(e) {
      if (this.keyboardState.includes("q")) this.quantize();
    },
    mouseDown({ offsetX: x, offsetY: y }) {
      const noteClicked = this.scanForNotes(x, y)[0];
      const { selectedNotes } = this;

      // Handle selection first
      if (noteClicked && !this.selectedNotes.includes(noteClicked)) {
        if (!this.keyboardState.includes("Control")) selectedNotes.splice(0);
        selectedNotes.push(noteClicked);
      }

      if (this.keyboardState.includes("shift")) {
        if (!noteClicked) {
          // Trigger box select
          if (!this.keyboardState.includes("control")) selectedNotes.splice(0);
          this.boxSelectStart();
        } else {
          // Trigger note copy
          this.$store.commit("COPY_EVENTS", {
            eventIds: selectedNotes,
            trackId: this.trackId
          });
        }
      }

      if (!noteClicked) {
        const [unsnappedBeat, unsnappedPitch] = this.pxToXY(x, y);
        const pitch = Math.round(unsnappedPitch / this.ySnap) * this.ySnap;
        const beat = Math.round(unsnappedBeat / this.xSnap) * this.xSnap;
        selectedNotes.splice(0);
        // Ctrl click to add note
        if (this.keyboardState.includes("control")) {
          this.$emit("noteadd", { beat, pitch, trackId: this.track.id });
        } else if (
          this.mouseState.includes(0) &&
          !this.keyboardState.includes("shift")
        ) {
          // Else just move the cursor to the clicked location
          // Snapping can't be disabled on click because ctrl click
          // is already for adding notes
          this.transporter.jump(beat);
          this.transporter.pause();
        }
      }

      if (this.keyboardState.includes("alt") && selectedNotes.length) {
        selectedNotes.forEach(note => {
          if (this.noteBuffer[note.id]) {
            Vue.delete(this.noteBuffer, note.id);
          }
        });
        this.$emit("noteremove", {
          notes: selectedNotes,
          trackId: this.track.id
        });
      }

      this.bufferNotes();
    },
    // global mouseup called by gridland mixin
    mouseUp(e) {
      if (this.boxSelecting) {
        this.boxSelectFinish(e);
      }
      this.unbufferNotes();
    },
    mouseMove({ e }) {
      const notes = this.scanForNotes(e.offsetX, e.offsetY);
      this.hoveredNotes = notes;
      const note = notes && notes[0];

      if (this.boxSelecting) {
        this.boxSelectUpdate(e);
      } else if (this.mouseState.includes(0) && this.selectedNotes.length) {
        // Hold control to move without snap
        const snap = !this.keyboardState.includes("Control");

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
      } else if (this.mouseState.includes(0)) {
        const x = this.pxToX(e.offsetX);
        const beat = !this.keyboardState.includes("Control")
          ? Math.round(x / this.xSnap) * this.xSnap
          : x;
        this.transporter.jump(beat);
      }
    },

    // Note buffer sets aside notes into a bucket to operate on
    // This leaves the originals unchanged until ready to apply
    bufferNotes(e) {
      Vue.set(this, "noteBuffer", {});
      this.selectedNotes.forEach(noteId => {
        this.noteBuffer[noteId] = { ...this.events[noteId] };
      });
    },
    unbufferNotes(e) {
      // this.$emit("noteset", this.noteBuffer);
      Object.values(this.noteBuffer).forEach(note =>
        this.$store.commit("SET_EVENT", note)
      );

      Vue.set(this, "noteBuffer", {});
    },
    // When switching between tools the last transform needs to
    // be applied and a new one created based on a new drag
    redrag() {
      this.unbufferNotes();
      this.bufferNotes();
      if (this.dragStart) {
        this.dragStart = this.dragEnd;
        this.dragStart = this.dragEnd;
      }
    },
    moveToolUpdate(xMove, yMove) {
      Object.values(this.noteBuffer).forEach(note => {
        // if (!this.events[note.id]) return
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
      this.unbufferNotes();
      this.$store.commit("QUANTIZE_EVENTS", { eventIds: this.selectedNotes });
      this.render();
    },
    onMouseLeave(e) {
      this.onMouseUp(e);
    },
    boxSelectStart() {
      this.bufferNotes();
      this.boxSelecting = true;
    },
    boxSelectFinish(e) {
      this.boxSelecting = false;
      this.boxSelectUpdate(e);
      Object.values(this.noteBuffer).forEach(note => {
        if (!this.selectedNotes.includes(note.id)) {
          this.selectedNotes.push(note.id);
        }
      });
      this.unbufferNotes();
    },
    boxSelectUpdate(e) {
      if (!this.boxSelecting) return;
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
      let [beat, pitch] = this.pxToXY(x, y);

      const foundNotes = [];
      for (const note of this.events) {
        if (
          Math.abs(note.pitch - pitch) < 50 &&
          note.beat < beat &&
          beat < note.beat + note.beats
        ) {
          foundNotes.push(note.id);
        }
      }

      return foundNotes;
    },
    pan(data) {
      if (data.y > 0 && this.yStart > 1200 * 8) return;
      if (data.y < 0 && this.yEnd < -1200 * 8) return;
      this.yStart += data.y;
      this.yEnd += data.y;
      this.$emit("pan", data);
      this.render();
    },
    zoom2d(data) {
      const height = this.yStart - this.yEnd;
      const newHeight = clamp(1200, height + data.y, 7 * 1200);
      const deltaY = newHeight - height;
      this.yStart += deltaY / 2;
      this.yEnd -= deltaY / 2;

      this.$emit("zoom", data);
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


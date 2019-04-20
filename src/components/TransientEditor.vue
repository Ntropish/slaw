<template>
  <div class="root" ondragstart="return false" :style="{cursor: cursor}" @mousedown="onMouseDown">
    <canvas-graph
      ref="canvases"
      :layers="['events']"
      :x-start="viewStart"
      :x-end="viewEnd"
      :y-start="yStart"
      :y-end="yEnd"
      @render="render"
      @pan="pan"
      @mousemove="mouseMove"
      @zoom2d="zoom2d"
      @zoom="zoom"
    />
  </div>
</template>

<script>
import Vue from "vue";
import { range } from "lodash";
import GridLand from "modules/GridLand";
import { clamp } from "../util";
import { mapState, mapGetters } from "vuex";
import CanvasGraph from "components/CanvasGraph.vue";

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
  components: { CanvasGraph },
  props: {
    xSnap: {
      type: Number,
      default: () => 1 / 4
    },
    ySnap: {
      type: Number,
      default: () => 1
    },
    trackId: {
      type: String,
      required: true
    }
  },
  data: () => ({
    yStart: 1200,
    yEnd: -2400,
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
    c() {
      return this.$refs.canvases;
    },
    canvases() {
      return this.$refs.canvases.canvases;
    },
    contexts() {
      return this.$refs.canvases.contexts;
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
      const [ctx] = this.contexts;
      return [
        this.buildBeatMark(ctx, 0.02, 0, 0.4),
        this.buildBeatMark(ctx, 0.03, 100),
        this.buildBeatMark(ctx, 0.06, 100),
        this.buildBeatMark(ctx, 0.11, 100),
        this.buildBeatMark(ctx, 0.3, 100, 0.1)
      ];
    },
    events() {
      return this.$store.getters.eventsOfTrack(this.trackId);
    },
    track() {
      return this.$store.state.tracks[this.trackId];
    },
    ...mapState([
      "playbackPosition",
      "playbackStart",
      "mouseState",
      "keyboardState",
      "beatSnap",
      "centsSnap",
      "viewStart",
      "viewEnd"
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
    playbackPosition(val) {
      this.render();
    },
    playbackStart(val) {
      this.render();
    },
    events(val) {
      this.render();
    }
  },
  mounted() {
    window.addEventListener("mouseup", this.mouseUp);
  },
  beforeDestroy() {
    window.removeEventListener("mouseup", this.mouseUp);
  },
  methods: {
    render() {
      // Prepare canvases
      this.contexts.forEach(ctx => {
        return ctx.clearRect(0, 0, this.c.canvasWidth, this.c.canvasHeight);
      });
      const [ctx] = this.contexts;

      // Draw piano keys, assume snap is 100, traditional keyboard layout
      const verticalStart =
        Math.ceil(this.yStart / this.centsSnap) * this.centsSnap;
      const verticalEnd =
        Math.floor(this.yEnd / this.centsSnap) * this.centsSnap - 50;

      const verticalLines = range(verticalStart, verticalEnd, -100);
      ctx.fillStyle = `hsla(0, 0%, 0%, 0.2)`;

      for (const line of verticalLines) {
        let modCents = Math.floor(line % 1200);
        if (modCents < 0) modCents += 1200;
        const noteNumber = modCents / 100;
        ctx.fillStyle = this.gradients[pianoNoteColors[noteNumber]];
        const y = this.c.pxOfY(line - 50);

        ctx.fillRect(0, y, this.c.canvasWidth, 100 * this.c.pxPerY);
      }

      // Draw beat marks
      const lines = range(Math.floor(this.viewStart), Math.ceil(this.viewEnd));

      for (const line of lines) {
        const pxX = Math.round(this.c.pxOfX(line));

        if (pxX < 0 || line > this.viewEnd) continue;

        ctx.strokeStyle =
          line % 4 === 0
            ? this.gradients[3]
            : line % 2 === 0
            ? this.gradients[2]
            : this.gradients[1];

        ctx.beginPath();
        ctx.moveTo(pxX, 0);
        ctx.lineTo(pxX, this.c.canvasHeight);
        ctx.stroke();
      }

      const bufferedIds = Object.keys(this.noteBuffer);

      // Draw notes
      Object.values(this.events).forEach(note => {
        // Detuned notes need some indication so shift their hue
        let hueMod =
          (note.data.pitch -
            Math.round(note.data.pitch / this.ySnap) * this.ySnap) /
          2;
        if (hueMod) hueMod += hueMod > 0 ? 10 : -10;
        if (bufferedIds.includes(note.id)) {
          ctx.fillStyle = `hsla(${this.track.hue - hueMod}, 40%, 60%, 0.15)`;
        } else if (this.selectedNotes.includes(note.id)) {
          ctx.fillStyle = `hsla(${this.track.hue - hueMod}, 40%, 90%, 0.8)`;
        } else {
          ctx.fillStyle = `hsla(${this.track.hue - hueMod}, 30%, 60%, 0.7)`;
        }
        ctx.fillRect(
          this.c.pxOfX(note.beat),
          this.c.pxOfY(note.data.pitch - 50),
          this.c.pxPerX * note.beats,
          this.c.pxPerY * 100
        );
      });

      (Object.values(this.noteBuffer) || []).forEach(note => {
        // Detuned notes need some indication
        let hueMod =
          (note.data.pitch -
            Math.round(note.data.pitch / this.ySnap) * this.ySnap) /
          2;
        if (hueMod) hueMod += hueMod > 0 ? 10 : -10;
        if (this.selectedNotes.includes(note.id)) {
          ctx.fillStyle = `hsla(${this.track.hue - hueMod}, 40%, 90%, 0.8)`;
        } else {
          ctx.fillStyle = `hsla(${this.track.hue - hueMod}, 30%, 60%, 0.7)`;
        }
        ctx.fillRect(
          this.c.pxOfX(note.beat),
          this.c.pxOfY(note.data.pitch - 50),
          this.c.pxPerX * note.beats,
          this.c.pxPerY * 100
        );
      });

      if (this.boxSelecting) {
        ctx.strokeStyle = `hsla(0, 0%, 100%, 0.4)`;
        // Draw box selector
        ctx.strokeRect(
          this.c.dragStart.x,
          this.c.dragStart.y,
          this.c.dragEnd.x - this.c.dragStart.x,
          this.c.dragEnd.y - this.c.dragStart.y
        );
      }

      const cursorX = Math.round(this.c.pxOfX(this.playbackPosition));
      ctx.strokeStyle = this.gradients[4];
      ctx.beginPath();
      ctx.moveTo(cursorX, 0);
      ctx.lineTo(cursorX, this.c.canvasHeight);
      ctx.stroke();
    },
    buildBeatMark(ctx, opacity, lightness, spread = 0.15) {
      var gradient = ctx.createLinearGradient(0, 0, 0, this.c.canvasHeight);
      gradient.addColorStop("0", `hsla(0, 0%, ${lightness}%, ${opacity / 10})`);
      gradient.addColorStop(spread, `hsla(0, 0%, ${lightness}%, ${opacity})`);
      gradient.addColorStop(
        1 - spread,
        `hsla(0, 0%, ${lightness}%, ${opacity})`
      );
      gradient.addColorStop(
        "1.0",
        `hsla(0, 0%, ${lightness}%, ${opacity / 10})`
      );
      return gradient;
    },
    keyDown(e) {
      if (this.keyboardState.includes("q")) this.quantize();
    },
    onMouseDown({ offsetX: x, offsetY: y }) {
      const noteClicked = this.scanForNotes(x, y)[0];
      const { selectedNotes } = this;

      // Handle selection first
      if (noteClicked && !this.selectedNotes.includes(noteClicked)) {
        if (!this.keyboardState.includes("control")) selectedNotes.splice(0);
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
            eventIds: selectedNotes
          });
        }
      }

      if (!noteClicked) {
        const [unsnappedBeat, unsnappedPitch] = this.c.pxToXY(x, y);
        const pitch = Math.round(unsnappedPitch / this.ySnap) * this.ySnap;
        const beat = Math.round(unsnappedBeat / this.xSnap) * this.xSnap;
        selectedNotes.splice(0);
        // Ctrl click to add note
        if (
          this.mouseState.includes(0) &&
          this.keyboardState.includes("control")
        ) {
          this.$store.dispatch("addEvent", {
            type: "note",
            beat,
            beats: 0.25,
            data: { pitch, velocity: 0.8 },
            trackId: this.track.id
          });
        } else if (
          this.mouseState.includes(2) &&
          !this.keyboardState.includes("shift")
        ) {
          // Else, with right click, just move the cursor to the clicked location
          this.$store.commit("SET_PLAYBACK_START", beat);
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
        this.$store.dispatch("removeEvents", selectedNotes);
      }

      this.bufferNotes();
      this.render();
    },

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
        const snap = !this.keyboardState.includes("control");

        const xDelta = (this.c.dragEnd.x - this.c.dragStart.x) / this.c.pxPerX;
        const yDelta = (this.c.dragEnd.y - this.c.dragStart.y) / this.c.pxPerY;

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
      } else if (this.mouseState.includes(2)) {
        const x = this.c.pxToX(e.offsetX);
        const beat = !this.keyboardState.includes("control")
          ? Math.round(x / this.xSnap) * this.xSnap
          : x;
        this.transporter.jump(beat);
      }
    },

    // Note buffer sets aside notes into a bucket to operate on
    // This leaves the originals unchanged until ready to apply
    bufferNotes(e) {
      const buffer = {};
      this.selectedNotes.forEach(noteId => {
        // This keeps us from trying to buffer a note that no longer exists
        if (!Object.keys(this.$store.state.events).includes(noteId)) return;
        // Manual deep copy so original isn't affected
        buffer[noteId] = {
          ...this.events[noteId],
          data: { ...this.events[noteId].data }
        };
      });
      Vue.set(this, "noteBuffer", buffer);
    },
    unbufferNotes(e) {
      // this.$emit("noteset", this.noteBuffer);
      Object.values(this.noteBuffer).forEach(note => {
        return this.$store.commit("SET_EVENT", note);
      });

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
        note.data.pitch = this.events[note.id].data.pitch + yMove;
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
        Math.min(this.c.dragStart.x, this.c.dragEnd.x),
        Math.min(this.c.dragStart.y, this.c.dragEnd.y),
        Math.max(this.c.dragStart.x, this.c.dragEnd.x),
        Math.max(this.c.dragStart.y, this.c.dragEnd.y)
      );

      this.selectedNotes.splice(0);
      this.selectedNotes.push(...notes);

      this.render();
    },
    scanBoxForNotes(x1, y1, x2, y2) {
      let [beat1, pitch1] = this.c.pxToXY(x1, y1);
      let [beat2, pitch2] = this.c.pxToXY(x2, y2);

      const foundNotes = [];
      for (const noteId of this.track.events) {
        const note = this.events[noteId];
        const a = note.data.pitch - 50 < pitch1;
        const b = note.data.pitch + 50 > pitch2;
        const c = note.beat + note.beats > beat1;
        const d = note.beat < beat2;
        if (a && b && c && d) {
          foundNotes.push(noteId);
        }
      }

      return foundNotes;
    },
    scanForNotes(x, y) {
      let [beat, pitch] = this.c.pxToXY(x, y);

      const foundNotes = [];
      for (const note of Object.values(this.events)) {
        if (
          Math.abs(note.data.pitch - pitch) < 50 &&
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
      // this.$emit("pan", data);
      this.$store.commit("PAN_TRACK_VIEW", { deltaX: data.x });
      this.render();
    },
    async zoom({ x, y, xOrigin, yOrigin }) {
      const height = this.yStart - this.yEnd;
      const newHeight = clamp(1200, height + height * y, 7 * 1200);
      const deltaY = newHeight - height;
      this.yStart += deltaY * yOrigin;
      this.yEnd -= deltaY * (1 - yOrigin);

      await this.$store.commit("ZOOM_TRACK_VIEW", { x, xOrigin });
      this.render();
    },
    zoom2d({ y, x, xOrigin, yOrigin }) {
      const height = this.yStart - this.yEnd;
      const newHeight = clamp(1200, height + y, 7 * 1200);
      const deltaY = newHeight - height;
      this.yStart += deltaY * yOrigin;
      this.yEnd -= deltaY * (1 - yOrigin);

      this.$store.commit("ZOOM_TRACK_VIEW", { x: x / 10, xOrigin });
      this.render();
    }
  }
};
</script>

<style scoped>
.root {
  overflow: hidden;
  position: relative;
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


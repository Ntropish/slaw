<template>
  <div class="app" :class="mode" :style="appGridStyle" @keydown="onKeyDown">
    <menu-panel class="menu-panel app-item"/>
    <transport-bar class="transport-bar app-item"/>
    <transient-editor
      ref="transientEditor"
      class="midi-editor app-item"
      :x-start="viewStart"
      :x-end="viewEnd"
      :track="tracks[0]"
      :events="events"
      :x-snap="beatSnap"
      :y-snap="pitchSnap"
      :beat-cursor="playbackLocation"
      :transporter="transporter"
      @noteset="onNoteSet"
      @noteadd="onAddNote"
      @noteremove="onRemoveNote"
      @noteresize="onResizeNote"
      @notequantize="onQuantizeNote"
      @notecopy="onCopyNote"
      @pan="onMidiEditorPan"
      @zoom="onZoom"
      @playbackstartset="onPlaybackStartSet"
    />
    <node-editor
      ref="nodeEditor"
      class="node-editor app-item"
      :nodes="nodes"
      :edges="edges"
      :tracks="tracks"
      :events="events"
      :transporter="transporter"
    />
  </div>
</template>

<script>
import Vue from "vue";
import TransportBar from "components/TransportBar.vue";
import TransientEditor from "components/TransientEditor.vue";
import MenuPanel from "components/MenuPanel.vue";
import NodeEditor from "components/NodeEditor.vue";
import Transporter from "modules/Transporter.js";
import { clearTimeout } from "timers";
import { clamp } from "./util";

const graph = {
  nodes: {
    "0": {
      id: "0",
      type: "track",
      data: {
        track: "0"
      },
      position: {
        x: 100,
        y: 100
      },
      inputs: [],
      outputs: ["MIDI"]
    },
    "1": {
      id: "1",
      type: "worklet",
      data: {
        track: "0"
      },
      position: {
        x: 300,
        y: 130
      },
      inputs: ["MIDI"],
      outputs: []
    }
  },
  edges: {
    "0": {
      from: {
        node: "0",
        output: "0"
      },
      to: {
        node: "1",
        output: "0"
      }
    }
  }
};
export default {
  components: {
    TransportBar,
    TransientEditor,
    MenuPanel,
    NodeEditor
  },
  data: () => {
    const playbackLocation = 0;
    return {
      trackCount: 1,
      eventCount: 4,
      nodeCount: 2,
      tracks: {
        "0": {
          id: "0",
          name: "Track 1",
          events: ["0", "1", "2", "3"],
          hue: 90
        }
      },
      events: {
        "0": {
          id: "0",
          pitch: -2500,
          beat: 0,
          velocity: 0.8,
          beats: 0.25
        },
        "1": {
          id: "1",
          pitch: -2600,
          beat: 1,
          velocity: 0.3,
          beats: 0.25
        },
        "2": {
          id: "2",
          pitch: -2520,
          beat: 1.5,
          velocity: 0.8,
          beats: 0.25
        },
        "3": {
          id: "3",
          pitch: -2600,
          beat: 3,
          velocity: 0.6,
          beats: 1
        }
      },
      nodes: {},
      edges: {},
      viewStart: 0,
      viewEnd: 16,
      beatSnap: 1 / 4,
      pitchSnap: 100,
      playbackLocation,
      playbackStart: playbackLocation,
      bpm: 80,
      lastPlaybackUpdate: Date.now(),
      iisPlaying: false,
      mode: "split",
      split: 0.3,
      context: null,
      transporter: null,
      timeouts: new Array(50),
      lastStoredTimeout: 0
    };
  },

  computed: {
    appGridStyle() {
      // For split mode
      return this.mode === "split"
        ? {
            gridTemplateColumns: `15em auto`,
            gridTemplateRows: `6em ${this.split}fr ${1 - this.split}fr`
          }
        : {};
    }
  },
  watch: {
    mode(val) {
      requestAnimationFrame(() => {
        this.$refs.transientEditor.sizeCanvases();
        this.$refs.nodeEditor.sizeCanvases();
      });
    }
  },
  mounted() {
    window.addEventListener("keydown", this.buildTransporter, { once: true });
    window.addEventListener("mousedown", this.buildTransporter, { once: true });
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("contextmenu", this.disableContextMenu);
    this.loadGraph(graph);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("contextmenu", this.disableContextMenu);
  },
  methods: {
    buildTransporter(e) {
      const context = new AudioContext();
      const transporter = new Transporter(context, this.playbackLocation);
      this.transporter = transporter;
      this.transporter.on("positionUpdate", this.scheduleCursor);
      this.transporter.on("clear", this.clearCursorSchedule);
    },
    disableContextMenu(e) {
      e.preventDefault();
      return false;
    },
    loadGraph(graph) {
      for (const node of Object.values(graph.nodes)) {
        Vue.set(this.nodes, node.id, node);
      }
    },
    onKeyDown(e) {
      if (e.key === " ") this.transporter.pause();
      if (e.key === "s") this.transporter.pause();
      else if (e.key === "Tab") {
        if (this.mode === "split") this.mode = "midi";
        else if (this.mode === "midi") this.mode = "node";
        else if (this.mode === "node") this.mode = "split";
      }
    },
    onKeyUp(e) {
      if (e.key === " ") {
        this.transporter.jump(this.playbackStart);
        this.transporter.play();
      }
    },
    scheduleCursor(beat) {
      this.playbackLocation = beat;
    },
    clearCursorSchedule() {
      requestAnimationFrame(() => {
        for (let timeout of this.timeouts) {
          window.clearTimeout(timeout);
        }
      });
    },
    onNoteSet(noteBuffer) {
      for (const note of Object.values(noteBuffer)) {
        if (!this.events[note.id]) return;
        this.events[note.id].beat = note.beat;
        this.events[note.id].pitch = note.pitch;
        this.events[note.id].beats = note.beats;
      }
    },
    onAddNote({ beat, pitch, trackId }) {
      const id = (this.eventCount++).toString();
      this.events[id] = {
        id,
        pitch,
        beat,
        velocity: 0.8,
        beats: 1
      };
      this.tracks[trackId].events.push(id);
    },
    onRemoveNote({ notes, trackId }) {
      const trackEvents = this.tracks[trackId].events;
      for (const note of notes) {
        const noteIndex = trackEvents.indexOf(note);
        trackEvents.splice(noteIndex, 1);
        delete this.events[note];
      }
    },
    onResizeNote({ notes, beats }) {
      for (const note of notes) {
        this.events[note].beats = Math.max(
          this.events[note].beats + beats,
          1 / 32
        );
      }
    },
    onQuantizeNote({ notes }) {
      for (const id of notes) {
        const note = this.events[id];
        note.beat = Math.round(note.beat / this.beatSnap) * this.beatSnap;
        note.beats = Math.round(note.beats / this.beatSnap) * this.beatSnap;
      }
    },
    onCopyNote({ notes, trackId }) {
      for (const id of notes) {
        const newNoteId = (this.eventCount++).toString();
        const copyFrom = this.events[id];
        this.events[newNoteId] = {
          ...copyFrom,
          id: newNoteId
        };
        this.tracks[trackId].events.push(newNoteId);
      }
    },
    onPlaybackStartSet(beat) {
      this.playbackStart = beat;
    },
    onMidiEditorPan({ x }) {
      this.viewStart += x;
      this.viewEnd += x;
    },
    onZoom({ x }) {
      const width = this.viewEnd - this.viewStart;
      const newWidth = clamp(4, x + width, 160);
      const deltaX = width - newWidth;
      this.viewStart += deltaX / 2;
      this.viewEnd -= deltaX / 2;
    }
  }
};
</script>

<style scoped>
@font-face {
  font-family: "VarelaRound";
  src: url("/VarelaRound/VarelaRound-Regular.ttf") format("woff2");
}

.app {
  height: 100%;
  display: grid;

  font-family: VarelaRound;
}

.app.node {
  grid-template-columns: 15em auto;
  grid-template-rows: 6em auto;
}
.app.midi {
  grid-template-columns: 15em auto;
  grid-template-rows: 6em auto;
}

.app.node > .midi-editor {
  display: none;
}
.app.split > .midi-editor {
  grid-row-end: 3;
}
.midi-editor {
  grid-column-start: 1;
  grid-row-start: 2;
  grid-column-end: 3;
}

.transport-bar {
  grid-column-start: 2;
  grid-row-start: 1;
}

.menu-panel {
  grid-column-start: 1;
  grid-row-start: 1;
}
.app.node > .node-editor {
  grid-column-start: 1;
  grid-row-start: 2;
  grid-column-end: 3;
}
.app.split > .node-editor {
  grid-column-start: 1;
  grid-row-start: 3;
  grid-column-end: 3;
}
.app.midi > .node-editor {
  display: none;
}

.app-item {
  background: hsla(0, 0%, 7%, 1);
  color: hsla(0, 0%, 80%, 0.8);
  /* background: hsla(180, 5%, 40%, 1); */
  /* border: 1px solid hsla(180, 5%, 30%, 1); */
  min-width: 0;
  min-height: 0;
}
</style>

<style>
html,
body {
  height: 100%;
  width: 100%;
  margin: 0;
}
</style>

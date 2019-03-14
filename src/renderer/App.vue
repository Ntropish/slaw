<template>
  <div class="app" :class="mode" :style="appGridStyle" @keydown="onKeyDown">
    <menu-panel class="menu-panel app-item"/>
    <transport-bar class="transport-bar app-item"/>
    <track-list class="track-list app-item"/>
    <transient-editor
      class="midi-editor app-item"
      :start="viewStart"
      :end="viewEnd"
      :track="tracks[0]"
      :events="events"
      :beat-snap="beatSnap"
      :pitch-snap="pitchSnap"
      :beat-cursor="playbackLocation"
      @notemove="onNoteMove"
      @noteadd="onAddNote"
      @noteremove="onRemoveNote"
      @noteresize="onResizeNote"
      @notequantize="onQuantizeNote"
      @notecopy="onCopyNote"
      @cursorset="onCursorSet"
    />
    <node-editor class="node-editor"/>
  </div>
</template>

<script>
import TransportBar from "renderer/TransportBar.vue";
import TransientEditor from "renderer/TransientEditor.vue";
import TrackList from "renderer/TrackList.vue";
import MenuPanel from "renderer/MenuPanel.vue";
import NodeEditor from "renderer/NodeEditor.vue";
export default {
  components: {
    TransportBar,
    TransientEditor,
    TrackList,
    MenuPanel,
    NodeEditor
  },
  data: () => ({
    trackCount: 1,
    eventCount: 4,
    tracks: {
      "0": {
        id: "0",
        name: "Track 1",
        events: ["0", "1", "2", "3"],
        hue: 30
      }
    },
    events: {
      "0": {
        id: "0",
        pitch: -1300,
        beat: 0,
        velocity: 0.8,
        beats: 1
      },
      "1": {
        id: "1",
        pitch: -1400,
        beat: 1,
        velocity: 0.6,
        beats: 0.95
      },
      "2": {
        id: "2",
        pitch: -1310,
        beat: 2,
        velocity: 0.8,
        beats: 1.02
      },
      "3": {
        id: "3",
        pitch: -1400,
        beat: 3,
        velocity: 0.6,
        beats: 1
      }
    },
    viewStart: 0,
    viewEnd: 16,
    beatSnap: 1 / 4,
    pitchSnap: 100,
    playbackLocation: 1.3,
    playbackStart: 1.3,
    bpm: 80,
    lastPlaybackUpdate: Date.now(),
    iisPlaying: false,
    mode: "midi",
    split: 0.5
  }),
  mounted() {
    window.addEventListener("keydown", this.onKeyDown);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKeyDown);
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
    },
    isPlaying: {
      get() {
        console.log(this.appGridStyle);
        return this.iisPlaying;
      },
      set(isPlaying) {
        if (isPlaying !== this.iisPlaying) {
          this.iisPlaying = isPlaying;
          this.lastPlaybackUpdate = Date.now();
          if (isPlaying) this.updatePlayback();
        }
      }
    }
  },
  methods: {
    onKeyDown(e) {
      if (e.key === " ") this.isPlaying = !this.isPlaying;
      else if (e.key === "Tab") {
        if (this.mode === "split") this.mode = "midi";
        else if (this.mode === "midi") this.mode = "node";
        else if (this.mode === "node") this.mode = "split";
      }
    },
    updatePlayback() {
      const now = Date.now();
      const timeProgressed = now - this.lastPlaybackUpdate;
      const beatsProgressed = (timeProgressed / 60000) * this.bpm;
      this.playbackLocation += beatsProgressed;
      this.lastPlaybackUpdate = now;
      requestAnimationFrame(() => {
        if (this.iisPlaying) {
          this.updatePlayback();
        }
      });
    },
    onNoteMove({ notes, beats, cents }) {
      for (const note of notes) {
        this.events[note].beat = Math.max(0, this.events[note].beat + beats);
        this.events[note].pitch += cents;
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
          id
        };
        this.tracks[trackId].events.push(newNoteId);
      }
    },
    onCursorSet({ beat }) {
      this.playbackLocation = beat;
      this.playbackStart = beat;
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
.app.split {
}
.app.midi {
  grid-template-columns: 15em auto;
  grid-template-rows: 6em auto;
}

.app.split {
}

.app.node {
}

.app.node > .midi-editor {
  display: none;
}
.app.split > .midi-editor {
  grid-column-end: 3;
  grid-row-end: 3;
}
.app.midi > .midi-editor {
}
.midi-editor {
  grid-column-start: 2;
  grid-row-start: 2;
}

.app.node > .transport-bar {
}
.app.split > .transport-bar {
}
.app.midi > .transport-bar {
}
.transport-bar {
  grid-column-start: 2;
  grid-row-start: 1;
}

.app.node > .menu-panel {
}
.app.split > .menu-panel {
}
.app.midi > .menu-panel {
}
.menu-panel {
  grid-column-start: 1;
  grid-row-start: 1;
}

.app.node > .track-list {
  display: none;
}
.app.split > .track-list {
  grid-column-end: 2;
  grid-row-end: 3;
}
.app.midi > .track-list {
}
.track-list {
  grid-column-start: 1;
  grid-row-start: 2;
}

.app.node > .node-editor {
  grid-column-start: 1;
  grid-row-start: 2;
}
.app.split > .node-editor {
  grid-column-start: 1;
  grid-row-start: 3;
  grid-column-end: 3;
}
.app.midi > .node-editor {
  display: none;
}
.node-editor {
}

.app-item {
  background: hsla(0, 0%, 20%, 1);
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

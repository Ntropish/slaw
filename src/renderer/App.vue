<template>
  <div class="app">
    <menu-panel class="menu-panel app-item"/>
    <transport-bar class="transport-bar app-item"/>
    <track-list class="track-list app-item"/>
    <transient-editor
      class="midi-editor app-item"
      :start="viewStart"
      :end="viewEnd"
      :tracks="tracks"
      :events="events"
      @notemove="onNoteMove"
    />
  </div>
</template>

<script>
import TransportBar from "renderer/TransportBar.vue";
import TransientEditor from "renderer/TransientEditor.vue";
import TrackList from "renderer/TrackList.vue";
import MenuPanel from "renderer/MenuPanel.vue";
export default {
  components: {
    TransportBar,
    TransientEditor,
    TrackList,
    MenuPanel
  },
  data: () => ({
    tracks: [
      {
        id: 0,
        name: "Track 1",
        events: ["0", "1", "2", "3"],
        hue: 120
      }
    ],
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
    viewEnd: 16
  }),
  methods: {
    onNoteMove({ notes, beats, cents }) {
      for (const note of notes) {
        this.events[note].beat += beats;
        this.events[note].pitch += cents;
      }
    }
  }
};
</script>

<style scoped>
.app {
  height: 100%;
  display: grid;
  grid-template-columns: 15em auto;
  grid-template-rows: 6em auto;
}

.midi-editor {
  grid-column-start: 2;
  grid-row-start: 2;
}

.transport-bar {
  grid-column-start: 2;
  grid-row-start: 1;
}

.menu-panel {
  grid-column-start: 1;
  grid-row-start: 1;
}

.track-list {
  grid-column-start: 1;
  grid-row-start: 2;
}

.app-item {
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

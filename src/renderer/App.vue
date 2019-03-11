<template>
  <div class="app">
    <menu-panel class="menu-panel app-item"/>
    <transport-bar class="transport-bar app-item"/>
    <track-list class="track-list app-item"/>
    <transient-editor
      :start="this.viewStart"
      :end="this.viewEnd"
      :tracks="this.tracks"
      class="midi-editor app-item"
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
        events: [
          {
            pitch: -1300,
            beat: 0,
            velocity: 0.8,
            beats: 1
          },
          {
            pitch: -1400,
            beat: 1,
            velocity: 0.6,
            beats: 0.95
          },
          {
            pitch: -1300,
            beat: 2,
            velocity: 0.8,
            beats: 1.02
          },
          {
            pitch: -1400,
            beat: 3,
            velocity: 0.6,
            beats: 1
          }
        ],
        hue: 120
      }
    ],
    viewStart: 0,
    viewEnd: 16
  })
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

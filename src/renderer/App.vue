<template>
  <div class="app">
    <transient-editor class="midi-editor app-item"/>
    <transport-bar class="transport-bar app-item"/>
    <track-list class="track-list app-item"/>
    <menu-panel class="menu-panel app-item"/>
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
        events: []
      }
    ]
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
  background: hsla(180, 5%, 40%, 1);
  border: 1px solid hsla(180, 5%, 30%, 1);
  color: white;
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

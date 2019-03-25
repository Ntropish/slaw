<template>
  <div class="app" :class="mode" :style="appGridStyle" @keydown="onKeyDown">
    <menu-panel class="menu-panel app-item"/>
    <transport-bar class="transport-bar app-item"/>
    <transient-editor
      ref="transientEditor"
      class="midi-editor app-item"
      :x-start="viewStart"
      :x-end="viewEnd"
      @noteadd="onAddNote"
      @noteremove="onRemoveNote"
      @noteresize="onResizeNote"
      @pan="onMidiEditorPan"
      @zoom="onZoom"
    />
    <node-editor ref="nodeEditor" class="node-editor app-item"/>
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
import { mapState } from "vuex";

const graph = {};
export default {
  components: {
    TransportBar,
    TransientEditor,
    MenuPanel,
    NodeEditor
  },
  data: () => {
    return {
      viewStart: 0,
      viewEnd: 16,
      mode: "split",
      split: 0.25
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
    },
    ...mapState(["transporter", "playbackStart"])
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
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("contextmenu", this.disableContextMenu);
  },
  beforeDestroy() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("contextmenu", this.disableContextMenu);
  },
  methods: {
    disableContextMenu(e) {
      e.preventDefault();
      return false;
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
  background: hsla(0, 0%, 7%, 1);
}
</style>

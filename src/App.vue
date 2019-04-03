<template>
  <div class="app" :class="mode" :style="appGridStyle" @keydown="onKeyDown">
    <menu-panel/>
    <transport-bar class="transport-bar app-item"/>
    <node-editor ref="nodeEditor" class="node-editor app-item"/>

    <transient-editor
      ref="transientEditor"
      class="midi-editor app-item"
      :x-start="viewStart"
      :x-end="viewEnd"
      @noteremove="onRemoveNote"
      @noteresize="onResizeNote"
      @zoom="onZoom"
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
import { mapState } from "vuex";

// The app houses the major components and lays them
// out with css grid
export default {
  components: {
    TransportBar,
    TransientEditor,
    NodeEditor,
    MenuPanel
  },
  data: () => {
    return {
      viewStart: -1,
      viewEnd: 2,
      mode: "split",
      split: 0.25
    };
  },

  computed: {
    appGridStyle() {
      // Defines css grid lines dynamically so user
      // can eventually change layout of app.
      return this.mode === "split"
        ? {
            gridTemplateColumns: `1`,
            gridTemplateRows: `6em ${this.split}fr ${1 - this.split}fr`
          }
        : {};
    },
    ...mapState(["transporter", "playbackStart"])
  },
  watch: {
    mode(val) {
      requestAnimationFrame(() => {
        this.$refs.transientEditor.c.sizeCanvases();
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
  display: flex;
  flex-direction: column;
  font-family: VarelaRound;
}

.app.node > .midi-editor {
  display: none;
}
.midi-editor {
  flex: 1 1 0;
}

.transport-bar {
  flex: 0 0 30px;
}

.menu-panel {
  flex: 0 0 30px;
}
.app.midi > .node-editor {
  display: none;
}
.node-editor {
  flex: 2 1 0;
}

.app-item {
  /* background: hsla(0, 0%, 7%, 1); */

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

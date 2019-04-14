<template>
  <div class="app" :class="mode" :style="appGridStyle" @keydown="onKeyDown">
    <menu-panel/>
    <transport-bar class="transport-bar app-item"/>
    <node-editor ref="nodeEditor" class="node-editor app-item"/>
    <div class="interfaces" :style="displayBlocksStyle">
      <component
        :is="block.interface"
        v-for="block in displayBlocks"
        :key="block.node.id"
        :brain="block.brain"
      />
    </div>
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
import nodeMap from "nodes";

// The app houses the major components and lays them
// out with css grid
export default {
  components: {
    TransportBar,
    NodeEditor,
    MenuPanel
  },
  data: () => {
    return {
      viewStart: -1,
      viewEnd: 2,
      mode: "split",
      displayBlockHeight: 200
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
    displayBlocks() {
      return this.selectedNodes.map(nodeId => {
        const node = this.nodes[nodeId];
        return {
          node,
          brain: this.brains[node.brain],
          interface: nodeMap[node.type].interface
        };
      });
    },
    displayBlocksStyle() {
      return {
        height: this.displayBlockHeight + "px"
      };
    },
    ...mapState([
      "transporter",
      "playbackStart",
      "selectedNodes",
      "nodes",
      "brains"
    ])
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

.interfaces {
  display: flex;
  color: hsla(0, 0%, 100%, 0.9);
}
.interfaces > div {
  flex: 1 1 0;
}

.app-item {
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
  background: hsla(0, 0%, 10%, 1);
}

/* Below is for tooltips */
.tooltip {
  display: block !important;
  z-index: 10000;
}

.tooltip .tooltip-inner {
  background: black;
  color: white;
  border-radius: 16px;
  padding: 5px 10px 4px;
}

.tooltip .tooltip-arrow {
  width: 0;
  height: 0;
  border-style: solid;
  position: absolute;
  margin: 5px;
  border-color: black;
  z-index: 1;
}

.tooltip[x-placement^="top"] {
  margin-bottom: 5px;
}

.tooltip[x-placement^="top"] .tooltip-arrow {
  border-width: 5px 5px 0 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  bottom: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="bottom"] {
  margin-top: 5px;
}

.tooltip[x-placement^="bottom"] .tooltip-arrow {
  border-width: 0 5px 5px 5px;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
  border-top-color: transparent !important;
  top: -5px;
  left: calc(50% - 5px);
  margin-top: 0;
  margin-bottom: 0;
}

.tooltip[x-placement^="right"] {
  margin-left: 5px;
}

.tooltip[x-placement^="right"] .tooltip-arrow {
  border-width: 5px 5px 5px 0;
  border-left-color: transparent !important;
  border-top-color: transparent !important;
  border-bottom-color: transparent !important;
  left: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip[x-placement^="left"] {
  margin-right: 5px;
}

.tooltip[x-placement^="left"] .tooltip-arrow {
  border-width: 5px 0 5px 5px;
  border-top-color: transparent !important;
  border-right-color: transparent !important;
  border-bottom-color: transparent !important;
  right: -5px;
  top: calc(50% - 5px);
  margin-left: 0;
  margin-right: 0;
}

.tooltip.popover .popover-inner {
  background: #f9f9f9;
  color: black;
  padding: 24px;
  border-radius: 5px;
  box-shadow: 0 5px 30px rgba(black, 0.1);
}

.tooltip.popover .popover-arrow {
  border-color: #f9f9f9;
}

.tooltip[aria-hidden="true"] {
  visibility: hidden;
  opacity: 0;
  transition: opacity 0.15s, visibility 0.15s;
}

.tooltip[aria-hidden="false"] {
  visibility: visible;
  opacity: 1;
  transition: opacity 0.15s;
}
</style>

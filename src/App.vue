<template>
  <div class="app" :style="appGridStyle" @keydown="onKeyDown">
    <node-editor ref="nodeEditor" class="node-editor app-item"/>
    <div class="split-handle-container">
      <drag class="split-handle-buffer" @drag="splitHandleDrag" @down="splitHandleDown">
        <div class="split-handle">
          <font-awesome-icon class="handle-icon" icon="bars"/>
        </div>
      </drag>
    </div>
    <div v-if="isSplitOpen" class="interfaces app-item" :style="displayBlocksStyle">
      <component
        :is="block.interface"
        v-for="block in displayBlocks"
        :key="block.node.id"
        :brain="block.brain"
        class="interface"
      />
    </div>
    <transport-bar class="transport-bar app-item"/>
    <menu-panel/>
  </div>
</template>

<script>
import Vue from "vue";
import TransportBar from "components/TransportBar.vue";
import TransientEditor from "components/TransientEditor.vue";
import MenuPanel from "components/MenuPanel.vue";
import NodeEditor from "components/NodeEditor.vue";
import Drag from "components/Drag.vue";
import Transporter from "modules/Transporter.js";
import { clearTimeout, setInterval } from "timers";
import { clamp } from "./util";
import { mapState } from "vuex";
import nodeMap from "nodes";

// The app houses the major components and lays them
// out with css grid
export default {
  components: {
    TransportBar,
    NodeEditor,
    MenuPanel,
    Drag
  },
  data: () => {
    return {
      viewStart: -1,
      viewEnd: 2,
      isSplitOpen: true
    };
  },

  computed: {
    appGridStyle() {
      // Defines css grid lines dynamically so user
      // can eventually change layout of app.
      return this.isSplitOpen
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
        flex: "0 0 " + this.panelShelfHeight + "vh"
      };
    },
    ...mapState([
      "transporter",
      "playbackStart",
      "selectedNodes",
      "nodes",
      "brains",
      "panelShelfHeight"
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
        this.isSplitOpen = !this.isSplitOpen;
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
    },
    async splitHandleDrag(e) {
      await this.$store.commit(
        "SET_PANEL_SHELF_HEIGHT",
        (1 - (e.clientY + 30) / window.innerHeight) * 100
      );
      // This change will require layout recalculation. Many
      // components rely on the window resize event for that so I'm going
      // to try putting these wherever they happen
      document.dispatchEvent(new CustomEvent("resize"));
    },
    splitHandleDown(e) {
      if (!this.isSplitOpen) {
        this.$store.commit("SET_PANEL_SHELF_HEIGHT", 0);
        this.isSplitOpen = true;
      }
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

.transport-bar {
  flex: 0 0 30px;
}

.node-editor {
  flex: 2 1 0;
}

.interfaces {
  display: flex;
  color: var(--primary-text);
  flex-direction: column;
}

.split-handle-container {
  position: relative;
}

.split-handle-buffer {
  position: absolute;
  left: calc(50% - 2em);
  top: -1.5em;
  width: 4em;
  height: 3em;
  display: flex;
  justify-content: center;
  align-items: center;
}

.split-handle {
  padding: 0.2em 1em;
  position: absolute;
  z-index: 99;
  display: flex;
  justify-content: center;
  align-items: center;
  background: var(--tintish);
}

.handle-icon {
  transform: rotate(90deg);
  color: var(--tint);
}

/* 
This is important, fixes layout issues with canvas resizing
 */
.interface {
  min-width: 0;
  min-height: 0;
}
.interfaces > div {
  flex: 1 1 0;
}
.interfaces {
  border-top: var(--tint);
  border-top-width: 1px;
  border-top-style: solid;
}

.app-item {
  color: var(--primary-text);
  min-width: 0;
  min-height: 0;
  overflow: hidden;
}
</style>

<style>
:root {
  --tintish: hsla(0, 0%, 100%, 0.04);
  --tint: hsla(0, 0%, 100%, 0.1);
  --tinter: hsla(0, 0%, 100%, 0.2);
  --shade: hsla(0, 0%, 0%, 0.1);
  --shader: hsla(0, 0%, 0%, 0.2);
  --tinted-background: hsl(0, 0%, 20%);
  --primary-background: hsl(0, 0%, 15%);
  --shaded-background: hsl(0, 0%, 10%);
  --primary-text: hsl(0, 0%, 85%);
}
.bright-icon-button {
  user-select: none;
  padding: 0.4em;
  border-radius: 2.5px;
  font-size: 2.5em;
  line-height: 0em;
  background: var(--tintish);
  color: var(--tint);
}
.bright-icon-button:hover {
  background: var(--tint);
  color: var(--primary-text);
}
.bright-button {
  user-select: none;
  background: var(--tintish);
}
.bright-button:hover {
  background: var(--tint);
}

@keyframes fadein {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
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

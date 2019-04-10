<template>
  <div class="node-editor" @wheel="onWheel">
    <pixi-graph
      ref="graph"
      class="root graph"
      :bounds="bounds"
      @resize="resize"
      @pointerdown="onPointerDown"
    />
    <Audio-node
      v-for="(node, id) in nodes"
      :key="id"
      class="node"
      :node="node"
      :style="computeNodeStyle(node)"
      :handle-spacing="handleSpacing"
      :px-per-unit="pxPerUnit"
      :selected="selectedNodes.includes(node.id)"
      @drag="dragNode"
      @handle-input-drag="handleInputDrag(node.id, $event.i)"
      @handle-output-drag="handleOutputDrag(node.id, $event.i)"
      @handle-input-drop="handleInputDrop(node.id, $event.i)"
      @handle-output-drop="handleOutputDrop(node.id, $event.i)"
    />
    <add-menu
      class="add-menu"
      :selected-node-type="selectedNodeType"
      @selected-node-type-change="selectNodeType"
    />
  </div>
</template>

<script>
import Vue from "vue";
import { range } from "lodash";
import GridLand from "modules/GridLand";
import AudioNode from "components/AudioNode.vue";
import AddMenu from "components/AddMenu.vue";
import SinFactory from "nodes/Sin";
import EventTrackFactory from "nodes/EventTrack";
import ADSRFactory from "nodes/ADSR";
import DestinationFactory from "nodes/Destination";
import { mapState } from "vuex";
import nodeMap from "nodes";
import PixiGraph from "./PixiGraph.vue";

const tools = {};
export default {
  components: { AudioNode, AddMenu, PixiGraph },
  props: {},
  data: () => ({
    gridSize: 25,
    nodeBuffer: [],
    temporaryEdges: [],
    temporaryEdgeGraphics: [],
    edgeGraphics: {},
    xSnap: 25,
    ySnap: 25,
    width: 1,
    height: 1,
    isDraggingHandle: false,
    handleSpace: 28,
    selectedNodeType: "track",
    backgroundGraphic: new window.PIXI.Graphics()
  }),

  computed: {
    bounds() {
      return [
        this.nodeX,
        this.nodeY,
        this.nodeX + this.nodeWidth,
        this.nodeY + this.nodeHeight
      ];
    },
    nodeHeight() {
      return (this.nodeWidth * this.height) / this.width;
    },
    handleSpacing() {
      return (
        this.handleSpace * (this.$refs.graph ? this.$refs.graph.pxPerY : 1)
      );
    },
    pxPerUnit() {
      return this.$refs.graph ? this.$refs.graph.pxPerY : 1;
    },
    isDraggingEditor() {
      return (
        this.mouseState.includes(0) &&
        this.$store.state.focus &&
        this.$store.state.focus.closest(".graph")
      );
    },
    ...mapState([
      "nodes",
      "selectedNodes",
      "edges",
      "tracks",
      "mouseState",
      "keyboardState",
      "mousePosition",
      "brains",
      "nodeX",
      "nodeY",
      "nodeWidth"
    ])
  },
  mounted() {
    this.render();
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("mouseup", this.handleRelease);
  },
  beforeDestroy() {
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("mouseup", this.handleRelease);
  },
  watch: {
    nodes: {
      handler() {
        this.update();
      },
      deep: true
    }
  },
  methods: {
    resize() {
      this.width = this.$refs.graph.width;
      this.height = this.$refs.graph.height;
    },
    onWheel(e) {
      const amount = (e.deltaY / 1000) * this.nodeWidth;
      const viewportBounds = this.$refs.graph.$refs.root.getBoundingClientRect();
      const xOrigin = (e.clientX - viewportBounds.left) / viewportBounds.width;
      const yOrigin = (e.clientY - viewportBounds.top) / viewportBounds.height;
      this.$store.commit("ZOOM_NODE_EDITOR", {
        amount,
        xOrigin,
        yOrigin,
        yRatio: viewportBounds.height / viewportBounds.width
      });
    },
    computeNodeStyle(node) {
      const maxPorts = Math.max(
        this.brains[node.brain].inputs.length,
        this.brains[node.brain].outputs.length
      );
      return {
        left: this.$refs.graph.pxOfX(node.x) + "px",
        top: this.$refs.graph.pxOfY(node.y) + "px",
        width: node.width * this.$refs.graph.pxPerX + "px",
        height: this.handleSpace * maxPorts * this.$refs.graph.pxPerY + "px"
      };
    },
    handleInputDrag(to, input) {
      this.isDraggingHandle = true;
      const ports = this.nodes[to].inputs.filter(edge => edge[0] === input);
      ports.forEach(([_input, from, output]) => {
        this.$store.dispatch("removeEdge", { from, to, input, output });
        this.temporaryEdges.push(["output", from, output]);
      });
      if (!ports.length) {
        this.temporaryEdges.push(["input", to, input]);
      }
    },
    // Dragging an output can only create a new edge
    handleOutputDrag(from, output) {
      this.isDraggingHandle = true;
      const ports = this.nodes[from].outputs.filter(edge => edge[0] === output);
      this.temporaryEdges.push(["output", from, output]);
    },
    handleInputDrop(to, input) {
      this.temporaryEdges.forEach(([type, from, output]) => {
        // Can't drag an input to an input so just abort
        if (type === "input") return;
        this.$store.dispatch("addEdge", { from, to, input, output });
      });
    },
    handleOutputDrop(from, output) {
      this.temporaryEdges.forEach(([type, to, input]) => {
        // Can't drag an output to an output so just abort
        if (type === "output") return;
        this.$store.dispatch("addEdge", { from, to, input, output });
      });
    },
    handleRelease() {
      this.temporaryEdges.splice(0);
      this.isDraggingHandle = false;
      this.update();
    },
    render() {
      const container = this.$refs.graph ? this.$refs.graph.container : null;
      if (!container) {
        return requestAnimationFrame(() => this.render());
      }
      container.removeChildren();

      const backgroundGraphic = this.backgroundGraphic;

      const lines = range(-5000, 5000, 100);
      backgroundGraphic.lineStyle(2, 0x222222, 1);

      for (const length of lines) {
        backgroundGraphic.moveTo(length, -5000);
        backgroundGraphic.lineTo(length, 5000);
        backgroundGraphic.moveTo(-5000, length);
        backgroundGraphic.lineTo(5000, length);
      }
      container.addChild(backgroundGraphic);
      this.update();
    },
    update() {
      const container = this.$refs.graph ? this.$refs.graph.container : null;
      if (!container) return;

      const touchedEdgeKeys = [];
      for (const node of Object.values(this.nodes)) {
        if (typeof node.outputs[Symbol.iterator] === "function") {
          node.outputs.forEach(([output, to, input]) => {
            const key = node.id + output + to + input;
            touchedEdgeKeys.push(key);
            let graphic = this.edgeGraphics[key];
            if (graphic) {
              this.edgeGraphics[key].clear();
            } else {
              graphic = new window.PIXI.Graphics();
              Vue.set(this.edgeGraphics, key, graphic);
              container.addChild(graphic);
            }
            this.drawEdgeGraphicFromPorts(graphic, [
              node.id,
              output,
              to,
              input
            ]);
          });
        }
      }

      for (const key of Object.keys(this.edgeGraphics)) {
        if (!touchedEdgeKeys.includes(key)) {
          container.removeChild(this.edgeGraphics[key]);
          Vue.delete(this.edgeGraphics, key);
        }
      }

      const touchedTempEdgeKeys = [];
      for (const [type, node, port] of this.temporaryEdges) {
        const key = type + node + port;
        touchedTempEdgeKeys.push(key);
        let graphic = this.temporaryEdgeGraphics[key];
        if (graphic) {
          graphic.clear();
        } else {
          graphic = new window.PIXI.Graphics();
          Vue.set(this.temporaryEdgeGraphics, key, graphic);
          container.addChild(this.temporaryEdgeGraphics[key]);
        }

        const portXy = this.xyOfPort(type, node, port);
        const mouseXy = this.xyOfMouse();

        if (type === "output") {
          this.drawEdgeGraphic(
            graphic,
            portXy.x,
            portXy.y,
            mouseXy.x,
            mouseXy.y
          );
        } else {
          this.drawEdgeGraphic(
            graphic,
            mouseXy.x,
            mouseXy.y,
            portXy.x,
            portXy.y
          );
        }
      }

      for (const key of Object.keys(this.temporaryEdgeGraphics)) {
        if (!touchedTempEdgeKeys.includes(key)) {
          container.removeChild(this.temporaryEdgeGraphics[key]);
          Vue.delete(this.temporaryEdgeGraphics, key);
        }
      }
    },
    drawEdgeGraphic(graphic, x1, y1, x2, y2) {
      graphic.lineStyle(2, 0x444444, 1);
      graphic.moveTo(x1, y1);
      graphic.lineTo(x2, y2);
      return graphic;
    },
    drawEdgeGraphicFromPorts(graphic, [from, output, to, input]) {
      const { x: fromX, y: fromY } = this.xyOfPort("output", from, output);
      const { x: toX, y: toY } = this.xyOfPort("input", to, input);
      return this.drawEdgeGraphic(graphic, fromX, fromY, toX, toY);
    },
    xyOfMouse() {
      return {
        x:
          this.bounds[0] +
          (this.mousePosition.x - this.$el.offsetLeft) /
            this.$refs.graph.pxPerX,
        y:
          this.bounds[1] +
          (this.mousePosition.y - this.$el.offsetTop) / this.$refs.graph.pxPerY
      };
    },
    xyOfPort(type, nodeId, index) {
      const node = this.nodes[nodeId];
      const inputCount = nodeMap[node.type].prototype.inputs.length;
      const outputCount = nodeMap[node.type].prototype.outputs.length;
      const maxPorts = Math.max(inputCount, outputCount);
      const headerSpace = this.handleSpace;
      const handleSpace = this.handleSpace;
      if (type === "output") {
        return {
          x: node.x + node.width,
          y: node.y + handleSpace * (index + 0.5)
        };
      } else {
        return {
          x: node.x,
          y: node.y + handleSpace * (index + 0.5)
        };
      }
    },
    // drawEdge(context, fromX, fromY, toX, toY) {
    //   const widthApart = toX - fromX;
    //   context.beginPath();
    //   context.moveTo(fromX, fromY);
    //   context.bezierCurveTo(
    //     fromX + widthApart / 2,
    //     fromY,
    //     toX - widthApart / 2,
    //     toY,
    //     toX,
    //     toY
    //   );
    //   context.stroke();
    // },
    onPointerDown(e) {
      console.log(e.target);
      if (this.keyboardState.includes("control")) {
        this.$store.dispatch("addNode", {
          type: this.selectedNodeType,
          x: this.$refs.graph.pxToX(e.offsetX),
          y: this.$refs.graph.pxToY(e.offsetY)
        });
      } else if (this.mouseState.includes(0)) {
        this.deselect();
      }
      this.render();
    },
    deselect() {
      this.$store.commit("SET_SELECTED_NODES", []);
    },
    mouseUp(e) {
      this.temporaryEdges = [];
    },
    dragNode(e) {
      this.$store.commit("PAN_NODES", {
        x: e.movementX / this.pxPerUnit,
        y: e.movementY / this.pxPerUnit,
        nodeIds: this.selectedNodes
      });
    },

    onPointerMove(e) {
      if (this.isDraggingEditor) {
        this.$store.commit("PAN_NODE_EDITOR", {
          x: e.movementX / this.$refs.graph.pxPerX,
          y: e.movementY / this.$refs.graph.pxPerY
        });
      }
      if (this.isDraggingHandle) {
        this.update();
      }
    },
    selectNodeType(nodeType) {
      this.selectedNodeType = nodeType;
    },
    bufferNodes() {},
    unbufferNodes() {}
  }
};
</script>

<style scoped>
.node-editor {
  position: relative;
  overflow: hidden;
}
.canvas {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}
.node {
  z-index: 10;
}
.add-menu {
  z-index: 11;
  position: absolute;
  right: 1em;
  top: 1em;
}
</style>


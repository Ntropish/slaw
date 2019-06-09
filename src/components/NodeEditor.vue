<template>
  <div class="node-editor" @wheel="onWheel">
    <Slaw-canvas ref="canvas" class="viewport" @resize="render"/>
    <add-menu class="add-menu" @drag-new-node="dragNewNode"/>
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
import SlawCanvas from "./SlawCanvas.vue";
import zdog from "zdog";
import { differ } from "../util";
const tools = {};
export default {
  components: { AddMenu, SlawCanvas },
  props: {},
  data: () => ({
    gridSize: 25,
    nodeBuffer: [],
    temporaryEdges: [],
    temporaryEdgeGraphics: [],
    edgeGraphics: {},
    xSnap: 25,
    ySnap: 25,
    isDraggingHandle: false,
    handleSpace: 28,
    selectedNodeType: "track",
    backgroundGraphic: new window.PIXI.Graphics(),
    illo: null,
    nodeDiff: differ.array([]),
    nodeGraphics: {}
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
      // Height of the node editor is calculated
      // with the canvas aspect ratio
      return (this.nodeWidth * this.height) / this.width;
    },
    handleSpacing() {
      // Handle space is dependent on scale so this is
      // to conveniently calculate it
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
        this.focus &&
        this.focus.closest(".graph")
      );
    },
    width: () => 10,
    height: () => 10,
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
      "nodeWidth",
      "focus"
    ])
  },
  watch: {
    nodes: {
      handler(newNodes) {
        this.update();
      },
      deep: true
    }
  },
  mounted() {
    window.addEventListener("pointermove", this.onPointerMove);
    window.addEventListener("mouseup", this.handleRelease);
    window.addEventListener("resize", this.renderNextTick);
    this.illo = new zdog.Illustration({
      element: ".viewport",
      onDragStart(e) {
        console.log(e);
      }
    });

    this.renderNextTick();
  },
  beforeDestroy() {
    window.removeEventListener("pointermove", this.onPointerMove);
    window.removeEventListener("mouseup", this.handleRelease);
  },

  methods: {
    renderNextTick() {
      setImmediate(
        (() => {
          this.illo.updateRenderGraph();
        }).bind(this)
      );
    },
    dragNewNode(type) {
      window.addEventListener(
        "mouseup",
        e => {
          if (e.target.closest(".node-editor>.graph")) {
            this.$store.dispatch("addNode", {
              type,
              x: this.bounds[0] + e.offsetX / this.$refs.graph.pxPerX,
              y: this.bounds[1] + e.offsetY / this.$refs.graph.pxPerY
            });
          }
        },
        { once: true }
      );
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
      if (!this.illo) return;
      this.illo.updateRenderGraph();
    },
    update() {
      const nodeKeys = Object.keys(this.nodes);
      console.log(nodeKeys);
      const { add, remove } = this.nodeDiff(nodeKeys);
      console.log(add, remove);

      for (const item of add) {
        console.log("add:", item);
        const node = this.nodes[item];
        const { x, y, width, height } = node;
        const rect = new zdog.Rect({
          addTo: this.illo,
          width,
          height,
          translate: { z: 10, x, y },
          fill: 10,
          color: "#636"
        });
        Vue.set(this.nodeGraphics, item, rect);
      }

      for (const item of remove) {
        console.log("remove:", item);
        const graphic = this.nodeGraphics[item];
        const index = this.illo.children.indexOf(graphic);
        this.illo.children.splice(index, 1);
        Vue.delete(this.nodeGraphics, item);
      }
      this.render();
    },
    drawEdgeGraphic(graphic, x1, y1, x2, y2) {
      graphic.lineStyle(4, 0x595959, 1);
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
      if (this.mouseState.includes(0)) {
        // this.deselect();
      }
      this.update();
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


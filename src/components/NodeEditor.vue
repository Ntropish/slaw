<template>
  <div class="node-editor" @mousedown="onMouseDown" @wheel="onWheel">
    <pixi-graph ref="graph" class="root node-graph" :bounds="bounds" @resize="resize"/>
    <Audio-node
      v-for="(node, id) in nodes"
      :key="id"
      class="node"
      :node="node"
      :style="computeNodeStyle(node)"
      :handle-spacing="handleSpace * $refs.graph ? $refs.graph.pxPerY : 1"
      :selected="selectedNodes.includes(node.id)"
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
    window.addEventListener("mousemove", this.onMouseMove);
  },
  beforeDestroy() {
    window.removeEventListener("mousemove", this.onMouseMove);
  },
  methods: {
    resize() {
      this.width = this.$refs.graph.width;
      this.height = this.$refs.graph.height;
    },
    onWheel(e) {
      const amount = e.deltaY / 10;
      const viewportBounds = this.$refs.graph.$root.$el.getBoundingClientRect();
      const xOrigin = e.clientX - viewportBounds.left;
      const yOrigin = e.clientY - viewportBounds.top;
      this.$store.commit("ZOOM_NODE_EDITOR", { amount, xOrigin, yOrigin });
    },
    computeNodeStyle(node) {
      const maxPorts = Math.max(
        this.brains[node.brain].inputs.length,
        this.brains[node.brain].outputs.length
      );

      return {
        // left: this.pxOfX(node.x) + "px",
        // top: this.pxOfY(node.y) + "px",
        // width: node.width * this.pxPerX + "px",
        // height: this.handleSpace * (1 + maxPorts) * this.pxPerY + "px"
      };
    },
    handleInputDrag(to, input) {
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
    render() {
      const container = this.$refs.graph ? this.$refs.graph.container : null;
      if (!container) {
        return requestAnimationFrame(() => this.render());
      }
      container.removeChildren();

      const backgroundGraphic = this.backgroundGraphic;

      const lines = range(-5000, 5000, 100);
      backgroundGraphic.lineStyle(1, 0x353535, 1);

      for (const length of lines) {
        backgroundGraphic.moveTo(length, -5000);
        backgroundGraphic.lineTo(length, 5000);
        backgroundGraphic.moveTo(-5000, length);
        backgroundGraphic.lineTo(5000, length);
      }

      container.addChild(backgroundGraphic);

      // graphic.moveTo(this.bounds[0], this.points[0].value);

      // for (let i = 1; i < this.points.length - 1; i++) {
      //   previousPoint = thisPoint;
      // }

      // let lastPoint = this.points[this.points.length - 1];
      // console.log(this.points);
      // this.drawSegment(
      //   previousPoint,
      //   { ...lastPoint, beat: this.bounds[2] },
      //   graphic
      // );
      // for (let i = 0; i < this.points.length; i++) {
      //   const thisPoint = this.points[i];
      //   const circle = new window.PIXI.Graphics();

      //   circle.beginFill(0x555555);
      //   circle.drawCircle(thisPoint.beat, thisPoint.value, 10);
      //   circle.endFill();

      //   circle.scale.set(this.$refs.graph.pxPerX, this.$refs.graph.pxPerY);
      //   this.container.addChild(circle);
      // }

      // this.container.addChild(graphic);
      // // Prepare canvases
      // this.contexts.forEach(ctx =>
      //   ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight)
      // );
      // const [backgroundCtx, nodesCtx, edgesCtx] = this.contexts;

      // // Draw beat marks
      // const horizontalStart =
      //   Math.floor(this.nodeX / this.gridSize) * this.gridSize;
      // const horizontalEnd =
      //   Math.ceil(this.nodeX + this.nodeWidth / this.gridSize) * this.gridSize;

      // const verticalStart =
      //   Math.floor(this.nodeY / this.gridSize) * this.gridSize;
      // const verticalEnd =
      //   Math.ceil(this.nodeY + this.nodeHeight / this.gridSize) * this.gridSize;

      // const horizontalLines = range(
      //   horizontalStart,
      //   horizontalEnd,
      //   this.gridSize
      // );
      // const verticallLines = range(verticalStart, verticalEnd, this.gridSize);
      // backgroundCtx.strokeStyle = `hsla(0, 0%, 0%, 0.2)`;

      // for (const line of horizontalLines) {
      //   const x = this.pxOfX(line);

      //   backgroundCtx.beginPath();
      //   backgroundCtx.moveTo(x, 0);
      //   backgroundCtx.lineTo(x, this.canvasHeight);
      //   backgroundCtx.stroke();
      // }

      // for (const line of verticallLines) {
      //   const y = this.pxOfY(line);

      //   backgroundCtx.beginPath();
      //   backgroundCtx.moveTo(0, y);
      //   backgroundCtx.lineTo(this.canvasWidth, y);
      //   backgroundCtx.stroke();
      // }

      // nodesCtx.strokeStyle = "hsla(0, 0%, 30%, 1)";
      // nodesCtx.lineWidth = "2";

      // Object.values(this.nodes).forEach(node => {
      //   node.outputs.forEach(([output, to, input]) => {
      //     const fromNode = node;
      //     const toNode = this.nodes[to];

      //     const inputLength = nodeMap[toNode.type].prototype.inputs.length;

      //     const { x: fromX, y: fromY } = this.xyOfPort(
      //       "output",
      //       fromNode.id,
      //       output
      //     );
      //     const { x: toX, y: toY } = this.xyOfPort("input", toNode.id, input);
      //     this.drawEdge(nodesCtx, fromX, fromY, toX, toY);
      //   });
      // });

      // // Render temporary edges, these exist when dragging an edge
      // for (const port of this.temporaryEdges) {
      //   const { x, y } = this.xyOfPort(...port);
      //   const { x: mouseX, y: mouseY } = this.xyOfMouse();
      //   if (port[0] === "output") {
      //     this.drawEdge(nodesCtx, x, y, mouseX, mouseY);
      //   } else {
      //     this.drawEdge(nodesCtx, mouseX, mouseY, x, y);
      //   }
      // }
    },
    xyOfMouse() {
      return {
        x: this.mousePosition.x - this.$el.offsetLeft,
        y: this.mousePosition.y - this.$el.offsetTop
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
          x: this.pxOfX(node.x + node.width),
          y: this.pxOfY(node.y + headerSpace + handleSpace * (index + 0.5))
        };
      } else {
        return {
          x: this.pxOfX(node.x),
          y: this.pxOfY(node.y + headerSpace + handleSpace * (index + 0.5))
        };
      }
    },
    drawEdge(context, fromX, fromY, toX, toY) {
      const widthApart = toX - fromX;
      context.beginPath();
      context.moveTo(fromX, fromY);
      context.bezierCurveTo(
        fromX + widthApart / 2,
        fromY,
        toX - widthApart / 2,
        toY,
        toX,
        toY
      );
      context.stroke();
    },
    onMouseDown(e) {
      if (this.keyboardState.includes("control")) {
        this.$store.dispatch("addNode", {
          type: this.selectedNodeType,
          x: this.pxToX(e.offsetX),
          y: this.pxToY(e.offsetY)
        });
      } else if (this.mouseState.includes(0)) {
        this.deselect();
      }
      this.render();
    },
    deselect() {
      this.$store.commit("SET_SELECTED_NODES", []);
    },
    pan(amounts) {
      this.$store.commit("PAN_NODE_EDITOR", amounts);
    },
    zoom({ x, y, xOrigin, yOrigin }) {
      this.$store.commit("ZOOM_NODE_EDITOR", { amount: x, xOrigin, yOrigin });
    },
    keyDown(e) {},

    mouseDown(e) {},
    mouseUp(e) {
      this.temporaryEdges = [];
    },
    mouseMove({ e }) {
      if (this.mouseState.includes(0) && this.temporaryEdges.length === 0) {
        this.$store.commit("PAN_NODES", {
          x: e.movementX / this.$refs.graph.pxPerX,
          y: e.movementY / this.$refs.graph.pxPerY,
          nodeIds: this.selectedNodes
        });
      }
    },
    onMouseMove(e) {
      if (
        this.mouseState.includes(0) &&
        this.$store.state.focus.closest(".node-graph")
      ) {
        this.$store.commit("PAN_NODE_EDITOR", {
          x: e.movementX * this.$refs.graph.pxPerX,
          y: e.movementY * this.$refs.graph.pxPerY
        });
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


<template>
  <div class="node-editor" @wheel="onWheel">
    {{dragPayload}}
    <drag
      ref="drag"
      class="dragDiv"
      handle="svg"
      @down="onViewportDown"
      @drag="onViewportDrag"
      @up="onViewportUp"
    >
      <Slaw-canvas ref="canvas" class="viewport" @resize="render"/>
    </drag>
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
import Drag from "components/Drag.vue";
import Victor from "victor";
import { differ, clamp } from "../util";

const tools = {};
const vector0 = new Victor(0, 0);
export default {
  components: { AddMenu, SlawCanvas, Drag },
  props: {},
  data() {
    return {
      gridSize: 25,
      nodeBuffer: [],
      xSnap: 25,
      ySnap: 25,
      isDraggingHandle: false,
      handleSpace: 28,
      selectedNodeType: "track",
      backgroundGraphic: new window.PIXI.Graphics(),
      illo: null,
      nodeDiff: differ.array([]),
      nodeGraphics: {},
      tilt: {
        vector: new Victor(0, 0),
        delay: 0,
        timer: null
      },
      tool: "default",
      tools: {
        "*": {
          up: e => {
            this.tool = "default";
            0;
          }
        },
        default: {
          down: e => {
            const node = this.getNodeForTarget(e.target);

            if (!e.ctrlKey && node) {
              this.$store.commit("SET_SELECTED_NODES", []);
            }
            if (node) {
              this.$store.commit("SELECT_NODE", node.id);
              this.tool = "move";
            } else {
              this.tool = "pan";
            }
          }
        },
        pan: {
          drag: e => {
            this.fillTilt({
              x: e.movementX,
              y: e.movementY
            });
            this.$store.commit("PAN_NODE_EDITOR", {
              x: e.movementX,
              y: e.movementY
            });
            this.update();
          }
        }
      }
    };
  },
  computed: {
    svg() {
      return this.$refs.canvas ? this.$refs.canvas.$el : null;
    },
    scale() {
      return this.nodeWidth / 200;
    },
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
    pxPerUnit() {
      return this.$refs.graph ? this.$refs.graph.pxPerY : 1;
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
      "focus",
      "dragPayload"
    ])
  },
  watch: {
    nodes: {
      handler(newNodes) {
        this.update();
      },
      deep: true
    },
    selectedNodes: {
      handler(newNodes) {
        this.update();
      },
      deep: true
    }
  },
  mounted() {
    document.addEventListener("resize", this.renderNextTick);

    // "duck punch" to avoid zdog bug ======================
    Zdog.Anchor.prototype.renderGraphSvg = function(svg) {
      if (!svg) {
        throw new Error(
          "svg is " +
            svg +
            ". " +
            "SVG required for render. Check .renderGraphSvg( svg )."
        );
      }
      this.flatGraph.forEach(function(item) {
        item.render(svg, Zdog.SvgRenderer);
      });
    };
    // ===================================================

    this.illo = new Zdog.Illustration({
      element: ".viewport"
    });

    document.addEventListener("resize", e => {
      this.illo.resizeListener(e);
      this.render();
    });

    this.renderNextTick();
  },
  beforeDestroy() {
    document.removeEventListener("pointermove", this.onPointerMove);
    document.removeEventListener("mouseup", this.handleRelease);
    document.removeEventListener("resize", this.illo.resizeListener);
  },
  methods: {
    onViewportDown(e) {
      if (this.tools[this.tool].down) {
        this.tools[this.tool].down(e);
      }
      if (this.tools["*"].down) {
        this.tools["*"].down(e);
      }
    },
    onViewportDrag(e) {
      // Simple way to only pan if dragging the svg itself
      if (this.tools[this.tool].drag) {
        this.tools[this.tool].drag(e);
      }
      if (this.tools["*"].drag) {
        this.tools["*"].drag(e);
      }
    },
    onViewportUp(e) {
      if (this.tools[this.tool].up) {
        this.tools[this.tool].up(e);
      }
      if (this.tools["*"].up) {
        this.tools["*"].up(e);
      }
    },
    fillTilt({ x, y }) {
      this.tilt.vector.add(new Victor(x / 20, y / 20));
      const length = this.tilt.vector.length();
      if (length > 7) {
        const excessRatio = length / 7;
        this.tilt.vector.divide(new Victor(excessRatio, excessRatio));
      }
      this.tilt.delay = 600;
      if (!this.tilt.timer) {
        this.emptyTilt();
      }
    },
    emptyTilt() {
      if (this.tilt.timer) {
        window.clearTimeout(this.tilt.timer);
      }
      const startTime = Date.now();
      this.tilt.timer = window.requestAnimationFrame(() => {
        const timeElapsed = Date.now() - startTime;
        const timeFactor = timeElapsed / 100;
        this.tilt.timer = null;

        this.tilt.delay = Math.max(0, this.tilt.delay - timeElapsed);
        const delayFactor = Math.max(0, 1 - (this.tilt.delay / 700) ** 2);

        this.tilt.vector.mix(vector0, 1 * timeFactor * delayFactor);

        // Slam down to 0 when numbers get close to make logic easy below
        if (Math.abs(this.tilt.vector.x) < 0.01) this.tilt.vector.x = 0;
        if (Math.abs(this.tilt.vector.y) < 0.01) this.tilt.vector.y = 0;

        // call this function again if there is still some left
        if (this.tilt.vector.x || this.tilt.vector.y) {
          this.emptyTilt();
        }
        this.update();
      });
    },
    getNodeForTarget(target) {
      for (const [key, value] of Object.entries(this.nodeGraphics)) {
        if (value.svgElement === target) return this.nodes[key];
      }
      return null;
    },
    onResize() {
      this.render();
    },
    renderNextTick() {
      setImmediate(
        (() => {
          this.illo.updateRenderGraph();
        }).bind(this)
      );
    },
    dragNewNode(type) {
      document.addEventListener(
        "mouseup",
        e => {
          if (e.target.closest(".node-editor .viewport")) {
            this.$store.dispatch("addNode", {
              type,
              x: this.bounds[0] + e.offsetX * this.illo.scale,
              y: this.bounds[1] + e.offsetY * this.illo.scale
            });
          }
        },
        { once: true }
      );
    },
    onWheel(e) {
      const amount = (e.deltaY / -50) * this.nodeWidth;
      const viewportBounds = this.$refs.canvas.$refs.svg.getBoundingClientRect();
      // Zdog centers things and it works out that these need to be multiplied by two.
      // This can probably be done better by changing the model here to match Zdog more
      const xOrigin =
        ((e.clientX - viewportBounds.left) / viewportBounds.width) * 2;
      const yOrigin =
        ((e.clientY - viewportBounds.top) / viewportBounds.height) * 2;
      this.$store.commit("ZOOM_NODE_EDITOR", {
        amount,
        xOrigin,
        yOrigin,
        yRatio: viewportBounds.height / viewportBounds.width
      });
      this.update();
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
    render() {
      if (!this.illo) return;
      this.illo.updateRenderGraph();
    },
    update() {
      const nodeKeys = Object.keys(this.nodes);
      // Gets additions and removals since last time
      const { add, remove } = this.nodeDiff(nodeKeys);

      this.illo.translate = {
        x: this.nodeX,
        y: this.nodeY
      };

      this.illo.scale = {
        x: this.scale,
        y: this.scale
      };

      // Fast path for when we know stuff below
      // isn't needed
      if (this.nodesWontChange) return;

      // On add...
      for (const item of add) {
        const node = this.nodes[item];
        this.brains[node.brain].addGraphics(this.illo);
      }

      // On remove...
      for (const item of remove) {
        const graphic = this.nodeGraphics[item];
        const index = this.illo.children.indexOf(graphic);
        this.illo.children.splice(index, 1);
        Vue.delete(this.nodeGraphics, item);
      }

      // On update (everything must update)...
      for (const item of nodeKeys) {
        const node = this.nodes[item];
        // Goes to 0 as scale zooms in so when people are looking close
        // up at the node editor the nodes don't twist around so much
        const swayNoMoreFactor = 1 - (this.scale - 2) / 6;

        const tiltPower = 0.15 * swayNoMoreFactor;
        let rotate = {
          x: 0,
          y: 0
        };
        if (this.tool === "move" && this.selectedNodes.includes(item)) {
          rotate = {
            x: this.tilt.vector.y * tiltPower,
            y: this.tilt.vector.x * tiltPower
          };
        } else if (this.tool === "pan") {
          rotate = {
            x: this.tilt.vector.y * tiltPower,
            y: this.tilt.vector.x * tiltPower
          };
        }

        this.brains[node.brain].updateGraphics(this.illo, rotate);
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

.dragDiv {
  width: 100%;
  height: 100%;
}
</style>


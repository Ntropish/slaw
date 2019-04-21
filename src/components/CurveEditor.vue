<template>
  <div>
    <pixi-graph
      ref="graph"
      class="root"
      :bounds="bounds"
      @pan="pan"
      @mousewheel.native="onMouseWheel"
      @mousedown.native="onMouseDown"
    />
  </div>
</template>

<script>
import PixiGraph from "./PixiGraph.vue";
import { mapState, mapGetters } from "vuex";
import { range, clamp } from "lodash";

export default {
  components: { PixiGraph },
  props: {
    curveId: {
      type: String,
      required: true
    }
  },
  data: () => ({
    graphics: [],
    pointHandles: [],
    curveHandles: [],
    dragging: false,
    draggingIndex: -1,
    curveDraggingIndex: -1,
    curveProgressX: 0,
    curveProgressY: 0
  }),
  computed: {
    curve() {
      return this.$store.state.curves[this.curveId];
    },
    bounds() {
      if (this.curve.global) {
        return [
          this.viewStart,
          this.curve.view[1],
          this.viewEnd,
          this.curve.view[3]
        ];
      } else {
        return this.curve.view;
      }
    },
    points() {
      return this.curve.points;
    },
    container() {
      return this.$refs.graph.container;
    },
    ...mapState([
      "songStart",
      "songEnd",
      "viewStart",
      "viewEnd",
      "keyboardState",
      "selectedNodes"
    ])
  },
  watch: {
    points: {
      handler(points) {},
      deep: true
    },
    bounds(bounds) {
      if (isNaN(bounds[0])) {
        this.$store.commit("SET_TRACK_VIEW", {
          viewStart: -1,
          viewEnd: 5
        });
      }
    },
    selectedNodes() {
      this.$refs.graph.resize();
      this.updatePoints();
    }
  },
  mounted() {
    this.updatePoints();
    const ticks = new window.PIXI.Graphics();

    window.addEventListener("resize", this.updatePoints);

    ticks.lineStyle(1000 / this.$refs.graph.pxPerY, 0xffffff, 0.4);
    ticks.moveTo(0, 100);
    ticks.lineTo(0, -100);
    ticks.lineStyle(10 / this.$refs.graph.pxPerX, 0xffffff, 0.4);
    ticks.moveTo(-100, 0);
    ticks.lineTo(100, 0);

    this.$refs.graph.container.addChild(ticks);
  },

  beforeDestroy() {
    window.removeEventListener("resize", this.updatePoints);
  },
  methods: {
    onMouseDown(e) {
      if (this.keyboardState.includes("control")) {
        const beat =
          this.bounds[0] +
          (e.clientX - this.$el.offsetLeft) / this.$refs.graph.pxPerX;
        const value =
          this.bounds[1] +
          (e.clientY - this.$el.offsetTop) / this.$refs.graph.pxPerY;
        let firstIndexHigher = this.points.findIndex(p => p.beat > beat);
        if (firstIndexHigher === -1) firstIndexHigher = this.points.length;

        const points = [...this.points];
        points.splice(firstIndexHigher, 0, {
          beat,
          value,
          type: 1
        });

        this.$store.commit("SET_CURVE", { id: this.curveId, points });
        this.updatePoints();
      }
    },
    updatePoints() {
      const extraGraphics = this.graphics.length - this.points.length;
      range(extraGraphics).forEach(() => {
        const oldGraphic = this.graphics.pop();
        this.container.removeChild(oldGraphic);
      });

      const newGraphicsNeeded = this.points.length - this.graphics.length;
      range(newGraphicsNeeded).forEach(() => {
        const newGraphic = new window.PIXI.Graphics();
        newGraphic.interactive = true;
        newGraphic.buttonMode = true;
        newGraphic
          .on("mousedown", this.curveDragStart(this.graphics.length))
          .on("mouseup", this.curveDragStop(this.graphics.length))
          .on("mouseupoutside", this.curveDragStop(this.graphics.length))
          .on("mousemove", this.curveDragMove(this.graphics.length));
        const index = this.graphics.push(newGraphic);
        this.container.addChildAt(newGraphic, 0);
      });

      let previousPoint = this.points[0];
      for (let i = 1; i < this.points.length; i++) {
        const graphic = this.graphics[i];
        const thisPoint = this.points[i];
        this.drawSegment(previousPoint, thisPoint, graphic);
        previousPoint = thisPoint;
      }

      const extraHandleGraphics = this.pointHandles.length - this.points.length;
      range(extraHandleGraphics).forEach(() => {
        const oldGraphic = this.pointHandles.pop();
        this.container.removeChild(oldGraphic);
      });

      const newHandleGraphicsNeeded =
        this.points.length - this.pointHandles.length;
      range(newHandleGraphicsNeeded).forEach(() => {
        const circle = new window.PIXI.Graphics();
        const newLength = this.pointHandles.push(circle);
        const index = newLength - 1;
        circle.beginFill(0xcccccc);
        circle.drawCircle(0, 0, 10);
        circle.endFill();
        this.container.addChild(circle);
        circle.interactive = true;
        circle.buttonMode = true;
        circle
          .on("mousedown", this.pointDragStart(index))
          .on("mouseup", this.pointDragStop(index))
          .on("mouseupoutside", this.pointDragStop(index))
          .on("mousemove", this.pointDragMove(index));
        circle.scale.set(
          1 / this.$refs.graph.pxPerX,
          1 / this.$refs.graph.pxPerY
        );
      });

      let i = 0;
      for (; i < this.points.length; i++) {
        const thisPoint = this.points[i];

        let circle = this.pointHandles[i];
        circle.position.x = thisPoint.beat;
        circle.position.y = thisPoint.value;
        circle.scale.set(
          1 / this.$refs.graph.pxPerX,
          1 / this.$refs.graph.pxPerY
        );
      }
    },
    async onMouseWheel(e) {
      const change = e.deltaY / 1000;
      const xOrigin = e.offsetX / this.$refs.graph.width;
      const yOrigin = e.offsetY / this.$refs.graph.height;
      this.zoom({
        x: change,
        y: change,
        xOrigin,
        yOrigin,
        global: this.curve.global
      });
      this.updatePoints();
    },
    // Global mode has to update values in the store while normal mode
    // just sets values on curve.view
    async zoom({ x, y, xOrigin, yOrigin, global }) {
      if (global) {
        await this.$store.commit("ZOOM_TRACK_VIEW", {
          x,
          xOrigin
        });
        const view = [
          this.bounds[0],
          this.bounds[1] - y * yOrigin,
          this.bounds[2],
          this.bounds[3] + y * (1 - yOrigin)
        ];
        await this.$store.commit("SET_CURVE", { id: this.curveId, view });
      } else {
        const view = [
          this.bounds[0] - x * xOrigin,
          this.bounds[1] - y * yOrigin,
          this.bounds[2] + x * (1 - xOrigin),
          this.bounds[3] + y * (1 - yOrigin)
        ];
        await this.$store.commit("SET_CURVE", { id: this.curveId, view });
      }
    },
    drawSegment(from, to, graphic) {
      graphic.clear();
      graphic.beginFill(0x50fb9f);
      graphic.moveTo(from.beat, 0);
      graphic.lineTo(from.beat, from.value);
      if (to.type === 0) {
        graphic.lineTo(from.beat, to.value);
        graphic.lineTo(to.beat, to.value);
      } else {
        // Ramp to by default
        if (from.value > 0 !== to.value > 0) {
          const intercept =
            (from.value / (to.value - from.value)) * (to.beat - from.beat);
          graphic.lineTo(from.beat - intercept, 0);
          graphic.lineTo(to.beat, 0);
          graphic.lineTo(to.beat, to.value);
          graphic.lineTo(from.beat - intercept, 0);
        } else {
          graphic.lineTo(to.beat, to.value);
        }
      }
      graphic.lineTo(to.beat, 0);
      graphic.lineTo(from.beat, 0);
    },
    async pan({ x, y }) {
      if (this.draggingIndex !== -1 || this.curveDraggingIndex !== -1) return;
      this.$store.commit("PAN_TRACK_VIEW", { deltaX: x });
      const view = [
        this.bounds[0],
        this.bounds[1] + y / 2,
        this.bounds[2],
        this.bounds[3] + y / 2
      ];
      await this.$store.commit("SET_CURVE", { id: this.curveId, view });
      this.updatePoints();
    },
    pointDragStart(i) {
      return e => {
        this.draggingIndex = i;
      };
    },
    pointDragStop() {
      return e => {
        this.draggingIndex = -1;
      };
    },
    pointDragMove(i) {
      return async e => {
        if (i !== this.draggingIndex) return;

        const x = e.data.originalEvent.movementX;
        const y = e.data.originalEvent.movementY;
        const beats = x / this.$refs.graph.pxPerX;
        const value = y / this.$refs.graph.pxPerY;
        const points = [...this.$store.state.curves[this.curveId].points];

        points[i].value += value;

        points[i].beat += beats;

        this.points.forEach((point, j, arr) => {
          if (j > i && point.beat < points[i].beat) {
            points[j].beat = points[i].beat;
          } else if (i > j && point.beat > points[i].beat) {
            points[j].beat = points[i].beat;
          }
        });
        await this.$store.commit("SET_CURVE", { id: this.curveId, points });

        this.updatePoints();
      };
    },
    curveDragStart(i) {
      return e => {
        this.curveDraggingIndex = i;
        this.curveStartX = e.data.originalEvent.clientX;
        this.curveStartY = e.data.originalEvent.clientY;
      };
    },
    curveDragStop(i) {
      return e => {
        this.curveDraggingIndex = -1;
        this.curveProgressX = 0;
        this.curveProgressY = 0;
      };
    },
    curveDragMove(i) {
      return e => {
        if (i !== this.curveDraggingIndex) return;
        const x = e.data.originalEvent.movementX;
        const y = e.data.originalEvent.movementY;
        this.curveProgressX += x;
        this.curveProgressY += y;
        if (Math.abs(this.curveProgressX) > 120) {
          const points = [...this.$store.state.curves[this.curveId].points];
          const increment = this.curveProgressX > 0 ? 1 : -1;
          points[i].type += increment;
          if (points[i].type < 0) points[i].type = 1;
          if (points[i].type > 1) points[i].type = 0;
          this.curveProgressX = this.curveProgressX / 2;
          this.updatePoints();
        }
      };
    }
  }
};
</script>

<style scoped>
.root {
  height: 100%;
  width: 100%;
  overflow: hidden;
  position: relative;
}
</style>
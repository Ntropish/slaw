<template>
  <div>
    {{ bounds }}
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
import { range } from "lodash";

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
    draggingIndex: -1
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
      "keyboardState"
    ])
  },
  watch: {
    points: {
      handler(points) {},
      deep: true
    },
    bounds(bounds) {
      console.log("bounds:", bounds);
      if (isNaN(bounds[0])) {
        this.$store.commit("SET_TRACK_VIEW", {
          viewStart: -1,
          viewEnd: 5
        });
      }
    }
  },
  mounted() {
    console.log(this.bounds);

    this.updatePoints();
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
        const innerPoints = this.points.slice(1, -1);
        let firstIndexHigher = innerPoints.findIndex(
          point => point.beat > beat
        );
        if (firstIndexHigher === -1) firstIndexHigher = this.points.length;

        innerPoints.splice(firstIndexHigher, 0, {
          beat,
          value,
          type: "flat"
        });

        const points = [
          this.points[0],
          ...innerPoints,
          this.points[this.points.length - 1]
        ];
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
        const index = this.graphics.push(newGraphic);
        this.container.addChild(newGraphic);
      });

      let previousPoint = {
        ...this.points[this.points.length - 1],
        beat: this.bounds[0]
      };
      for (let i = 1; i < this.points.length - 1; i++) {
        const graphic = this.graphics[i];
        const thisPoint = this.points[i];
        this.drawSegment(previousPoint, thisPoint, graphic);
        previousPoint = thisPoint;
      }

      const lastGraphic = this.graphics[this.graphics.length - 1];
      const lastPoint = this.points[this.points.length - 1];
      this.drawSegment(
        previousPoint,
        { ...lastPoint, beat: this.bounds[2] },
        lastGraphic
      );

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

      const firstPointHandle = this.pointHandles[0];
      firstPointHandle.position.x = this.bounds[0];
      firstPointHandle.position.y = this.points[0].value;

      const lastPointHandle = this.pointHandles[this.pointHandles.length - 1];
      lastPointHandle.position.x = this.bounds[2];
      lastPointHandle.position.y = this.points[this.points.length - 1].value;

      let i = 1;
      for (; i < this.points.length - 1; i++) {
        const thisPoint = this.points[i];
        let circle = this.pointHandles[i];
        circle.position.x = thisPoint.beat;
        circle.position.y = thisPoint.value;
        circle.scale.set(
          1 / this.$refs.graph.pxPerX,
          1 / this.$refs.graph.pxPerY
        );
      }

      const extraCurveHandleGraphics =
        this.curveHandles.length - this.points.length - 1;
      range(extraCurveHandleGraphics).forEach(() => {
        const oldGraphic = this.curveHandles.pop();
        this.container.removeChild(oldGraphic);
      });

      const newCurveHandleGraphicsNeeded =
        this.points.length - this.curveHandles.length + 1;
      range(newCurveHandleGraphicsNeeded).forEach(() => {
        const circle = new window.PIXI.Graphics();
        const newLength = this.curveHandles.push(circle);
        const index = newLength - 1;
        circle.lineStyle(2, 0xcccccc, 1);
        circle.drawCircle(0, 0, 10);
        circle.endFill();
        this.container.addChild(circle);
        circle.interactive = true;
        circle.buttonMode = true;
        circle
          .on("mousedown", this.curveDragStart(index))
          .on("mouseup", this.curveDragStop(index))
          .on("mouseupoutside", this.curveDragStop(index))
          .on("mousemove", this.curveDragMove(index));
        circle.scale.set(
          1 / this.$refs.graph.pxPerX,
          1 / this.$refs.graph.pxPerY
        );
      });

      //Opening handle either goes to infinity or isn't there
      //so it needs some special logic
      if (this.bounds[0] - this.points[1].beat > 1 / 4) {
        this.positionCurveHandle(
          {
            beat: this.bounds[0],
            value: this.points[0].value
          },
          {
            beat: this.points[1].beat,
            value: this.points[1].value
          },
          this.curveHandles[0]
        );
      } else {
        this.curveHandles[0].clear();
      }

      for (let j = 2; j < this.points.length; j++) {
        const thisPoint = this.points[j];
        const lastPoint = this.points[j - 1];
        let circle = this.curveHandles[j];
        this.positionCurveHandle(lastPoint, thisPoint, circle);
      }
    },
    positionCurveHandle(from, to, graphic) {
      graphic.position.x = (to.beat + from.beat) / 2;
      graphic.position.y = (to.value + from.value) / 2;
      graphic.scale.set(
        1 / this.$refs.graph.pxPerX,
        1 / this.$refs.graph.pxPerY
      );
    },
    // Builds a handler to change a segment at a given index
    async onMouseWheel(e) {
      const change = e.deltaY / 1;
      const deltaX = change / this.$refs.graph.pxPerX;
      const deltaY = change / this.$refs.graph.pxPerY / 100;
      if (this.curve.global) {
        await this.$store.commit("ZOOM_TRACK_VIEW", { x: deltaX });
        const view = [
          this.bounds[0],
          this.bounds[1] - deltaY / 2,
          this.bounds[2],
          this.bounds[3] + deltaY / 2
        ];
        await this.$store.commit("SET_CURVE", { id: this.curveId, view });
      } else {
        const view = [
          this.bounds[0] - deltaX / 2,
          this.bounds[1] - deltaY / 2,
          this.bounds[2] + deltaX / 2,
          this.bounds[3] + deltaY / 2
        ];
        await this.$store.commit("SET_CURVE", { id: this.curveId, view });
      }
      this.updatePoints();
    },
    drawSegment(from, to, graphic) {
      // console.log(from.beat, from.value, to.beat, to.value, graphic);
      graphic.clear();
      graphic.beginFill(0x50fb9f);
      graphic.moveTo(from.beat, 0);
      graphic.lineTo(from.beat, from.value);
      if (to.type === "flat") {
        graphic.lineTo(from.beat, to.value);
        graphic.lineTo(to.beat, to.value);
      } else if (to.type === "ramp") {
        graphic.lineTo(to.beat, to.value);
      }
      graphic.lineTo(to.beat, 0);
      graphic.lineTo(from.beat, 0);
    },
    addPoint() {
      this.$store;
    },
    async pan({ x, y }) {
      if (this.draggingIndex !== -1) return;
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
      return e => {
        if (i !== this.draggingIndex) return;
        console.log("drag:", i);
        const x = e.data.originalEvent.movementX;
        const y = e.data.originalEvent.movementY;
        const beats = x / this.$refs.graph.pxPerX;
        const value = y / this.$refs.graph.pxPerY;
        const points = this.$store.state.curves[this.curveId].points;
        points[i].beat += beats;
        points[i].value += value;

        this.updatePoints();
      };
    },
    curveDragStart(i) {},
    curveDragStop(i) {},
    curveDragMove(i) {}
  }
};
</script>

<style scoped>
.root {
  height: 100%;
  width: 100%;
}
</style>
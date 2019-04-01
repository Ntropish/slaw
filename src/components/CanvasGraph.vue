<template>
  <div class="node-editor" @mousedown="onMouseDown" @keydown="onKeyDown" @wheel="onWheel">
    <canvas
      v-for="layer in layers"
      ref="edges"
      :key="layer"
      class="canvas edges"
      oncontextmenu="return false"
      @mousedown="canvasMouseDown"
    />
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  props: {
    layers: {
      type: Array,
      default: () => "canvas"
    }
  },
  data: () => ({
    canvasWidth: 300,
    canvasHeight: 150,
    dragStart: null,
    dragEnd: null
  }),
  computed: {
    xCount() {
      return this.xEnd - this.xStart;
    },
    pxPerX() {
      return this.canvasWidth / this.xCount;
    },
    yCount() {
      return this.yEnd - this.yStart;
    },
    pxPerY() {
      return this.canvasHeight / this.yCount;
    },
    contexts() {
      return this.canvases.map(c => c.getContext("2d"));
    },
    ...mapState(["focus"])
  },
  methods: {
    pxOfX(x) {
      return (x - this.xStart) * this.pxPerX;
    },
    pxOfY(y) {
      return (y - this.yStart) * this.pxPerY;
    },
    onKeyDown(e) {
      this.$emit("keydown", e);
      this.$emit("render", this.contexts);
    },
    onMouseDown(e) {
      if (e.button === 1) {
        this.canvases[0].requestPointerLock();
      }

      const x = e.offsetX;
      const y = e.offsetY;

      this.dragStart = { x, y };
      this.dragEnd = { x, y };

      this.mouseDown(e);

      this.render();
    },
    onMouseUp(e) {
      e.preventDefault();
      if (e.button === 1) document.exitPointerLock();
      this.dragStart = null;
      this.dragEnd = null;
      this.mouseUp(e);
      this.render();
    },
    onMouseMove(e) {
      if (!this.$el.contains(this.focus)) return;
      const { x, y } = this.getMousePosition(e);

      if (this.dragStart) this.dragEnd = { x, y };

      if (this.mouseState.includes(2) && this.mouseState.length <= 2) {
        this.pan({
          x: -e.movementX / this.pxPerX,
          y: -e.movementY / this.pxPerY
        });
      }

      if (this.mouseState.includes(1) && this.mouseState.length === 1) {
        const growthFactor = 2.0;
        this.zoom2d({
          x: (-e.movementX / this.pxPerX) * growthFactor,
          y: (-e.movementY / this.pxPerY) * growthFactor
        });
      }

      const snappedX = this.xSnap ? Math.round(x / this.xSnap) * this.xSnap : x;
      const snappedY = this.ySnap ? Math.round(y / this.ySnap) * this.ySnap : y;

      this.mouseMove({ x: snappedX, y: snappedY, e });

      this.render();
    },
    getMousePosition(e) {
      var rect = this.canvases[0].getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    },
    onWheel(e) {
      this.zoom({
        x: e.deltaX / 100,
        y: e.deltaY / 100,
        xOrigin: e.offsetX / this.canvasWidth,
        yOrigin: e.offsetY / this.canvasHeight
      });
    },
    pxToXY(pxX, pxY) {
      return [this.pxToX(pxX), this.pxToY(pxY)];
    },
    pxToX(pxX) {
      return pxX / this.pxPerX + this.xStart;
    },
    pxToY(pxY) {
      return pxY / this.pxPerY + this.yStart;
    },
    sizeCanvases() {
      const styles = getComputedStyle(this.canvases[0]);
      const w = parseInt(styles.getPropertyValue("width"), 10);
      const h = parseInt(styles.getPropertyValue("height"), 10);

      this.canvases.forEach(canvas => {
        canvas.width = w;
        canvas.height = h;
      });

      this.canvasWidth = w;
      this.canvasHeight = h;

      this.render();
    }
  }
};
</script>
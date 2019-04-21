<template>
  <div v-once ref="root" class="root" @mousedown="dragStart"/>
</template>

<script>
import "pixi.js";
import { mapState, mapGetters } from "vuex";

export default {
  props: {
    // [x1, y1, x2, y2]
    bounds: {
      type: Array,
      required: true
    }
  },
  data: () => {
    let app = new window.PIXI.Application({
      transparent: true,
      antialias: true
    });
    app.renderer.autoResize = true;
    const container = new window.PIXI.Container();

    app.stage.addChild(container);
    return { app, container, height: 1, width: 1, dragging: false };
  },
  computed: {
    pxPerX() {
      const [x1, y1, x2, y2] = this.bounds;
      return this.width / (x2 - x1);
    },
    pxPerY() {
      const [x1, y1, x2, y2] = this.bounds;
      return this.height / (y2 - y1);
    }
  },
  watch: {
    bounds: {
      handler(bounds) {
        this.setContainerTransform();
      },
      deep: true
    },
    width() {
      this.setContainerTransform();
    },
    height() {
      this.setContainerTransform();
    }
  },
  mounted() {
    this.resize();
    this.$refs.root.appendChild(this.app.view);
    window.addEventListener("resize", this.resize);
    window.addEventListener("mouseup", this.dragStop);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("mouseup", this.dragStop);
  },
  methods: {
    pxOfX(x) {
      return (
        (this.width * (x - this.bounds[0])) / (this.bounds[2] - this.bounds[0])
      );
    },
    pxOfY(y) {
      return (
        (this.height * (y - this.bounds[1])) / (this.bounds[3] - this.bounds[1])
      );
    },
    resize() {
      const styles = getComputedStyle(this.$refs.root);
      this.width = parseInt(styles.getPropertyValue("width"), 10);
      this.height = parseInt(styles.getPropertyValue("height"), 10);
      this.app.renderer.resize(this.width, this.height);
      this.setContainerTransform();
      this.$emit("resize");
    },
    setContainerTransform() {
      const [x1, y1, x2, y2] = this.bounds;
      this.container.scale.set(this.pxPerX, this.pxPerY);
      this.container.position.set(-x1 * this.pxPerX, -y1 * this.pxPerY);
    },
    dragStart(e) {
      window.addEventListener("mousemove", this.dragMove);
    },
    dragStop(e) {
      window.removeEventListener("mousemove", this.dragMove);
    },
    dragMove(e) {
      this.$emit("pan", {
        x: -e.movementX / this.pxPerX,
        y: -e.movementY / this.pxPerY
      });
    }
  }
};
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
}
</style>
<template>
  <div v-once ref="root" class="root"/>
</template>

<script>
import "pixi.js";

export default {
  props: {
    // [x1, y1, x2, y2]
    bounds: {
      type: Array,
      required: true
    }
  },
  data: () => {
    let app = new window.PIXI.Application({ transparent: true });
    app.renderer.autoResize = true;
    const container = new window.PIXI.Container();
    app.stage.addChild(container);

    return { app, container, height: 1, width: 1 };
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
  },
  methods: {
    resize() {
      const styles = getComputedStyle(this.$refs.root);
      this.width = parseInt(styles.getPropertyValue("width"), 10);
      this.height = parseInt(styles.getPropertyValue("height"), 10);
      this.app.renderer.resize(this.width, this.height);
      this.setContainerTransform();
    },
    setContainerTransform() {
      const [x1, y1, x2, y2] = this.bounds;
      const pxPerX = (x2 - x1) / this.width;
      const pxPerY = (y2 - y1) / this.height;
      this.container.scale.set(1 / pxPerX, 1 / pxPerY);
      this.container.position.set(-x1 / pxPerX, -y1 / pxPerY);
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
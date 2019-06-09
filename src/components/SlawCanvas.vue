<template>
  <canvas v-once ref="canvas"/>
</template>

<script>
export default {
  mounted() {
    document.addEventListener("resize", this.resize);
    document.addEventListener("focus", this.resize);
    this.resize();
  },
  unmounted() {
    document.removeEventListener("resize", this.resize);
    document.removeEventListener("focus", this.resize);
  },
  methods: {
    resize(e) {
      const canvas = this.$refs.canvas;
      const styles = getComputedStyle(this.$refs.canvas.parentElement);
      const w = parseInt(styles.getPropertyValue("width"), 10);
      const h = parseInt(styles.getPropertyValue("height"), 10);
      canvas.width = w;
      canvas.height = h;

      this.$emit("resize");
    }
  }
};
</script>
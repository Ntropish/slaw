<template>
  <svg v-once ref="svg" class="svg"></svg>
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
      const svg = this.$refs.svg;
      const styles = getComputedStyle(this.$refs.svg.parentElement);
      const w = parseInt(styles.getPropertyValue("width"), 10);
      const h = parseInt(styles.getPropertyValue("height"), 10);

      this.$emit("resize");
    }
  }
};
</script>

<style scoped>
.svg {
  width: 100%;
  height: 100%;
}
</style>

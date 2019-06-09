<template>
  <div>
    <slot/>
  </div>
</template>

<script>
export default {
  data: () => ({ dragging: false }),
  mounted() {
    this.$el.addEventListener("pointerdown", this.down);
  },
  unmounted() {
    this.$el.removeEventListener("pointerdown", this.down);
    document.removeEventListener("pointermove", this.move);
    document.removeEventListener("pointerup", this.move);
  },
  methods: {
    down(e) {
      this.$emit("down", e);
      this.dragging = true;
      document.addEventListener("pointermove", this.move);
      document.addEventListener("pointerup", this.up);
      // Just in case the user leaves and the event never fires
      document.addEventListener("blur", this.up);
    },
    move(e) {
      this.$emit("drag", e);
    },
    up(e) {
      if (!this.dragging) return;
      this.$emit("up", e);
      this.dragging = false;
      document.removeEventListener("pointermove", this.move);
      document.removeEventListener("pointerup", this.move);
    }
  }
};
</script>
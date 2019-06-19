<template>
  <div ref="root" @pointerdown="down">
    <slot/>
  </div>
</template>

<script>
import { setImmediate } from "timers";
export default {
  props: { handle: { type: String, default: null } },
  data: () => ({ dragging: false }),
  mounted() {
    // This drag component won't capture a drag if another one is
    // in progress. This prevents parent element drags from stealing
    // their children's thunder
    document.addEventListener("gotpointercapture", this.disableIfNotTarget);
    document.addEventListener("lostpointercapture", this.enable);
  },
  unmounted() {
    document.removeEventListener("gotpointercapture", this.disableIfNotTarget);
    document.removeEventListener("lostpointercapture", this.enable);
    document.removeEventListener("pointermove", this.move);
    document.removeEventListener("pointerup", this.move);
  },
  methods: {
    down(e) {
      if (this.handle && e.target !== document.querySelector(this.handle))
        return;
      this.$emit("down", e);
      this.dragging = true;
      this.$el.setPointerCapture(e.pointerId);
      document.addEventListener("pointermove", this.move);
      document.addEventListener("pointerup", this.up);
      // Just in case the user leaves and the event never fires
      document.addEventListener("blur", this.up);
    },
    move(e) {
      if (e.target !== this.$el || !this.dragging) return;
      this.$emit("drag", e);
    },
    up(e) {
      if (!this.dragging) return;
      this.$emit("up", e);
      this.dragging = false;
      this.$el.releasePointerCapture(e.pointerId);
      document.removeEventListener("pointermove", this.move);
      document.removeEventListener("pointerup", this.move);
    }
  }
};
</script>
<template>
  <div class="root">
    <div v-if="node.type === 'track'">Track: {{ node.data.track }}</div>
  </div>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  data: () => ({})
};
</script>

<style scoped>
.root {
  /* padding: 0.4em; */
  background: hsla(0, 0%, 70%, 0.2);
  position: absolute;
  pointer-events: none;
}
</style>


<template>
  <div class="root">
    Analyser
    <pixi-graph :bounds="bounds"/>
  </div>
</template>
<script>
import PixiGraph from "components/PixiGraph.vue";
export default {
  components: { PixiGraph },
  props: {
    brain: {
      type: Object,
      required: true
    }
  },
  computed: {
    bounds() {
      return [0, 100, 2048, 0];
    },
    curveId() {
      return this.$store.state.nodes[this.brain.nodeId].data.curveId;
    }
  }
};
</script>

<style scoped>
.root {
  display: flex;
  flex-direction: column;
  width: 100%;
}
.curve-editor {
  flex-grow: 1;
  overflow: hidden;
}
</style>


<template>
  <div class="root">
    Curve
    <curve-editor :curve-id="curveId" class="curve-editor"/>
  </div>
</template>
<script>
import CurveEditor from "components/CurveEditor.vue";
export default {
  components: { CurveEditor },
  props: {
    brain: {
      type: Object,
      required: true
    }
  },
  computed: {
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


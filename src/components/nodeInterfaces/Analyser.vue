<template>
  <div class="root">
    Analyser
    <trend class="graph" :data="dataArray" :gradient="['#6fa8dc', '#42b983', '#2c3e50']" smooth/>
  </div>
</template>
<script>
import Trend from "vuetrend";
export default {
  components: { Trend },
  props: {
    brain: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    dataArray: []
  }),
  computed: {
    bounds() {
      return [0, 100, 2048, 0];
    },
    curveId() {
      return this.$store.state.nodes[this.brain.nodeId].data.curveId;
    }
  },
  watch: {},
  mounted() {
    this.brain.transporter.on("positionUpdate", e => {
      this.dataArray = Array.from(this.brain.getData());
    });
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
.graph {
  width: 100%;
  height: 100%;
}
</style>

 
<template>
  <div class="root">
    <div
      v-for="nodeType in nodeTypes"
      :key="nodeType"
      class="node-type"
      :class="{selected: nodeType === selectedNodeType}"
      @mousedown="onNodeTypeMouseDown(nodeType)"
    >{{ nodeType }}</div>
  </div>
</template>

<script>
import nodeMap from "nodes";
export default {
  props: {
    selectedNodeType: {
      type: String,
      default: () => ""
    }
  },
  data() {
    return {};
  },
  computed: {
    nodeTypes() {
      return Object.keys(nodeMap);
    }
  },
  methods: {
    onNodeTypeMouseDown(nodeType) {
      this.$emit("selected-node-type-change", nodeType);
    }
  }
};
</script>

<style scoped>
.root {
  border-radius: 2.5px;
  background: hsla(0, 0%, 15%, 0.8);
  box-shadow: 0 0 6px hsla(0, 0%, 0%, 0.3);
  padding: 0.4em;
  position: fixed;
  width: 180px;
  height: 100%;
}

.node-type {
  cursor: pointer;
  padding: 0.4em;
  border-radius: 2.5px;
}

.node-type:hover {
  background: hsla(0, 0%, 0%, 0.1);
}

.node-type.selected {
  background: hsla(0, 0%, 0%, 0.3);
}
</style>


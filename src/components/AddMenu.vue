<template>
  <div class="root">
    <div
      v-for="nodeType in nodeTypes"
      :key="nodeType"
      class="node-type"
      @mousedown="onNodeTypeMouseDown(nodeType)"
    >{{ nodeType }}</div>
  </div>
</template>

<script>
import nodeMap from "nodes";
export default {
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
      this.$emit("drag-new-node", nodeType);
    }
  }
};
</script>

<style scoped>
.root {
  border-radius: 2.5px;
  background: var(--primary-background);
  box-shadow: 0 0 6px hsla(0, 0%, 0%, 0.3);
  padding: 0.4em;
  position: fixed;
  max-width: 20vw;
  max-height: 100%;
  user-select: none;
  -moz-user-select: none;
}

.node-type {
  cursor: pointer;
  padding: 0.4em;
  border-radius: 2.5px;
  font-size: 1.2em;
  user-select: none;
  -moz-user-select: none;
}

.node-type:hover {
  background: hsla(0, 0%, 0%, 0.1);
}

.node-type.selected {
  background: hsla(0, 0%, 0%, 0.3);
}
</style>


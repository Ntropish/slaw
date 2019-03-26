<template>
  <div class="root">
    <div
      v-for="nodeType in nodeTypes"
      class="node-type"
      :class="{selected: nodeType === selectedNodeType}"
      :key="nodeType"
      @mousedown="onNodeTypeMouseDown(nodeType)"
    >{{nodeType}}</div>
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
  border-radius: 4px;
  background: hsla(0, 0%, 15%, 1);
  box-shadow: 0 0 6px hsla(0, 0%, 0%, 0.3);
  padding: 1em;

  position: fixed;
  width: 200px;
  height: 400px;
}

.node-type {
  cursor: pointer;
  padding: 1em;
  border-radius: 2.5px;
}

.node-type:hover {
  background: hsla(0, 0%, 0%, 0.1);
}

.node-type.selected {
  background: hsla(0, 0%, 0%, 0.3);
}
</style>


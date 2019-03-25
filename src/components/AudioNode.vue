<template>
  <div class="root">
    <div class="io">
      <div :style="outputStyle" class="outputs">
        <div
          v-for="(output, index) in brain.outputs"
          :key="index"
          class="handle"
          :style="handleStyle"
          @mouseup="handleMouseUp('input', index)"
          @mousedown="handleMouseDown('input', index)"
        >{{ output.type }}</div>
      </div>

      <div class="info">{{ node.type }}</div>
      <div :style="inputStyle" class="inputs">
        <div
          v-for="(input, index) in brain.inputs"
          :key="index"
          class="handle"
          :style="handleStyle"
          @mouseup="handleMouseUp('output', index)"
          @mousedown="handleMouseDown('output', index)"
        >{{ input.type }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
      required: true
    },
    handleSpacing: {
      type: Number,
      required: true
    }
  },
  data: () => ({}),
  computed: {
    rows() {
      if (!this.brain) return 0;
      return Math.max(this.brain.outputs.length, this.brain.inputs.length);
    },
    handleStyle() {
      return {
        height: this.handleSpacing + "px"
      };
    },
    outputStyle() {
      return {
        marginTop: 0.5 * this.handleSpacing + "px"
      };
    },
    inputStyle() {
      return {
        marginBottom: 0.5 * this.handleSpacing + "px"
      };
    },
    brain() {
      const brains = this.$store.state.brains;
      return brains[this.node.brain];
    }
  },
  methods: {
    handleMouseUp(type, i) {
      this.$emit("handle-drop", { type, i });
    },
    handleMouseDown(type, i) {
      this.$emit("handle-drag", { type, i });
    }
  }
};
</script>

<style scoped>
.root {
  box-sizing: border-box;
  background: hsla(0, 0%, 70%, 0.2);
  user-select: none;
  position: absolute;
  box-shadow: 0 0 3px hsla(0, 0%, 0%, 0.8);
}

.io {
  margin-bottom: 1em;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 100%;
}

.inputs,
.outputs {
  margin: 0.5em 0;
}

.info {
  flex-grow: 1;
}

.outputs {
  text-align: right;
}

.handle {
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: hsla(0, 0%, 100%, 0.35);
  overflow: hidden;
}
</style>


<template>
  <div class="root" :class="{selected: selected}">
    <svg viewBox="0 0 100 100" :style="infoStyle" class="info" @mousedown="mouseDown">
      <text x="50" y="50" alignment-baseline="middle" text-anchor="middle">{{ node.type }}</text>
    </svg>
    <div class="ports">
      <div class="inputs">
        <div
          v-for="(input, index) in brain.inputs"
          :key="index"
          class="handle"
          :class="{[input.type]: true }"
          @mouseup="handleInputMouseUp('output', index)"
          @mousedown="handleInputMouseDown('output', index)"
        >
          <div class="handleShader"/>
        </div>
      </div>
      <div class="outputs">
        <div
          v-for="(output, index) in brain.outputs"
          :key="index"
          class="handle"
          :class="{[output.type]: true }"
          @mouseup="handleOutputMouseUp('input', index)"
          @mousedown="handleOutputMouseDown('input', index)"
        >
          <div class="handleShader"/>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapState } from "vuex";
export default {
  props: {
    node: {
      type: Object,
      required: true
    },
    selected: {
      type: Boolean,
      required: true
    },
    handleSpacing: {
      type: Number,
      required: true
    }
  },
  data: () => ({}),
  computed: {
    brain() {
      const brains = this.$store.state.brains;
      return brains[this.node.brain];
    },
    infoStyle() {
      return {
        height: this.handleSpacing + "px"
      };
    }
  },
  methods: {
    handleInputMouseUp(type, i) {
      this.$emit("handle-input-drop", { i });
    },
    handleInputMouseDown(type, i) {
      this.$emit("handle-input-drag", { i });
    },
    handleOutputMouseUp(type, i) {
      this.$emit("handle-output-drop", { i });
    },
    handleOutputMouseDown(type, i) {
      this.$emit("handle-output-drag", { i });
    },
    mouseDown(e) {
      this.$store.dispatch("selectNode", {
        id: this.node.id,
        preserveSelection: e.ctrlKey
      });
    }
  }
};
</script>

<style scoped>
.root {
  border-radius: 2.5px;
  box-sizing: border-box;
  user-select: none;
  position: absolute;
  background: hsla(0, 0%, 15%, 1);
  box-shadow: 0 0 6px hsla(0, 0%, 0%, 0.3);
  display: flex;
  flex-direction: column;
}

.root.selected {
  box-shadow: 0 0 2px hsla(0, 0%, 100%, 0.9);
}

.ports {
  display: flex;
  height: 100%;
}

.inputs,
.outputs {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
}

.info {
  flex-grow: 0;
  flex-shrink: 0;
  fill: hsla(0, 0%, 100%, 0.3);
  font-size: 70px;
}

.inputs {
  margin-right: 1.5px;
}
.outputs {
  text-align: right;
  margin-left: 1.5px;
}

.handle {
  overflow: hidden;
  flex: 1 1 0;
  position: relative;
  border-radius: 2.5px;
}

.handle {
  margin-top: 3px;
}

.handle.buffer {
  background: hsla(0, 50%, 65%, 0.5);
}
.handle.event {
  background: hsla(60, 50%, 65%, 0.7);
}
.handleShader:hover {
  opacity: 1;
}
.handleShader {
  border: 5px solid hsla(20, 20%, 100%, 0.1);
  box-shadow: inset 0 0 0.5em hsla(210, 20%, 10%, 0.4);
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  position: absolute;
  opacity: 0;
  transition: opacity 0.1s;
}
.handle > .shade {
  width: 100%;
  height: 100%;
  background: hsla(0, 0%, 0%, 0.2);
  border-radius: 50%;
}
.handle > .shade:hover {
  transition: opacity 0.1s;
  opacity: 0;
}

.inputs > .holster > .handle {
  right: 100%;
  border-radius: 50%;
}

.outputs > .holster > .handle {
  left: 100%;
  border-radius: 50%;
}
</style>


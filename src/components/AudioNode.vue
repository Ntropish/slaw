<template>
  <div class="root" :class="{selected: selected}" @mousedown="mouseDown">
    <svg viewBox="0 0 100 100" :style="infoStyle" class="info">
      <text x="50" y="50" alignment-baseline="middle" text-anchor="middle">{{ node.type }}</text>
    </svg>
    <div class="ports">
      <div class="inputs">
        <div
          v-for="(input, index) in brain.inputs"
          :key="index"
          class="handle"
          :style="inputHandleStyle"
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
          :style="outputHandleStyle"
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
    },
    handleStyle() {
      const halfSpace = this.handleSpacing / 2;
      return {
        height: halfSpace + "px",
        width: halfSpace + "px",
        borderRadius: this.handleSpacing + "px",
        flexBasis: halfSpace + "px",
        margin: halfSpace / 2 + "px"
      };
    },
    inputHandleStyle() {
      return {
        left: -this.handleSpacing / 2 + "px",
        ...this.handleStyle
      };
    },
    outputHandleStyle() {
      return {
        right: -this.handleSpacing / 2 + "px",
        ...this.handleStyle
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
      if (e.altKey) {
        this.$store.dispatch("removeSelectedNodes");
      }
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
  /* justify-content: space-around; */
}

.info {
  flex-grow: 0;
  flex-shrink: 0;
  fill: hsla(0, 0%, 100%, 0.5);
  font-size: 70px;
}

.inputs {
  align-items: flex-start;
}
.outputs {
  align-items: flex-end;
}

.inputs > .handle {
  margin-right: auto;
}

.outputs > .handle {
  margin-left: auto;
}

.handle {
  overflow: hidden;
  flex: 0 0;
  position: relative;
  border-radius: 2.5px;
  box-sizing: border-box;
  /* border: 1px solid hsla(180, 10%, 50%, 0.5); */
}

.handle.buffer {
  background: hsla(0, 35%, 35%, 1);
}
.handle.event {
  background: hsla(45, 35%, 35%, 1);
}
.handleShader:hover {
  opacity: 1;
}
.handleShader {
  border-radius: inherit;

  box-shadow: inset 0 0 0.4em hsla(210, 40%, 70%, 0.9);
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
</style>


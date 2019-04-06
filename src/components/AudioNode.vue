<template>
  <div class="root" :class="{selected: selected}">
    <div class="info" @mousedown="mouseDown">{{ node.type }}</div>
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
import nodeMap from "nodes";
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
    gui() {
      return nodeMap[this.node.type].interface;
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
    handleStyle(type, isLeft) {
      const typeMap = {
        buffer: "hsla(0, 40%, 30%, 1)",
        event: "hsla(60, 40%, 30%, 1)"
      };
      const style = {
        background: typeMap[type],
        width: this.handleSpacing + "px",
        height: this.handleSpacing + "px"
      };
      if (isLeft) {
        style.right = `calc(100% - ${this.handleSpacing / 2}px)`;
      } else {
        style.left = `calc(100% - ${this.handleSpacing / 2}px)`;
      }
      return style;
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
  flex-grow: 1;
  padding: 0.2em;
  background: hsla(0, 0%, 100%, 0.3);
  font-size: 2vw;
}

.outputs {
  text-align: right;
}

.handle {
  overflow: hidden;
  flex: 1 1 0;
  margin: 2px;
  position: relative;
  border-radius: 2.5px;
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
  border: 5px solid hsla(20, 20%, 100%, 0.2);
  box-shadow: inset 0 0 0.5em hsla(210, 20%, 10%, 0.2);
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


<template>
  <div class="root" :class="{selected: selected}">
    <div class="io">
      <div :style="outputStyle" class="outputs">
        <div
          v-for="(output, index) in brain.outputs"
          :key="index"
          class="holster"
          :style="holsterStyle"
          @mouseup="handleOutputMouseUp('input', index)"
          @mousedown="handleOutputMouseDown('input', index)"
        >
          <div class="handle" :style="handleStyle(output.type)">
            <div class="shade"/>
          </div>
        </div>
      </div>

      <div class="info">{{ node.type }}</div>
      <div :style="inputStyle" class="inputs">
        <div
          v-for="(input, index) in brain.inputs"
          :key="index"
          class="holster"
          :style="holsterStyle"
          @mouseup="handleInputMouseUp('output', index)"
          @mousedown="handleInputMouseDown('output', index)"
        >
          <div class="handle" :style="handleStyle(input.type, true)">
            <div class="shade"/>
          </div>
        </div>
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
    rows() {
      if (!this.brain) return 0;
      return Math.max(this.brain.outputs.length, this.brain.inputs.length);
    },
    holsterStyle() {
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
}

.root.selected {
  box-shadow: 0 0 2px hsla(0, 0%, 100%, 0.9);
}

.io {
  margin-bottom: 1em;
  display: flex;
  flex-direction: column;

  height: 100%;
}

.inputs,
.outputs {
  margin: 0.5em;
  display: flex;
  flex-direction: column;
}

.info {
  flex-grow: 1;
  padding: 1em;
}

.outputs {
  text-align: right;
}

.holster {
  color: hsla(0, 0%, 100%, 0.35);
  overflow: hidden;
}

.handle {
  position: absolute;
  z-index: 11;
  box-shadow: 0 0 1em hsla(0, 0%, 0%, 1);
}
.handle:hover {
  box-shadow: 0 0 1.5em hsla(0, 0%, 0%, 1);
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


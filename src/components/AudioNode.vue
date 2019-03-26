<template>
  <div class="root" :class="{selected: selected}">
    <div class="io">
      <div :style="outputStyle" class="outputs">
        <div
          v-for="(output, index) in brain.outputs"
          :key="index"
          class="holster"
          :style="holsterStyle"
          @mouseup="handleMouseUp('input', index)"
          @mousedown="handleMouseDown('input', index)"
        >
          <div class="handle" :style="handleStyle(output.type)"/>
        </div>
      </div>

      <div class="info">{{ node.type }}</div>
      <div :style="inputStyle" class="inputs">
        <div
          v-for="(input, index) in brain.inputs"
          :key="index"
          class="holster"
          :style="holsterStyle"
          @mouseup="handleMouseUp('output', index)"
          @mousedown="handleMouseDown('output', index)"
        >
          <div class="handle" :style="handleStyle(input.type, true)"/>
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
    handleMouseUp(type, i) {
      this.$emit("handle-drop", { type, i });
    },
    handleMouseDown(type, i) {
      this.$emit("handle-drag", { type, i });
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
  /* justify-content: center; */
}

.info {
  flex-grow: 1;
}

.outputs {
  text-align: right;
}

.holster {
  /* display: flex;
  flex-direction: column;
  justify-content: space-between; */
  color: hsla(0, 0%, 100%, 0.35);
  overflow: hidden;
}

.handle {
  position: absolute;
  width: 12px;
  height: 12px;
  z-index: 11;
  box-shadow: 0 0 1em hsla(0, 0%, 0%, 1);
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


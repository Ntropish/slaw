<template>
  <div class="root" :class="{selected: selected}" @pointerdown="onPointerDown">
    <div class="label">{{ node.type }}</div>
    <div class="ports">
      <div class="inputs">
        <div
          v-for="(input, index) in brain.inputs"
          :key="index"
          class="handle"
          :style="inputHandleStyle"
          :class="{[input.type]: true }"
          @pointerup="handleInputMouseUp('output', index)"
          @pointerdown="handleInputMouseDown('output', index)"
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
          @pointerup="handleOutputMouseUp('input', index)"
          @pointerdown="handleOutputMouseDown('input', index)"
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
    },
    pxPerUnit: {
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
      const eighthSpace = this.handleSpacing / 8;
      return {
        height: eighthSpace * 6 + "px",
        width: eighthSpace * 6 + "px",
        borderRadius: eighthSpace * 6 + "px",
        flexBasis: eighthSpace * 6 + "px",
        margin: eighthSpace + "px"
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
    onPointerDown(e) {
      // handle clicks are not handled here
      if (e.target.closest(".handle")) return;

      // Select/drag/removal of nodes are
      const id = e.pointerId;
      this.$el.setPointerCapture(id);
      this.$store.dispatch("selectNode", {
        id: this.node.id,
        preserveSelection: e.ctrlKey
      });
      if (e.altKey) {
        this.$store.dispatch("removeSelectedNodes");
      } else if (!e.target.closest(".handle")) {
        window.addEventListener("mousemove", this.mouseMove);
        const remover = () => {
          this.$el.releasePointerCapture(id);

          window.removeEventListener("mousemove", this.mouseMove);
          window.removeEventListener("mouseup", remover);
          window.removeEventListener("blur", remover);
        };
        window.addEventListener("mouseup", remover, { once: true });
        window.addEventListener("blur", remover, { once: true });
      }
    },
    mouseMove(e) {
      this.$emit("drag", e);
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

.label {
  position: absolute;
  bottom: calc(100% + 4px);
  width: 100%;
  text-align: center;
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


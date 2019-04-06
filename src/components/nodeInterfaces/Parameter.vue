<template>
  <div>
    <input type="number" @keyup="onChange" @change="onChange" @paste="onChange" @click="onChange">
  </div>
</template>
<script>
export default {
  props: {
    brain: {
      type: Object,
      required: true
    }
  },
  data: () => ({
    value: 1
  }),
  methods: {
    onChange(e) {
      const value = parseFloat(e.target.value);
      if (isNaN(value)) {
        return;
      } else {
        this.brain.setValue(value);
      }
    }
  }
};
</script>

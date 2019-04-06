<template>
  <div>
    <input ref="input" v-model="brain.value" type="number">
  </div>
</template>
<script>
export default {
  props: {
    brain: {
      type: Object,
      required: true
    }
  }
};
</script>

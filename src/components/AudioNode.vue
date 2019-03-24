<template>
  <div class="root">
    {{ node.type }}
    <br>
    {{ node.data }}
  </div>
</template>

<script>
export default {
  props: {
    node: {
      type: Object,
      required: true
    }
  },
  data: () => ({}),
  methods: {}
};
</script>

<style scoped>
.root {
  padding: 0.6em;
  box-sizing: border-box;
  background: hsla(0, 0%, 70%, 0.2);
  position: absolute;
  pointer-events: none;
  box-shadow: 0 0 3px hsla(0, 0%, 0%, 0.8);
}
</style>


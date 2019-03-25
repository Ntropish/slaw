<template>
  <div>ADSR</div>
</template>

<script>
import ADSRFactory from "./ADSRFactory";
export default {
  data() {
    return {
      brain: null
    };
  },
  mounted() {
    this.brain = ADSRFactory(this.transporter);
  }
};
</script>

<template>
  <transient-editor ref="transientEditor" class="event-editor" :track-id="brain.trackId"/>
</template>
<script>
import TransientEditor from "components/TransientEditor.vue";
export default {
  components: { TransientEditor },
  props: {
    brain: {
      type: Object,
      required: true
    }
  }
};
</script>

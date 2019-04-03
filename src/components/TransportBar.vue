<template>
  <div>
    <pixi-graph ref="graph" class="root" :bounds="bounds"/>
  </div>
</template>

<script>
import PixiGraph from "./PixiGraph.vue";
import { mapState, mapGetters } from "vuex";

export default {
  components: { PixiGraph },
  // data: () => {},
  computed: {
    bounds() {
      return [this.songStart, 5000, this.songEnd, -5000];
    },
    ...mapState(["songStart", "songEnd", "viewStart", "viewEnd", "events"])
  },
  watch: {
    events: {
      handler() {},
      deep: true
    }
  },
  mounted() {
    requestAnimationFrame(() => {
      const container = this.$refs.graph.container;

      Object.values(this.events).forEach(event => {
        const graphic = new window.PIXI.Graphics();
        graphic.beginFill(0x888888);
        graphic.drawRect(0, 0, event.beats, 100);
        graphic.endFill();
        graphic.x = event.beat;
        graphic.y = event.data.pitch;
        this.$refs.graph.container.addChild(graphic);
        this.$watch(`events.${event.id}`, event => {
          graphic.x = event.beat;
          graphic.y = event.data.pitch;
        });
      });
    });
  },
  methods: {}
};
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
}
</style>
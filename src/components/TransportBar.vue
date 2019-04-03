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
  data: () => ({
    eventGraphics: {}
  }),
  computed: {
    bounds() {
      return [this.songStart, 3000, this.songEnd, -5000];
    },
    ...mapState(["songStart", "songEnd", "viewStart", "viewEnd", "events"])
  },
  watch: {
    events: {
      handler(events) {
        for (let eventId of Object.keys(events)) {
          let eventGraphic = this.eventGraphics[eventId];
          let event = this.events[eventId];
          if (!eventGraphic) {
            eventGraphic = new window.PIXI.Graphics();
            eventGraphic.beginFill(0x888888);
            eventGraphic.drawRect(0, 0, event.beats, 100);
            eventGraphic.endFill();
            this.$refs.graph.container.addChild(eventGraphic);
            this.eventGraphics[eventId] = eventGraphic;
          }
          eventGraphic.x = event.beat;
          eventGraphic.y = event.data.pitch;
        }
        for (let eventId of Object.keys(this.eventGraphics)) {
          if (this.events[eventId]) continue;
          this.$refs.graph.container.removeChild(this.eventGraphics[eventId]);
        }
      },
      deep: true
    }
  },
  mounted() {
    requestAnimationFrame(() => {
      const container = this.$refs.graph.container;

      // Object.values(this.events).forEach(event => {
      //   const graphic = new window.PIXI.Graphics();
      //   graphic.beginFill(0x888888);
      //   graphic.drawRect(0, 0, event.beats, 100);
      //   graphic.endFill();
      //   graphic.x = event.beat;
      //   graphic.y = event.data.pitch;
      //   this.$refs.graph.container.addChild(graphic);
      //   this.$watch(`events.${event.id}`, event => {
      //     graphic.x = event.beat;
      //     graphic.y = event.data.pitch;
      //   });
      // });

      let viewStart = new window.PIXI.Graphics();
      viewStart.beginFill(0x888888, 0.1);
      viewStart.drawRect(0, -10000, 1, 20000);
      viewStart.x = this.viewStart;
      viewStart.scale.set(this.viewEnd - this.viewStart, 1);
      this.$refs.graph.container.addChild(viewStart);
      this.$watch(`viewStart`, beat => {
        viewStart.x = beat;
      });
    });
  },
  methods: {
    updateViewfinder() {}
  }
};
</script>

<style scoped>
.root {
  width: 100%;
  height: 100%;
}
</style>
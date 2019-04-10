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
  props: {
    curveId: {
      type: String,
      required: true
    }
  },
  data: () => ({
    graphics: {}
  }),
  computed: {
    bounds() {
      return [-1, 5, 17, -1];
    },
    points() {
      return this.$store.state.curves[this.curveId].points;
    },
    container() {
      return this.$refs.graph.container;
    },
    ...mapState([
      "songStart",
      "songEnd",
      "viewStart",
      "viewEnd",
      "pianoRollTop",
      "pianoRollBottom"
    ])
  },
  watch: {
    points: {
      handler(points) {
        // for (let eventId of Object.keys(events)) {
        //   let eventGraphic = this.eventGraphics[eventId];
        //   let event = this.events[eventId];
        //   if (!eventGraphic) {
        //     eventGraphic = new window.PIXI.Graphics();
        //     eventGraphic.beginFill(0x888888);
        //     eventGraphic.drawRect(0, 0, event.beats, 100);
        //     eventGraphic.endFill();
        //     this.$refs.graph.container.addChild(eventGraphic);
        //     this.eventGraphics[eventId] = eventGraphic;
        //   }
        //   eventGraphic.x = event.beat;
        //   eventGraphic.y = event.data.pitch;
        // }
        // for (let eventId of Object.keys(this.eventGraphics)) {
        //   if (this.events[eventId]) continue;
        //   this.$refs.graph.container.removeChild(this.eventGraphics[eventId]);
        // }
      },
      deep: true
    }
  },
  mounted() {
    this.updatePoints();
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
    // let viewStart = new window.PIXI.Graphics();
    // viewStart.beginFill(0x888888, 0.1);
    // viewStart.drawRect(0, -10000, 1, 20000);
    // viewStart.x = this.viewStart;
    // viewStart.scale.set(this.viewEnd - this.viewStart, 1);
    // this.$refs.graph.container.addChild(viewStart);
    // this.$watch(`viewStart`, beat => {
    //   viewStart.x = beat;
    // });
  },
  methods: {
    updatePoints() {
      this.container.removeChildren();
      const graphic = new window.PIXI.Graphics();
      graphic.lineStyle(1 / this.$refs.graph.pxPerX / 10, 0xffffff, 1);
      graphic.moveTo(this.bounds[0], this.points[0].value);

      let previousPoint = {
        ...this.points[this.points.length - 1],
        beat: this.points[0].value
      };
      for (let i = 1; i < this.points.length - 1; i++) {
        const thisPoint = this.points[i];
        this.drawSegment(previousPoint, thisPoint, graphic);
        previousPoint = thisPoint;
      }

      let lastPoint = this.points[this.points.length - 1];
      this.drawSegment(
        previousPoint,
        { ...lastPoint, beat: this.bounds[2] },
        graphic
      );
      // for (let i = 0; i < this.points.length; i++) {
      //   const thisPoint = this.points[i];
      //   const circle = new window.PIXI.Graphics();

      //   circle.beginFill(0x555555);
      //   circle.drawCircle(thisPoint.beat, thisPoint.value, 10);
      //   circle.endFill();

      //   circle.scale.set(this.$refs.graph.pxPerX, this.$refs.graph.pxPerY);
      //   this.container.addChild(circle);
      // }

      this.container.addChild(graphic);
    },
    drawSegment(from, to, graphic) {
      if (to.type === "flat") {
        graphic.lineTo(from.beat, from.value);
        graphic.lineTo(from.beat, to.value);
      }
    },
    addPoint() {
      this.$store;
    }
  }
};
</script>

<style scoped>
.root {
  height: 100%;
  width: 100%;
}
</style>
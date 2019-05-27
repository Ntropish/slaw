<template>
  <div>
    <div class="menu-panel icon-button" @mousedown="onMouseDown">
      <font-awesome-icon class="menu-icon" icon="bars"/>
    </div>
    <div v-if="open" class="menu">
      <div class="project-toolbar">
        {{$store.state._id}}
        <font-awesome-icon class="icon-button" icon="save" @mousedown="saveProject"/>
        <font-awesome-icon class="icon-button" icon="plus-circle" @mousedown="addProject"/>
      </div>
      <h3>Open Project</h3>
      <div
        v-for="project in projects"
        :key="project._id"
        class="project-list-item"
        @click="loadProject(project._id)"
      >{{project._id}}</div>
    </div>
  </div>
</template>

<script>
import { getAll } from "backendApi/project";
import { mapActions } from "vuex";
import { put, post } from "backendApi/project";

export default {
  data: () => ({
    open: true,
    projectsAreLoaded: false,
    projects: []
  }),
  async mounted() {
    // Click off handler
    window.addEventListener("mousedown", this.onWindowMouseDown);
    this.loadProjects();
  },
  beforeDestroy() {
    window.removeEventListener("mousedown", this.onWindowMouseDown);
  },
  methods: {
    onMouseDown() {
      // Tasks needed to toggle "open" state
      this.open = !this.open;
      if (this.open) this.loadProjects();
    },
    onWindowMouseDown(e) {
      if (!e.target.closest(".menu") && !e.target.closest(".menu-panel")) {
        this.open = false;
      }
    },
    async loadProjects(e) {
      this.projectsAreLoaded = false;
      const response = await getAll();

      this.projects = response.data;
      this.projectsAreLoaded = true;
    },
    async saveProject() {
      const result = await put(this.$store.state);
      console.log(`save result: `, result);
    },
    async addProject() {
      const result = await post();
      console.log(result);
    },
    ...mapActions(["loadProject"])
  }
};
</script>


<style scoped>
.icon-button {
  padding: 0.4em;
  background: hsla(0, 0%, 100%, 0.05);
  border-radius: 2.5px;
  font-size: 2.5em;
  color: hsla(0, 0%, 100%, 0.1);
  line-height: 0em;
}
.icon-button:hover {
  color: hsla(0, 0%, 100%, 0.15);
}
.menu-panel {
  position: fixed;
  top: 0;
  left: 0;
  margin: 0.4em;
  z-index: 10;
}

.menu-panel:hover {
  background: hsla(0, 0%, 100%, 0.1);
}

.menu {
  position: fixed;
  width: 40vw;
  height: 100%;
  top: 0;
  left: 0;
  color: var(--primary-text);
  background: hsla(0, 0%, 15%, 1);
  z-index: 11;
  box-shadow: 0 0 6vw hsla(0, 0%, 0%, 0.4);
  display: flex;
  flex-direction: column;
}

.menu > * {
  margin: 0.5em;
}

.new-project-button {
  font-size: 2em;
}

.project-list-item {
  padding: 0.8em;
  user-select: none;
}
.project-list-item:hover {
  padding: 0.8em;
  background: var(--shaded-background);
}
.project-list-item.open {
  padding: 0.8em;
  background: var(--tinted-background);
}

.project-toolbar {
  display: flex;
  justify-content: space-around;
}

.project-toolbar > * {
  margin: 0.1em;
}
</style>
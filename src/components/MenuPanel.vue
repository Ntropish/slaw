<template>
  <div>
    <div class="menu-panel bright-icon-button" @mousedown="onMouseDown">
      <font-awesome-icon class="menu-icon" icon="bars"/>
    </div>
    <div v-if="open" class="menu">
      <!-- <div v-if="user.profile">{{profile.nickname}}</div> -->
      <id-panel/>
      <div class="project-toolbar">
        {{$store.state._id}}
        <font-awesome-icon class="bright-icon-button" icon="save" @mousedown="saveProject"/>
        <font-awesome-icon class="bright-icon-button" icon="plus-circle" @mousedown="addProject"/>
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
import { mapActions, mapState } from "vuex";
import { put, post } from "backendApi/project";
import auth from "../auth0";
import IdPanel from "./IdPanel.vue";

export default {
  components: {
    IdPanel
  },
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
      await this.$store.state.userLoaded;
      this.projectsAreLoaded = false;
      const response = await getAll();

      this.projects = response.data;
      this.projectsAreLoaded = true;
    },
    async saveProject() {
      const result = await put(this.$store.state);
    },
    async addProject() {
      const result = await post();

      // Reload projects
      this.projectsAreLoaded = false;
      const response = await getAll();
      this.projects = response.data;
      this.projectsAreLoaded = true;
    },
    async login() {
      const result = await auth.authorize();
    },
    ...mapActions(["loadProject"])
  },
  computed: {
    ...mapState(["user"]),
    displayName() {
      return this.user && this.user.profile && this.user.profile.nickname;
    }
  }
};
</script>


<style scoped>
@media (max-width: 1200px) {
  .menu {
    width: 100%;
  }
}
@media (min-width: 1201px) {
  .menu {
    width: 40vw;
    max-width: 40em;
  }
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
  height: 100%;
  top: 0;
  left: 0;
  color: var(--primary-text);
  background: hsla(0, 0%, 15%, 1);
  z-index: 11;
  box-shadow: 0 0 2vw hsla(0, 0%, 0%, 0.3);
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
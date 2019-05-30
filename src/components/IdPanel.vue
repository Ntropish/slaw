<template>
  <div class="card">
    <div v-if="!loaded">Loading...</div>
    <div
      v-if="loaded && (!user || (user && !user.profile))"
      class="login-button bright-button"
      @click="login"
    >Login</div>
    <div v-if="loaded && (user && user.profile)" class="logged-in-card">
      <div class="card-image">
        <img :src="user.profile.picture">
      </div>
      <div class="details">
        <h3>{{user.profile.nickname}}</h3>
        <span>{{user.profile.email}}</span>
      </div>
      <div class="tools">
        <div class="tool-button bright-button" @click="logout">Logout</div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapActions, mapState } from "vuex";
import auth from "../auth0";

export default {
  data: () => ({}),
  computed: {
    ...mapState(["user"]),
    loaded() {
      return this.user.loaded;
    }
  },
  methods: {
    async login() {
      const result = await auth.authorize();
    },
    ...mapActions(["logout"])
  }
};
</script>

<style>
.card {
  box-shadow: 0 0 1vw hsla(0, 0%, 0%, 0.3);
  height: 16vh;
}

.card > div {
  display: flex;
}

.card-image {
  max-height: 16vh;
  min-width: 0;
}

.card-image > img {
  max-height: 16vh;
  min-width: 0;
}

.logged-in-card {
  animation: fadein 0.2s;
}

.details {
  margin: 0.5em;
  flex-grow: 1;
}

.tools {
  width: 10vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.login-button {
  font-size: 3em;
  font-weight: 100;
  color: hsla(0, 0%, 100%, 0.4);
  justify-content: space-around;
  align-items: center;
}

.tool-button {
  height: 4vh;
  margin: 0.5em;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>
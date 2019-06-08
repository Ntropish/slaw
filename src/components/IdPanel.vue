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
  data: () => ({
    loaded: false
  }),
  computed: {
    ...mapState(["user"])
  },
  async mounted() {
    await this.$store.state.userLoaded;
    this.loaded = true;
  },
  methods: {
    async login() {
      // Using audience: "server" will get the idToken as a jwt
      // we can use to authenticate with our api, known as "server" to auth0
      const result = await auth.authorize({ audience: "server" });
    },
    ...mapActions(["logout"])
  }
};
</script>

<style>
.card {
  box-shadow: 0 0 1vw hsla(0, 0%, 0%, 0.3);
  height: 10em;
}

.card > div {
  display: flex;
}

.card-image {
  max-height: 10em;
  min-width: 0;
}

.card-image > img {
  height: 10em;
  min-width: 0;
}

.logged-in-card {
  animation: fadein 0.2s;
}

.details {
  margin: 0.5em;
  flex-grow: 1;
  background: var(--primary-background);
  padding: 0.5em;
}

.tools {
  width: 10vw;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  flex: 0 0 10em;
}

.login-button {
  font-size: 3em;
  font-weight: 100;
  color: hsla(0, 0%, 100%, 0.4);
  justify-content: space-around;
  align-items: center;
  width: 100%;
  height: 100%;
}

.tool-button {
  height: 4vh;
  margin: 0.5em;
  display: flex;
  justify-content: space-around;
  align-items: center;
}
</style>
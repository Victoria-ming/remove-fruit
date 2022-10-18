<template>
  <div class="home">
    <el-button type="primary" @click="goGamePage('easyGameConfig')"
      >第一关</el-button
    >
    <el-button type="primary" @click="goGamePage('defaultConfig')"
      >第二关</el-button
    >
  </div>
</template>

<script>
export default {
  name: "HomeView",
  components: {},
  methods: {
    goGamePage(type) {
      this.$router.push({
        name: "gamePage",
        query: {
          config: type,
        },
      });
    },
  },
};
</script>

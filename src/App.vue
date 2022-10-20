<template>
  <div id="app">
    <div class="content">
      <router-view />
    </div>
  </div>
</template>
<script setup lang="ts"></script>
<style scoped>
#app {
  min-height: 100vh;
}

.content {
  max-width: 480px;
  margin: 0 auto;
}
</style>

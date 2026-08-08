<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router' // Явный импорт, чтобы Vite точно понял
</script>

<style>
/* Базовые стили для всего приложения */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f5f7;
  color: #1c1c1e;
  -webkit-font-smoothing: antialiased;
}
#app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #ffffff;
  box-shadow: 0 0 20px rgba(0,0,0,0.05);
}
</style>
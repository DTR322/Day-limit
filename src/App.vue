<script setup>
import { RouterView } from 'vue-router'
</script>

<template>
  <div id="app">
    <RouterView />
  </div>
</template>

<style>
/* Глобальные стили вынесены в style.css */
#app {
  max-width: 480px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: #ffffff;
  box-shadow: 0 0 20px rgba(0,0,0,0.05);
}
</style>
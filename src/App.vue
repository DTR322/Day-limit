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
  width: 100%;
  max-width: 520px;
  margin: 0 auto;
  min-height: 100vh;
  background-color: var(--color-bg-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}
</style>
import { createRouter, createWebHistory } from 'vue-router'
import MainScreen from '../components/MainScreen.vue'
import StartScreen from '../components/StartScreen.vue'

const routes = [
  {
    path: '/',
    name: 'MainScreen',
    component: MainScreen
  },
  {
    path: '/settings',
    name: 'StartScreen',
    component: StartScreen
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
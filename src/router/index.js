import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import OnboardingContainer from '../components/onboarding/OnboardingContainer.vue'

const routes = [
  {
    path: '/',
    name: 'MainView',
    component: MainView
  },
  {
    path: '/settings',
    name: 'Onboarding',
    component: OnboardingContainer
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
import { createRouter, createWebHistory } from 'vue-router'
import MainView from '../views/MainView.vue'
import OnboardingContainer from '../components/onboarding/OnboardingContainer.vue'
import SettingsView from '../views/SettingsView.vue'

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
  },
  {
    path: '/salary-settings',
    name: 'SalarySettings',
    component: SettingsView
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
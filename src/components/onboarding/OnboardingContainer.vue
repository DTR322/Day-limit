<template>
  <div class="onboarding-container">
    <!-- Прогресс-бар -->
    <div class="progress-section">
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: (currentStep / TOTAL_STEPS) * 100 + '%' }"></div>
      </div>
      <div class="progress-dots">
        <div 
          v-for="i in TOTAL_STEPS" 
          :key="i" 
          class="dot" 
          :class="{ active: i <= currentStep, current: i === currentStep }"
        ></div>
      </div>
    </div>

    <!-- Экраны с анимацией -->
    <transition name="slide" mode="out-in">
      <component
        :is="currentStepComponent"
        :key="currentStep"
        v-model="onboardingData"
        ref="stepComponent"
      />
    </transition>

    <!-- Навигация -->
    <div class="navigation">
      <button v-if="currentStep > 1" class="btn-back" @click="prev">← Назад</button>
      <button v-if="currentStep < TOTAL_STEPS" class="btn-next" @click="next" :disabled="!canProceed">
        Дальше
      </button>
      <button v-if="currentStep === TOTAL_STEPS" class="btn-finish" @click="finish">
        Начать пользоваться
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import IncomeStep from './IncomeStep.vue'
import ExpensesStep from './ExpensesStep.vue'
import SummaryStep from './SummaryStep.vue'
import GoalStep from './GoalStep.vue'
import ResultStep from './ResultStep.vue'

const router = useRouter()

const TOTAL_STEPS = 5
const DEFAULT_DAYS_TO_SALARY = 30

// Компоненты для каждого шага
const STEP_COMPONENTS = {
  1: IncomeStep,
  2: ExpensesStep,
  3: SummaryStep,
  4: GoalStep,
  5: ResultStep
}

const currentStep = ref(1)
const stepComponent = ref(null)

// Единое состояние для всех шагов
const onboardingData = ref({
  income: 0,
  expenses: {
    rent: 0,
    utilities: 0,
    food: 0,
    transport: 0,
    credits: 0
  },
  totalDebt: 0,     // сколько всего должен
  totalSavings: 0,   // сколько уже накопил
  customExpenses: [],
  selectedGoal: null,
  goalAmount: 0,
  savingsPercent: 0,
  customGoalName: ''
})

const currentStepComponent = computed(() => STEP_COMPONENTS[currentStep.value])

const canProceed = computed(() => {
  if (currentStep.value === 1) {
    return onboardingData.value.income > 0
  }
  return true
})

function next() {
  if (currentStep.value < TOTAL_STEPS) {
    currentStep.value++
  }
}

function prev() {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

function finish() {
  const today = new Date()
  const settings = {
    income: Number(onboardingData.value.income) || 0,
    rent: Number(onboardingData.value.expenses.rent) || 0,
    utilities: Number(onboardingData.value.expenses.utilities) || 0,
    food: Number(onboardingData.value.expenses.food) || 0,
    transport: Number(onboardingData.value.expenses.transport) || 0,
    credits: Number(onboardingData.value.expenses.credits) || 0,
    customExpenses: onboardingData.value.customExpenses,
    savings: Number(onboardingData.value.savingsPercent) || 0,
    goal: onboardingData.value.selectedGoal,
    goalAmount: Number(onboardingData.value.goalAmount) || 0,
    totalSavings: Number(onboardingData.value.totalSavings) || 0,
    totalDebt: Number(onboardingData.value.totalDebt) || 0,
    // Новые поля для автоматического пересчёта
    lastPayday: today.toISOString().split('T')[0], // YYYY-MM-DD
    payCycle: 30 // дней между зарплатами
  }

  localStorage.setItem('daylimit-settings', JSON.stringify(settings))
  router.push('/')
}
</script>

<style scoped>
.onboarding-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Прогресс */
.progress-section {
  margin-bottom: 32px;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.4s ease;
}

.progress-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.dot.active {
  background: rgba(255, 255, 255, 0.7);
}

.dot.current {
  background: white;
  transform: scale(1.3);
}

/* Анимация переходов */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* Навигация */
.navigation {
  margin-top: auto;
  padding-top: 32px;
  display: flex;
  justify-content: center;
  gap: 16px;
}

.btn-back,
.btn-next,
.btn-finish {
  padding: 16px 32px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-back {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-back:hover {
  background: rgba(255, 255, 255, 0.2);
}

.btn-next,
.btn-finish {
  background: white;
  color: #1e1b4b;
}

.btn-next:hover,
.btn-finish:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
}

.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}
</style>

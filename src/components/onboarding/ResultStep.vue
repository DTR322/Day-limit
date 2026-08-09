<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Готово</span>
      <h2>Сегодня можно<br>потратить</h2>
    </div>
    
    <div class="result-section" :class="{ 'is-deficit': monthlyDeficit > 0 }">
      <div v-if="monthlyDeficit > 0" class="deficit-hero-icon">⚠️</div>
      <div class="hero-number" :class="{ 'is-negative': monthlyDeficit > 0 }">
        {{ formatMoney(monthlyDeficit > 0 ? dailyLimit : dailyLimit) }}
      </div>
      <div class="hero-currency">{{ monthlyDeficit > 0 ? 'рублей нужно откладывать в день' : 'рублей' }}</div>
      <p v-if="monthlyDeficit > 0" class="result-debt-hint">
        При ежемесячном дефиците {{ formatMoney(monthlyDeficit) }} ₽<br>
        Нужно откладывать {{ formatMoney(dailyLimit) }} ₽ ежедневно
      </p>
      <p v-else class="result-hint">
        При доходе {{ formatMoney(income) }} ₽ и цели {{ selectedGoal ? formatMoney(goalAmount) + ' ₽' : 'нет' }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const DEFAULT_DAYS_TO_SALARY = 30

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

const income = computed(() => Number(props.modelValue.income) || 0)
const totalExpenses = computed(() => {
  const base = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})
const freeMoney = computed(() => {
  const income = Number(props.modelValue.income) || 0
  const totalExpenses = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return income - totalExpenses - custom
})
const monthlyDeficit = computed(() => {
  const diff = totalExpenses.value - income.value
  return diff > 0 ? diff : 0
})
const goalMonthly = computed(() => {
  // Если есть дефицит, цели не применяются
  if (freeMoney.value < 0) return 0
  if (!props.modelValue.selectedGoal) return 0
  return freeMoney.value * (props.modelValue.savingsPercent / 100)
})
const dailyLimit = computed(() => {
  // Если расходы превышают доходы - показываем ежедневный долг
  if (freeMoney.value < 0) {
    return Math.ceil(Math.abs(freeMoney.value) / DEFAULT_DAYS_TO_SALARY)
  }
  const remainingAfterGoal = freeMoney.value - goalMonthly.value
  return Math.max(0, Math.floor(remainingAfterGoal / DEFAULT_DAYS_TO_SALARY))
})
const selectedGoal = computed(() => props.modelValue.selectedGoal)
const goalAmount = computed(() => props.modelValue.goalAmount)
</script>

<script>
import { computed } from 'vue'
</script>

<style scoped>
.onboarding-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
}

.step-header {
  margin-bottom: 32px;
}

.step-label {
  display: block;
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 16px;
  text-transform: uppercase;
  letter-spacing: 1px;
}

h2 {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.3;
  margin: 0;
  max-width: 400px;
}

.result-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-number {
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
  margin: 16px 0;
}

.hero-currency {
  font-size: 20px;
  opacity: 0.8;
  margin-bottom: 32px;
}

.result-hint {
  font-size: 14px;
  opacity: 0.6;
  max-width: 300px;
  line-height: 1.5;
}
</style>

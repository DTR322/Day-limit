<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Шаг 4 из 5</span>
      <h2>Копишь на что-то?</h2>
    </div>

    <div class="goals-list">
      <button
        v-for="g in PRESET_GOALS"
        :key="g.id"
        class="goal-btn"
        :class="{ selected: modelValue.selectedGoal === g.id }"
        @click="selectGoal(g.id)"
      >
        <span class="goal-icon">{{ g.icon }}</span>
        <span class="goal-name">{{ g.name }}</span>
        <span v-if="g.recommended" class="badge">Рекомендуем</span>
      </button>
    </div>

    <!-- Сумма цели (редактируемая) -->
    <div v-if="modelValue.selectedGoal" class="goal-amount-wrapper">
      <label>Сумма цели</label>
      <div class="input-wrapper small">
        <input
          type="number"
          :value="modelValue.goalAmount"
          @input="emitUpdate('goalAmount', $event.target.value)"
          placeholder="0"
          inputmode="numeric"
        />
        <span class="currency">₽</span>
      </div>
    </div>

    <button class="skip-btn" @click="skipGoal">Пропустить</button>

    <!-- Слайдер процента -->
    <div v-if="modelValue.selectedGoal" class="slider-section">
      <label>
        Направляешь на цель:
        <span class="percent-value">{{ modelValue.savingsPercent }}%</span>
      </label>
      <input
        type="range"
        :value="modelValue.savingsPercent"
        @input="emitUpdate('savingsPercent', $event.target.value)"
        min="0"
        max="100"
        step="5"
      />

      <!-- Живые числа -->
      <div class="live-stats">
        <div class="stat">
          <div class="stat-value">{{ goalMonthsText }}</div>
          <div class="stat-label">Срок достижения</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{ formatMoney(dailyLimit) }} ₽</div>
          <div class="stat-label">Можно тратить в день</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const PRESET_GOALS = [
  { id: 'safety', name: 'Подушка безопасности', icon: '🛡️', recommended: true, defaultAmount: null },
  { id: 'car', name: 'Машина', icon: '🚗', recommended: false, defaultAmount: 1500000 },
  { id: 'vacation', name: 'Отпуск', icon: '✈️', recommended: false, defaultAmount: 100000 }
]

const DEFAULT_DAYS_TO_SALARY = 30

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function emitUpdate(field, value) {
  const newValue = { ...props.modelValue, [field]: Number(value) || 0 }
  emit('update:modelValue', newValue)
}

function selectGoal(goalId) {
  const goal = PRESET_GOALS.find(g => g.id === goalId)
  let newGoalAmount = 0
  
  if (goal.defaultAmount !== null) {
    newGoalAmount = goal.defaultAmount
  } else {
    // Подушка безопасности = 3 обязательных расхода
    const totalExpenses = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0) +
                          props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    newGoalAmount = totalExpenses * 3
  }
  
  emit('update:modelValue', {
    ...props.modelValue,
    selectedGoal: goalId,
    goalAmount: newGoalAmount,
    savingsPercent: 20
  })
}

function skipGoal() {
  emit('update:modelValue', {
    ...props.modelValue,
    selectedGoal: null,
    goalAmount: 0,
    savingsPercent: 0
  })
}

// Вычисляемые значения
const freeMoney = computed(() => {
  const income = Number(props.modelValue.income) || 0
  const totalExpenses = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0) +
                        props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return Math.max(0, income - totalExpenses)
})

const goalMonthly = computed(() => {
  if (!props.modelValue.selectedGoal) return 0
  return freeMoney.value * (props.modelValue.savingsPercent / 100)
})

const goalMonths = computed(() => {
  if (!props.modelValue.selectedGoal || goalMonthly.value === 0) return null
  return Math.ceil(props.modelValue.goalAmount / goalMonthly.value)
})

const goalMonthsText = computed(() => {
  if (goalMonths.value === null) return '—'
  if (goalMonths.value < 12) return goalMonths.value + ' мес'
  const years = Math.floor(goalMonths.value / 12)
  const months = goalMonths.value % 12
  if (months === 0) return years + ' г'
  return years + ' г ' + months + ' мес'
})

const dailyLimit = computed(() => {
  const remainingAfterGoal = freeMoney.value - goalMonthly.value
  return Math.max(0, Math.floor(remainingAfterGoal / DEFAULT_DAYS_TO_SALARY))
})

// Автопересчёт подушки безопасности при изменении расходов
watch(
  () => ({
    expenses: props.modelValue.expenses,
    customExpenses: props.modelValue.customExpenses
  }),
  (newVal) => {
    if (props.modelValue.selectedGoal === 'safety') {
      const totalExpenses = Object.values(newVal.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0) +
                            newVal.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
      emit('update:modelValue', {
        ...props.modelValue,
        goalAmount: totalExpenses * 3
      })
    }
  },
  { deep: true }
)
</script>

<script>
import { computed, watch } from 'vue'
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

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}

.goal-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.goal-btn.selected {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.goal-icon {
  font-size: 24px;
}

.goal-name {
  flex: 1;
}

.badge {
  padding: 4px 8px;
  background: #10b981;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.goal-amount-wrapper {
  margin-bottom: 16px;
}

.goal-amount-wrapper label {
  display: block;
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.input-wrapper.small {
  position: relative;
  width: 100%;
  max-width: 240px;
  margin: 0 auto;
}

input[type="number"] {
  width: 100%;
  padding: 16px;
  font-size: 24px;
  font-weight: 700;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  color: white;
  outline: none;
  transition: border-color 0.2s;
}

input[type="number"]:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.currency {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
}

/* Remove default browser arrows from number inputs */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

.skip-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 24px;
}

.skip-btn:hover {
  color: white;
}

.slider-section {
  width: 100%;
  max-width: 400px;
}

.slider-section label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.percent-value {
  font-size: 24px;
  color: #fbbf24;
}

input[type="range"] {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  margin-bottom: 24px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

.live-stats {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.stat {
  flex: 1;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.7;
}
</style>

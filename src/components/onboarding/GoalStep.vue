<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Шаг 4 из 5</span>
      <h2>На что копишь?</h2>
    </div>

    <div class="goals-list">
      <!-- Подушка безопасности -->
      <div
        class="goal-option"
        :class="{ active: modelValue.selectedGoal === 'safety' }"
        @click="selectGoal('safety')"
      >
        <div class="goal-icon">🛡️</div>
        <div class="goal-info">
          <span class="goal-name">Подушка безопасности</span>
          <span class="goal-desc">{{ safetyTarget > 0 ? formatMoney(safetyTarget) + ' ₽' : 'Подушка уже собрана' }}</span>
        </div>
        <span class="badge">Рекомендуем</span>
      </div>

      <!-- Машина -->
      <div
        class="goal-option"
        :class="{ active: modelValue.selectedGoal === 'car' }"
        @click="selectGoal('car')"
      >
        <div class="goal-icon">🚗</div>
        <div class="goal-info">
          <span class="goal-name">Машина</span>
          <span class="goal-desc">например, 1 500 000 ₽</span>
        </div>
      </div>

      <!-- Отпуск -->
      <div
        class="goal-option"
        :class="{ active: modelValue.selectedGoal === 'vacation' }"
        @click="selectGoal('vacation')"
      >
        <div class="goal-icon">✈️</div>
        <div class="goal-info">
          <span class="goal-name">Отпуск</span>
          <span class="goal-desc">например, 100 000 ₽</span>
        </div>
      </div>

      <!-- Закрыть долги — показываем только если долги есть -->
      <div
        v-if="debtTarget > 0"
        class="goal-option"
        :class="{ active: modelValue.selectedGoal === 'debt' }"
        @click="selectGoal('debt')"
      >
        <div class="goal-icon">📉</div>
        <div class="goal-info">
          <span class="goal-name">Закрыть долги</span>
          <span class="goal-desc">{{ formatMoney(debtTarget) }} ₽</span>
        </div>
      </div>

      <!-- Своя цель -->
      <div
        class="goal-option custom"
        :class="{ active: modelValue.selectedGoal === 'custom' }"
        @click="selectGoal('custom')"
      >
        <div class="goal-icon">✨</div>
        <div class="goal-info" v-if="modelValue.selectedGoal !== 'custom'">
          <span class="goal-name">Своя цель</span>
          <span class="goal-desc">Например: ремонт, свадьба</span>
        </div>
        <div class="goal-input-wrapper" v-else>
          <input
            type="text"
            :value="modelValue.customGoalName"
            @input="emitUpdateString('customGoalName', $event.target.value)"
            placeholder="Название цели"
            class="custom-goal-input"
            autofocus
          />
        </div>
      </div>
    </div>

    <!-- Редактируемая сумма цели -->
    <div v-if="modelValue.selectedGoal" class="goal-amount-wrapper">
      <label>Сколько нужно накопить:</label>
      <div class="amount-input-wrapper">
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

    <!-- Слайдер процента -->
    <div v-if="modelValue.selectedGoal && freeMoney >= 0" class="slider-section">
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

    <!-- Если дефицит -->
    <div v-if="modelValue.selectedGoal && freeMoney < 0" class="debt-warning-section">
      <div class="debt-warning-icon">⚠️</div>
      <div class="debt-warning-title">Расходы превышают доход</div>
      <div class="debt-warning-text">
        Ежемесячный дефицит: <strong>{{ formatMoney(Math.abs(freeMoney)) }} ₽</strong>.<br>
        Сначала закрой дыру в бюджете — потом цели.
      </div>
    </div>
  </div>
</template>

<script setup>
import {computed, ref, watch} from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const DEFAULT_DAYS_TO_SALARY = 30

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function emitUpdate(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: Number(value) || 0 })
}

function emitUpdateString(field, value) {
  const strValue = value != null ? String(value) : '';
  emit('update:modelValue', { ...props.modelValue, [field]: strValue });
}

// Сумма всех обязательных расходов
const totalExpenses = computed(() => {
  const base = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})

const freeMoney = computed(() => (Number(props.modelValue.income) || 0) - totalExpenses.value)

// Подушка = 3 расхода минус то, что уже накоплено
const safetyTarget = computed(() => {
  const base = totalExpenses.value * 3
  const already = Number(props.modelValue.totalSavings) || 0
  return Math.max(0, base - already)
})

// Долги = то, что человек указал сам на шаге 3
const debtTarget = computed(() => Number(props.modelValue.totalDebt) || 0)

function selectGoal(goalId) {
  const defaults = {
    safety: safetyTarget.value,
    car: 1500000,
    vacation: 100000,
    debt: debtTarget.value,
    custom: props.modelValue.goalAmount || 100000
  }

  emit('update:modelValue', {
    ...props.modelValue,
    selectedGoal: goalId,
    goalAmount: defaults[goalId],
    savingsPercent: props.modelValue.savingsPercent || 20
  })
}

const goalMonthly = computed(() => {
  if (freeMoney.value < 0 || !props.modelValue.selectedGoal) return 0
  return freeMoney.value * ((Number(props.modelValue.savingsPercent) || 0) / 100)
})

const goalMonths = computed(() => {
  if (freeMoney.value < 0 || !props.modelValue.selectedGoal || goalMonthly.value === 0) return null
  return Math.ceil((Number(props.modelValue.goalAmount) || 0) / goalMonthly.value)
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
  if (freeMoney.value < 0) {
    return Math.ceil(Math.abs(freeMoney.value) / DEFAULT_DAYS_TO_SALARY)
  }
  const remainingAfterGoal = freeMoney.value - goalMonthly.value
  return Math.max(0, Math.floor(remainingAfterGoal / DEFAULT_DAYS_TO_SALARY))
})
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

.goal-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.goal-option.active {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.goal-option.custom {
  flex-direction: column;
  align-items: stretch;
}

.goal-icon {
  font-size: 24px;
}

.goal-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.goal-name {
  font-weight: 600;
  font-size: 16px;
}

.goal-desc {
  font-size: 13px;
  opacity: 0.7;
  margin-top: 2px;
}

.badge {
  padding: 4px 8px;
  background: #10b981;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  color: white;
}

.goal-input-wrapper {
  margin-top: 12px;
  width: 100%;
}

.custom-goal-input {
  width: 100%;
  padding: 12px;
  font-size: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: white;
  outline: none;
  box-sizing: border-box;
}

.custom-goal-input:focus {
  border-color: rgba(255, 255, 255, 0.6);
}

.custom-goal-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.goal-amount-wrapper {
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}

.goal-amount-wrapper label {
  display: block;
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.amount-input-wrapper {
  position: relative;
  max-width: 240px;
  margin: 0 auto;
}

.amount-input-wrapper input {
  width: 100%;
  padding: 14px 40px 14px 14px;
  font-size: 22px;
  font-weight: 700;
  text-align: right;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  outline: none;
  box-sizing: border-box;
}

.amount-input-wrapper input:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

.currency {
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
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

.debt-warning-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px;
  background: rgba(239, 68, 68, 0.15);
  border: 2px solid rgba(239, 68, 68, 0.4);
  border-radius: 16px;
  margin-top: 8px;
  width: 100%;
  max-width: 400px;
}

.debt-warning-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.debt-warning-title {
  font-size: 18px;
  font-weight: 700;
  color: #ef4444;
  margin-bottom: 8px;
}

.debt-warning-text {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  text-align: center;
  line-height: 1.6;
}

.debt-warning-text strong {
  color: #ef4444;
  font-weight: 700;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
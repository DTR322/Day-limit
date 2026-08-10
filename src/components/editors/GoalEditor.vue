<template>
  <div class="editor-modal-overlay" @click="$emit('close')">
    <div class="editor-modal" @click.stop>
      <div class="editor-header">
        <h2>Финансовая цель</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="editor-content">
        <div class="input-group">
          <label class="input-label">Выберите цель</label>
          <div class="goals-list">
            <div
              v-for="goal in goalOptions"
              :key="goal.id"
              class="goal-option"
              :class="{ active: localGoal === goal.id }"
              @click="selectGoal(goal.id)"
            >
              <div class="goal-icon">{{ goal.icon }}</div>
              <div class="goal-info">
                <span class="goal-name">{{ goal.name }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="localGoal === 'custom'" class="input-group">
          <label class="input-label">Название цели</label>
          <input
            type="text"
            v-model="localCustomGoalName"
            placeholder="Например: Ремонт"
            class="editor-input text-input"
          />
        </div>

        <div class="input-group">
          <label class="input-label">Сумма цели</label>
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="localGoalAmount"
              placeholder="0"
              inputmode="numeric"
              class="editor-input"
            />
            <span class="currency">₽</span>
          </div>
        </div>

        <div class="input-group">
          <label class="input-label">
            Откладывать от свободных денег:
            <span class="percent-value">{{ localSavingsPercent }}%</span>
          </label>
          <input
            type="range"
            v-model.number="localSavingsPercent"
            min="0"
            max="100"
            step="5"
            class="percent-slider"
          />
          <div class="slider-hint">
            {{ formatMoney(monthlyContribution) }} ₽/мес будет откладываться
          </div>
        </div>

        <div v-if="freeMoney >= 0 && localGoalAmount > 0" class="projection-card">
          <div class="projection-title">Прогноз достижения</div>
          <div class="projection-value">{{ projectionText }}</div>
        </div>

        <div v-if="freeMoney < 0" class="warning-card">
          <div class="warning-icon">⚠️</div>
          <div class="warning-text">
            Расходы превышают доход на {{ formatMoney(Math.abs(freeMoney)) }} ₽/мес.<br>
            Сначала закройте дыру в бюджете.
          </div>
        </div>
      </div>
      
      <div class="editor-actions">
        <button class="cancel-btn" @click="$emit('close')">Отмена</button>
        <button class="save-btn" @click="save">Сохранить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

const props = defineProps({
  goal: {
    type: String,
    default: ''
  },
  goalAmount: {
    type: Number,
    default: 0
  },
  savingsPercent: {
    type: Number,
    default: 0
  },
  customGoalName: {
    type: String,
    default: ''
  },
  income: {
    type: Number,
    default: 0
  },
  expenses: {
    type: Object,
    default: () => ({})
  },
  customExpenses: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['close', 'save'])

const goalOptions = [
  { id: 'safety', name: 'Подушка безопасности', icon: '🛡️' },
  { id: 'car', name: 'Машина', icon: '🚗' },
  { id: 'vacation', name: 'Отпуск', icon: '✈️' },
  { id: 'debt', name: 'Закрыть долги', icon: '📉' },
  { id: 'custom', name: 'Своя цель', icon: '✨' }
]

const localGoal = ref(props.goal || '')
const localGoalAmount = ref(props.goalAmount || 0)
const localSavingsPercent = ref(props.savingsPercent || 0)
const localCustomGoalName = ref(props.customGoalName || '')

const totalExpenses = computed(() => {
  const base = Object.values(props.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})

const freeMoney = computed(() => (Number(props.income) || 0) - totalExpenses.value)

// В секции <script setup>
function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

const monthlyContribution = computed(() => {
  if (freeMoney.value < 0) return 0
  return freeMoney.value * (localSavingsPercent.value / 100)
})

const projectionText = computed(() => {
  if (monthlyContribution.value <= 0) return '—'
  const months = Math.ceil(localGoalAmount.value / monthlyContribution.value)
  if (months < 12) return `${months} мес`
  const years = Math.floor(months / 12)
  const remainingMonths = months % 12
  if (remainingMonths === 0) return `${years} г`
  return `${years} г ${remainingMonths} мес`
})

onMounted(() => {
  localGoal.value = props.goal || ''
  localGoalAmount.value = props.goalAmount || 0
  localSavingsPercent.value = props.savingsPercent || 0
  localCustomGoalName.value = props.customGoalName || ''
})

function selectGoal(goalId) {
  localGoal.value = goalId
  // Устанавливаем дефолтную сумму если ещё не выбрана
  if (localGoalAmount.value === 0) {
    const defaults = {
      safety: totalExpenses.value * 3,
      car: 1500000,
      vacation: 100000,
      debt: 0,
      custom: 100000
    }
    localGoalAmount.value = defaults[goalId] || 100000
  }
  if (localSavingsPercent.value === 0) {
    localSavingsPercent.value = 20
  }
}

function save() {
  emit('save', {
    goal: localGoal.value,
    goalAmount: localGoalAmount.value || 0,
    savingsPercent: localSavingsPercent.value || 0,
    customGoalName: localCustomGoalName.value
  })
}
</script>

<style scoped>
.editor-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.editor-modal {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 450px;
  max-height: 85vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background: white;
  z-index: 10;
}

.editor-header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  color: #6b7280;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #1f2937;
}

.editor-content {
  padding: 24px;
}

.input-group {
  margin-bottom: 20px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
}

.goals-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.goal-option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.goal-option.active {
  background: #eef2ff;
  border-color: #4f46e5;
}

.goal-option:hover {
  border-color: #a5b4fc;
}

.goal-icon {
  font-size: 24px;
}

.goal-info {
  flex: 1;
}

.goal-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.text-input {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  text-align: left;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.text-input:focus {
  border-color: #4f46e5;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.editor-input {
  width: 100%;
  padding: 14px 50px 14px 14px;
  font-size: 20px;
  font-weight: 700;
  text-align: right;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.editor-input:focus {
  border-color: #4f46e5;
}

.currency {
  position: absolute;
  right: 14px;
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
  pointer-events: none;
}

.percent-value {
  color: #4f46e5;
  font-size: 18px;
}

.percent-slider {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
}

.percent-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: #4f46e5;
  border-radius: 50%;
  cursor: pointer;
}

.slider-hint {
  font-size: 13px;
  color: #6b7280;
  margin-top: 8px;
}

.projection-card {
  background: linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%);
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-top: 16px;
}

.projection-title {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 8px;
}

.projection-value {
  font-size: 28px;
  font-weight: 700;
  color: #4f46e5;
}

.warning-card {
  background: #fee2e2;
  border: 1px solid #fecaca;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-top: 16px;
}

.warning-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.warning-text {
  font-size: 14px;
  color: #dc2626;
  line-height: 1.5;
}

.editor-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
  position: sticky;
  bottom: 0;
  background: white;
}

.cancel-btn,
.save-btn {
  flex: 1;
  padding: 14px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f3f4f6;
  color: #6b7280;
  border: none;
}

.cancel-btn:hover {
  background: #e5e7eb;
}

.save-btn {
  background: #4f46e5;
  color: white;
  border: none;
}

.save-btn:hover {
  background: #4338ca;
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

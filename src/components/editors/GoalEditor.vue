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
  goal: { type: String, default: '' },
  goalAmount: { type: Number, default: 0 },
  savingsPercent: { type: Number, default: 0 },
  customGoalName: { type: String, default: '' },
  income: { type: Number, default: 0 },
  expenses: { type: Object, default: () => ({}) },
  customExpenses: { type: Array, default: () => [] }
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
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.editor-modal {
  background: #16161F;
  border-radius: 24px;
  width: 100%;
  max-width: 450px;
  max-height: 85vh;
  overflow-y: auto;
  border: 1px solid rgba(255,255,255,0.05);
}
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.05);
  position: sticky;
  top: 0;
  background: #16161F;
  z-index: 10;
}
.editor-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}
.close-btn {
  background: none;
  border: none;
  color: #6B6B80;
  font-size: 28px;
  cursor: pointer;
  padding: 0 8px;
}
.close-btn:hover {
  color: #ffffff;
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
  color: #8E8EA0;
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
  background: #1E1E2A;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
}
.goal-option.active {
  border-color: #F5A623;
  background: #2A2A38;
}
.goal-option:hover {
  border-color: rgba(245, 166, 35, 0.3);
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
  color: #ffffff;
}
.text-input {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  text-align: left;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  outline: none;
  background: #1E1E2A;
  color: #ffffff;
  box-sizing: border-box;
  transition: border-color 0.2s;
}
.text-input:focus {
  border-color: #F5A623;
}
.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}
.editor-input {
  width: 100%;
  padding: 14px 60px 14px 14px;
  font-size: 20px;
  font-weight: 700;
  text-align: right;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  outline: none;
  background: #1E1E2A;
  color: #ffffff;
  transition: border-color 0.2s;
}
.editor-input:focus {
  border-color: #F5A623;
}
.currency {
  position: absolute;
  right: 14px;
  font-size: 18px;
  font-weight: 600;
  color: #6B6B80;
  pointer-events: none;
}
.percent-value {
  color: #F5A623;
  font-size: 18px;
}
.percent-slider {
  width: 100%;
  height: 6px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
}
.percent-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #F5A623;
  border-radius: 50%;
  cursor: pointer;
}
.slider-hint {
  font-size: 13px;
  color: #6B6B80;
  margin-top: 8px;
}
.projection-card {
  background: #1E1E2A;
  border-radius: 16px;
  padding: 20px;
  text-align: center;
  margin-top: 16px;
}
.projection-title {
  font-size: 13px;
  color: #8E8EA0;
  margin-bottom: 8px;
}
.projection-value {
  font-size: 28px;
  font-weight: 700;
  color: #F5A623;
}
.warning-card {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
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
  color: #ef4444;
  line-height: 1.5;
}
.editor-actions {
  display: flex;
  gap: 12px;
  padding: 16px 24px 24px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.cancel-btn,
.save-btn {
  flex: 1;
  padding: 14px;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}
.cancel-btn {
  background: rgba(255,255,255,0.06);
  color: #8E8EA0;
}
.cancel-btn:hover {
  background: rgba(255,255,255,0.1);
}
.save-btn {
  background: linear-gradient(135deg, #F5A623, #E0941A);
  color: #0B0B10;
}
.save-btn:hover {
  transform: scale(1.01);
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
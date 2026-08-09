<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Шаг 2 из 5</span>
      <h2>Сколько уходит<br>на обязательное?</h2>
    </div>

    <div class="expenses-list">
      <div v-for="(cat, key) in expenseCategories" :key="key" class="expense-row">
        <span class="expense-name">{{ cat }}</span>
        <div class="expense-input-wrapper">
          <input
            type="number"
            :value="modelValue.expenses[key]"
            @input="emitExpenseUpdate(key, $event.target.value)"
            placeholder="0"
            inputmode="numeric"
            class="expense-input"
          />
          <span class="currency-symbol">₽</span>
        </div>
      </div>

      <!-- Кастомные расходы -->
      <div v-for="(custom, idx) in modelValue.customExpenses" :key="'c' + idx" class="expense-row custom">
        <input
          type="text"
          :value="custom.name"
          @input="emitCustomNameUpdate(idx, $event.target.value)"
          placeholder="Название"
          class="custom-name"
        />
        <div class="expense-input-wrapper">
          <input
            type="number"
            :value="custom.amount"
            @input="emitCustomAmountUpdate(idx, $event.target.value)"
            placeholder="0"
            inputmode="numeric"
            class="expense-input"
          />
          <span class="currency-symbol">₽</span>
        </div>
        <button class="remove-btn" @click="removeCustom(idx)">×</button>
      </div>

      <button class="add-custom-btn" @click="addCustomExpense">
        + Добавить своё
      </button>
    </div>

    <div class="total-expenses" :class="{ 'is-negative': monthlyDeficit > 0 }">
      <span>{{ monthlyDeficit > 0 ? 'Ежемесячный долг' : 'Итого обязательных:' }}</span>
      <span class="total-amount">
        {{ formatMoney(monthlyDeficit > 0 ? monthlyDeficit : totalExpenses) }} ₽
      </span>
    </div>

    <div v-if="monthlyDeficit > 0" class="warning-text">
      Ваши расходы превышают доход на {{ formatMoney(monthlyDeficit) }} ₽
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  income: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update:modelValue'])

const expenseCategories = {
  rent: 'Аренда',
  utilities: 'Коммуналка',
  food: 'Еда',
  transport: 'Транспорт',
  credits: 'Кредиты'
}

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function emitExpenseUpdate(key, value) {
  const numVal = Number(value) || 0
  const newExpenses = { ...props.modelValue.expenses, [key]: numVal }

  // Автоматически обновляем цель "Долги", если изменились кредиты или доп долги
  updateDebtsGoal(newExpenses, props.modelValue.customExpenses)

  emit('update:modelValue', { ...props.modelValue, expenses: newExpenses })
}

function emitCustomNameUpdate(idx, value) {
  const newCustom = [...props.modelValue.customExpenses]
  newCustom[idx] = { ...newCustom[idx], name: value }

  updateDebtsGoal(props.modelValue.expenses, newCustom)

  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

function emitCustomAmountUpdate(idx, value) {
  const numVal = Number(value) || 0
  const newCustom = [...props.modelValue.customExpenses]
  newCustom[idx] = { ...newCustom[idx], amount: numVal }

  updateDebtsGoal(props.modelValue.expenses, newCustom)

  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

function addCustomExpense() {
  const newCustom = [...props.modelValue.customExpenses, { name: '', amount: 0 }]
  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

function removeCustom(idx) {
  const newCustom = props.modelValue.customExpenses.filter((_, i) => i !== idx)

  updateDebtsGoal(props.modelValue.expenses, newCustom)

  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

// Логика расчета цели "Закрыть долги"
function updateDebtsGoal(expenses, customExpenses) {
  // Сумма ежемесячных платежей по кредитам
  const credits = Number(expenses.credits) || 0

  // Ищем пользовательскую категорию "Долги" или похожую
  let extraDebts = 0
  customExpenses.forEach(item => {
    const name = (item.name || '').toLowerCase()
    if (name.includes('долг') || name.includes('кредит')) {
      extraDebts += Number(item.amount) || 0
    }
  })

  const monthlyDebtPayment = credits + extraDebts
  const yearlyDebtAmount = monthlyDebtPayment * 12

  // Обновляем цель в модели, если она существует, или создаем структуру
  // Мы предполагаем, что родительский компонент обрабатывает структуру goals,
  // но здесь мы готовим данные для шага выбора целей
  const currentGoals = props.modelValue.goals || {}

  const newGoals = {
    ...currentGoals,
    debts: {
      id: 'debts',
      name: 'Закрыть долги',
      amount: yearlyDebtAmount,
      icon: '💸',
      isCustom: false
    }
  }

  emit('update:modelValue', {
    ...props.modelValue,
    expenses,
    customExpenses,
    goals: newGoals
  })
}

const totalExpenses = computed(() => {
  const base = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})

const monthlyDeficit = computed(() => {
  const diff = totalExpenses.value - props.income
  return diff > 0 ? diff : 0
})
</script>

<style scoped>
.onboarding-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
  box-sizing: border-box;
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

.expenses-list {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.expense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.expense-row.custom {
  flex-wrap: wrap;
}

.expense-name {
  font-size: 16px;
  font-weight: 500;
  min-width: 120px;
  text-align: left;
  flex-shrink: 0;
}

.expense-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 140px;
  display: flex;
  align-items: center;
}

.expense-input {
  width: 100%;
  padding: 12px 35px 12px 12px; /* Место справа для символа */
  font-size: 18px;
  text-align: right;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.expense-input:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

.custom-name {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  font-size: 16px;
  text-align: left;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  outline: none;
  box-sizing: border-box;
}

.remove-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.add-custom-btn {
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
}

.add-custom-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
}

.total-expenses {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 16px;
  width: 100%;
  max-width: 400px;
  transition: all 0.3s ease;
}

.total-expenses.is-negative {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
}

.is-negative .total-amount {
  color: #ef4444;
}

.warning-text {
  margin-top: 12px;
  font-size: 14px;
  color: #ef4444;
  opacity: 0.9;
}

/* Input global styles for consistency */
input[type="number"],
input[type="text"] {
  box-sizing: border-box;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.currency-symbol {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
  color: white;
}

/* Remove default browser arrows */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}
</style>
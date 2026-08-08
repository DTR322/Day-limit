<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Шаг 2 из 5</span>
      <h2>Сколько уходит<br>на обязательное?</h2>
    </div>

    <div class="expenses-list">
      <div v-for="(cat, key) in expenseCategories" :key="key" class="expense-row">
        <span class="expense-name">{{ cat }}</span>
        <div class="expense-input">
          <input
            type="number"
            :value="modelValue.expenses[key]"
            @input="emitExpenseUpdate(key, $event.target.value)"
            placeholder="0"
            inputmode="numeric"
          />
          <span class="currency-sm">₽</span>
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
        <div class="expense-input">
          <input
            type="number"
            :value="custom.amount"
            @input="emitCustomAmountUpdate(idx, $event.target.value)"
            placeholder="0"
            inputmode="numeric"
          />
          <span class="currency-sm">₽</span>
        </div>
        <button class="remove-btn" @click="removeCustom(idx)">×</button>
      </div>

      <button class="add-custom-btn" @click="addCustomExpense">
        + Добавить своё
      </button>
    </div>

    <div class="total-expenses">
      <span>Итого обязательных:</span>
      <span class="total-amount">{{ formatMoney(totalExpenses) }} ₽</span>
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
  const newExpenses = { ...props.modelValue.expenses, [key]: Number(value) || 0 }
  emit('update:modelValue', { ...props.modelValue, expenses: newExpenses })
}

function emitCustomNameUpdate(idx, value) {
  const newCustom = [...props.modelValue.customExpenses]
  newCustom[idx] = { ...newCustom[idx], name: value }
  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

function emitCustomAmountUpdate(idx, value) {
  const newCustom = [...props.modelValue.customExpenses]
  newCustom[idx] = { ...newCustom[idx], amount: Number(value) || 0 }
  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

function addCustomExpense() {
  const newCustom = [...props.modelValue.customExpenses, { name: '', amount: 0 }]
  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

function removeCustom(idx) {
  const newCustom = props.modelValue.customExpenses.filter((_, i) => i !== idx)
  emit('update:modelValue', { ...props.modelValue, customExpenses: newCustom })
}

const totalExpenses = computed(() => {
  const base = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
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

/* === ОБЩЕЕ ПРАВИЛО ИНПУТОВ — СТОИТ ДО ЧАСТНЫХ, КАК В МОНОЛИТЕ === */
input[type="number"],
input[type="text"] {
  width: 100%;
  padding: 20px;
  font-size: 32px;
  font-weight: 700;
  text-align: center;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  color: white;
  outline: none;
  transition: border-color 0.2s;
}

input[type="number"]:focus,
input[type="text"]:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

/* Убираем стрелки у number-инпутов */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

/* === ЧАСТНЫЕ ПРАВИЛА — ПОСЛЕ ОБЩЕГО, ПОЭТОМУ ПОБЕЖДАЮТ === */

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
}

.expense-input {
  position: relative;
  flex: 1;
  max-width: 140px;
}

/* Идёт ПОСЛЕ общего правила → перебивает padding и font-size */
.expense-input input {
  padding: 12px 34px 12px 12px;
  font-size: 18px;
  font-weight: 500;
  text-align: right;
}

/* Символ — как в монолите: absolute + центрирование, но 20px и ближе к числу */
.currency-sm {
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20px;
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
}

/* input.custom-name специфичнее общего input[type="text"] */
input.custom-name {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  text-align: left;
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
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
}
</style>
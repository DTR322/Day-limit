<template>
  <div class="editor-modal-overlay" @click="$emit('close')">
    <div class="editor-modal" @click.stop>
      <div class="editor-header">
        <h2>Постоянные расходы</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="editor-content">
        <div v-for="(cat, key) in expenseCategories" :key="key" class="input-group">
          <label class="input-label">{{ cat }}</label>
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="localExpenses[key]"
              placeholder="0"
              inputmode="numeric"
              class="editor-input"
            />
            <span class="currency">₽</span>
          </div>
        </div>

        <!-- Кастомные расходы -->
        <div v-for="(custom, idx) in localCustomExpenses" :key="'c' + idx" class="input-group custom-row">
          <div class="custom-name-wrapper">
            <input
              type="text"
              v-model="localCustomExpenses[idx].name"
              placeholder="Название расхода"
              class="editor-input custom-name"
            />
          </div>
          <div class="input-wrapper small">
            <input
              type="number"
              v-model.number="localCustomExpenses[idx].amount"
              placeholder="0"
              inputmode="numeric"
              class="editor-input"
            />
            <span class="currency">₽</span>
          </div>
          <button class="remove-btn" @click="removeCustom(idx)">×</button>
        </div>

        <button class="add-custom-btn" @click="addCustomExpense">
          + Добавить свой расход
        </button>

        <div class="total-display" :class="{ 'is-deficit': totalExpenses > localIncome }">
          <span>{{ totalExpenses > localIncome ? 'Расходы превышают доход' : 'Итого расходов:' }}</span>
          <span class="total-amount">{{ formatMoney(totalExpenses) }} ₽</span>
        </div>

        <div v-if="totalExpenses > localIncome" class="warning-text">
          Превышение на {{ formatMoney(totalExpenses - localIncome) }} ₽/мес
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
  expenses: {
    type: Object,
    default: () => ({ rent: 0, utilities: 0, food: 0, transport: 0, credits: 0 })
  },
  customExpenses: {
    type: Array,
    default: () => []
  },
  income: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'save'])

const expenseCategories = {
  rent: 'Аренда жилья',
  utilities: 'Коммуналка',
  food: 'Еда',
  transport: 'Транспорт',
  credits: 'Кредиты'
}

const localExpenses = ref({ ...props.expenses })
const localCustomExpenses = ref(JSON.parse(JSON.stringify(props.customExpenses || [])))
const localIncome = ref(props.income)

onMounted(() => {
  localExpenses.value = { ...props.expenses }
  localCustomExpenses.value = JSON.parse(JSON.stringify(props.customExpenses || []))
  localIncome.value = props.income
})

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function addCustomExpense() {
  localCustomExpenses.value.push({ name: '', amount: 0 })
}

function removeCustom(idx) {
  localCustomExpenses.value.splice(idx, 1)
}

const totalExpenses = computed(() => {
  const base = Object.values(localExpenses.value).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = localCustomExpenses.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})

function save() {
  emit('save', {
    expenses: { ...localExpenses.value },
    customExpenses: [...localCustomExpenses.value]
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
  max-height: 80vh;
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
  margin-bottom: 16px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.input-wrapper.small {
  max-width: 140px;
}

.editor-input {
  width: 100%;
  padding: 14px 50px 14px 14px;
  font-size: 18px;
  text-align: right;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
}

.editor-input:focus {
  border-color: #4f46e5;
}

.editor-input.custom-name {
  text-align: left;
  padding-right: 14px;
}

.currency {
  position: absolute;
  right: 14px;
  font-size: 18px;
  font-weight: 600;
  color: #6b7280;
  pointer-events: none;
}

.custom-row {
  display: flex;
  gap: 12px;
  align-items: center;
}

.custom-name-wrapper {
  flex: 1;
}

.remove-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.remove-btn:hover {
  background: #fecaca;
}

.add-custom-btn {
  width: 100%;
  padding: 14px;
  background: #f3f4f6;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  color: #6b7280;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}

.add-custom-btn:hover {
  background: #e5e7eb;
  border-color: #9ca3af;
}

.total-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f3f4f6;
  border-radius: 12px;
  font-size: 16px;
  margin-top: 16px;
}

.total-display.is-deficit {
  background: #fee2e2;
  border: 1px solid #fecaca;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #1f2937;
}

.is-deficit .total-amount {
  color: #dc2626;
}

.warning-text {
  margin-top: 12px;
  font-size: 14px;
  color: #dc2626;
  text-align: center;
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

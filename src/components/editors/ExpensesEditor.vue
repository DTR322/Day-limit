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

        <div v-for="(custom, idx) in localCustomExpenses" :key="'c' + idx" class="custom-row">
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

        <button class="add-custom-btn" @click="addCustomExpense">+ Добавить свой расход</button>

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
  expenses: { type: Object, default: () => ({ rent: 0, utilities: 0, food: 0, transport: 0, credits: 0 }) },
  customExpenses: { type: Array, default: () => [] },
  income: { type: Number, default: 0 }
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
  max-height: 80vh;
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
  margin-bottom: 16px;
}
.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #8E8EA0;
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
  padding: 14px 60px 14px 14px;
  font-size: 18px;
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
.editor-input.custom-name {
  text-align: left;
  padding-right: 14px;
}
.currency {
  position: absolute;
  right: 14px;
  font-size: 18px;
  font-weight: 600;
  color: #6B6B80;
  pointer-events: none;
}
.custom-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}
.custom-name-wrapper {
  flex: 1;
}
.remove-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: background 0.2s;
}
.remove-btn:hover {
  background: rgba(239, 68, 68, 0.25);
}
.add-custom-btn {
  width: 100%;
  padding: 14px;
  background: rgba(255,255,255,0.04);
  border: 1px dashed rgba(255,255,255,0.08);
  border-radius: 16px;
  color: #8E8EA0;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 20px;
}
.add-custom-btn:hover {
  background: rgba(255,255,255,0.08);
  border-color: rgba(255,255,255,0.15);
}
.total-display {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #1E1E2A;
  border-radius: 16px;
  font-size: 16px;
  margin-top: 16px;
}
.total-display.is-deficit {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.2);
}
.total-amount {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}
.is-deficit .total-amount {
  color: #ef4444;
}
.warning-text {
  margin-top: 12px;
  font-size: 14px;
  color: #ef4444;
  text-align: center;
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
<template>
  <div class="modal" v-show="modelValue">
    <div class="modal-backdrop" @click="closeModal"></div>
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Новая трата</h3>
        <button class="close-modal-btn" @click="closeModal">×</button>
      </div>

      <div class="categories">
        <button
          v-for="cat in categoriesWithLastAmount"
          :key="cat.name"
          class="cat-btn"
          :class="{ active: selectedCategory && selectedCategory.name === cat.name }"
          @click="selectCategory(cat)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <div class="cat-info">
            <span class="cat-name">{{ cat.name }}</span>
            <span v-if="cat.lastAmount > 0" class="cat-last-amount">
              {{ formatNumber(cat.lastAmount) }} ₽
            </span>
          </div>
        </button>
      </div>

      <div class="custom-amount">
        <label for="amount-input">Сумма</label>
        <div class="input-group">
          <input
            id="amount-input"
            type="number"
            v-model.number="customAmount"
            placeholder="0"
            min="1"
            inputmode="numeric"
            ref="amountInput"
          />
          <span class="suffix">₽</span>
        </div>
      </div>

      <div class="modal-buttons">
        <button class="btn-secondary" @click="closeModal">Отмена</button>
        <button
          class="btn-primary"
          @click="addTransaction"
          :disabled="!customAmount || customAmount <= 0"
        >
          Добавить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, required: true }
})
const emit = defineEmits(['update:modelValue', 'transaction'])

const PRESET_CATEGORIES = [
  { name: 'Кофе', icon: '☕' },
  { name: 'Обед', icon: '🍔' },
  { name: 'Такси', icon: '🚕' },
  { name: 'Кино', icon: '🎬' },
  { name: 'Покупки', icon: '🛍' },
  { name: 'Бар', icon: '🍷' }
]

const STORAGE_KEY = 'daylimit-category-amounts'
const customAmount = ref(0)
const selectedCategory = ref(null)
const amountInput = ref(null)
const categoryAmounts = ref({})

function loadCategoryAmounts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    categoryAmounts.value = data ? JSON.parse(data) : {}
  } catch { categoryAmounts.value = {} }
}
loadCategoryAmounts()

function saveCategoryAmount(categoryName, amount) {
  const newAmounts = { ...categoryAmounts.value }
  newAmounts[categoryName] = amount
  categoryAmounts.value = newAmounts
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newAmounts))
}

function getCategoryAmount(categoryName) {
  return categoryAmounts.value[categoryName] || 0
}

const categoriesWithLastAmount = computed(() => {
  return PRESET_CATEGORIES.map(cat => ({
    ...cat,
    lastAmount: getCategoryAmount(cat.name)
  }))
})

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

function selectCategory(cat) {
  selectedCategory.value = cat
  const saved = getCategoryAmount(cat.name)
  customAmount.value = saved > 0 ? saved : 0
  nextTick(() => {
    if (amountInput.value) {
      amountInput.value.focus()
      amountInput.value.select()
    }
  })
}

function addTransaction() {
  if (!customAmount.value || customAmount.value <= 0) return
  let name = '💳 Покупка'
  if (selectedCategory.value) {
    name = `${selectedCategory.value.icon} ${selectedCategory.value.name}`
    saveCategoryAmount(selectedCategory.value.name, customAmount.value)
  }
  emit('transaction', {
    id: generateId(),
    name: name,
    amount: customAmount.value,
    date: new Date().toISOString()
  })
  closeModal()
}

function closeModal() {
  emit('update:modelValue', false)
  selectedCategory.value = null
  customAmount.value = 0
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

watch(() => props.modelValue, (isOpen) => {
  if (!isOpen) {
    selectedCategory.value = null
    customAmount.value = 0
  }
})
</script>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
}
.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.6);
  animation: fadeIn 0.25s ease;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 420px;
  background: #16161F;
  border-radius: 32px 32px 0 0;
  padding: 24px 24px 32px;
  z-index: 1;
  animation: slideUp 0.3s ease;
  border: 1px solid rgba(255,255,255,0.05);
}
@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
}
.close-modal-btn {
  background: none;
  border: none;
  color: #6B6B80;
  font-size: 28px;
  cursor: pointer;
  padding: 0 8px;
}
.close-modal-btn:hover { color: #ffffff; }

.categories {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}
.cat-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  background: #1E1E2A;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}
.cat-btn:hover { background: #2A2A38; border-color: rgba(255,255,255,0.08); }
.cat-btn.active {
  background: #2A2A38;
  border-color: #F5A623;
}
.cat-icon { font-size: 24px; flex-shrink: 0; }
.cat-info { display: flex; flex-direction: column; }
.cat-name { font-size: 14px; font-weight: 600; color: #ffffff; }
.cat-last-amount { font-size: 12px; color: #6B6B80; margin-top: 2px; }

.custom-amount { margin-bottom: 24px; }
.custom-amount label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #8E8EA0;
  margin-bottom: 8px;
}
.input-group {
  position: relative;
  display: flex;
  align-items: center;
}
.input-group input {
  width: 100%;
  padding: 18px 60px 18px 18px;
  font-size: 28px;
  font-weight: 700;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 16px;
  outline: none;
  transition: border-color 0.2s;
  background: #1E1E2A;
  color: #ffffff;
  box-sizing: border-box;
}
.input-group input:focus { border-color: #F5A623; }
.input-group .suffix {
  position: absolute;
  right: 18px;
  font-size: 20px;
  font-weight: 600;
  color: #6B6B80;
  pointer-events: none;
}

.input-group input[type="number"]::-webkit-inner-spin-button,
.input-group input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
.input-group input[type="number"] { -moz-appearance: textfield; }

.modal-buttons {
  display: flex;
  gap: 12px;
}
.btn-secondary, .btn-primary {
  flex: 1;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}
.btn-secondary {
  background: rgba(255,255,255,0.06);
  color: #8E8EA0;
}
.btn-secondary:hover { background: rgba(255,255,255,0.1); }
.btn-primary {
  background: linear-gradient(135deg, #F5A623, #E0941A);
  color: #0B0B10;
}
.btn-primary:hover { transform: scale(1.01); }
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; transform: none; }
</style>
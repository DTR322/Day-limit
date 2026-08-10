<template>
  <div class="modal" v-show="modelValue">
    <div class="modal-backdrop" @click="closeModal"></div>
    <div class="modal-content">
      <h3 class="modal-title">Новая трата</h3>

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
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'transaction'])

// === КОНСТАНТЫ ===
const PRESET_CATEGORIES = [
  { name: 'Кофе', icon: '☕' },
  { name: 'Обед', icon: '🍔' },
  { name: 'Такси', icon: '🚕' },
  { name: 'Кино', icon: '🎬' },
  { name: 'Покупки', icon: '🛍' },
  { name: 'Бар', icon: '🍷' }
]

const STORAGE_KEY = 'daylimit-category-amounts'

// === СОСТОЯНИЕ ===
const customAmount = ref(0)
const selectedCategory = ref(null)
const amountInput = ref(null)

// Реактивный объект для хранения сумм категорий
const categoryAmounts = ref({})

// === РАБОТА С LOCALSTORAGE (реактивно) ===
function loadCategoryAmounts() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    categoryAmounts.value = data ? JSON.parse(data) : {}
  } catch {
    categoryAmounts.value = {}
  }
}

function saveCategoryAmount(categoryName, amount) {
  // Создаём новый объект, чтобы триггерить реактивность
  const newAmounts = { ...categoryAmounts.value }
  newAmounts[categoryName] = amount
  categoryAmounts.value = newAmounts
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newAmounts))
}

function getCategoryAmount(categoryName) {
  return categoryAmounts.value[categoryName] || 0
}

// Загружаем данные сразу
loadCategoryAmounts()

// === ВЫЧИСЛЕНИЯ ===
const categoriesWithLastAmount = computed(() => {
  return PRESET_CATEGORIES.map(cat => ({
    ...cat,
    lastAmount: getCategoryAmount(cat.name)
  }))
})

function formatNumber(value) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(value))
}

// === ДЕЙСТВИЯ ===
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
    // Сохраняем сумму реактивно
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

// === СБРОС ПРИ ЗАКРЫТИИ ===
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      selectedCategory.value = null
      customAmount.value = 0
    }
  }
)
</script>

<style scoped>
/* Модалка */
.modal {
  position: fixed;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.modal-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease;
}

.modal-content {
  position: relative;
  width: 100%;
  max-width: 400px;
  max-height: 90vh;
  overflow-y: auto;
  background: white;
  border-radius: 20px;
  padding: 24px;
  z-index: 1;
  animation: popIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes popIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin: 0 0 24px;
  color: #1f2937;
}

/* Категории */
.categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.cat-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f3f4f6;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.cat-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.cat-btn.active {
  border-color: #4f46e5;
  background: #eef2ff;
}

.cat-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.cat-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cat-name {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
}

.cat-last-amount {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

/* Ввод суммы */
.custom-amount {
  margin-bottom: 24px;
}

.custom-amount label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 8px;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-group input {
  width: 100%;
  padding: 16px 50px 16px 16px;
  font-size: 24px;
  font-weight: 700;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
  background: white;
  color: #1f2937;
}

.input-group input:focus {
  border-color: #4f46e5;
}

.input-group .suffix {
  position: absolute;
  right: 16px;
  font-size: 20px;
  font-weight: 600;
  color: #6b7280;
  pointer-events: none;
}

.input-group input[type="number"]::-webkit-inner-spin-button,
.input-group input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-group input[type="number"] {
  -moz-appearance: textfield;
}

/* Кнопки */
.modal-buttons {
  display: flex;
  gap: 12px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #4f46e5;
  color: white;
}

.btn-primary:hover {
  background: #4338ca;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
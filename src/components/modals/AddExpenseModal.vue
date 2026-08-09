<template>
  <div class="modal" v-show="modelValue">
    <div class="modal-backdrop" @click="emit('update:modelValue', false)"></div>
    <div class="modal-content">
      <h3 class="modal-title">Новая трата</h3>

      <div class="categories">
        <button
          v-for="cat in PRESET_CATEGORIES"
          :key="cat.name"
          class="cat-btn"
          @click="handleCategoryClick(cat)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-name">{{ cat.name }}</span>
          <span class="cat-amount">{{ cat.amount }} ₽</span>
        </button>
      </div>

      <div class="custom-amount">
        <label>Своя сумма</label>
        <div class="input-group">
          <input
            type="number"
            v-model.number="customAmount"
            placeholder="0"
            min="1"
            inputmode="numeric"
          />
          <span class="suffix">₽</span>
        </div>
      </div>

      <div class="modal-buttons">
        <button class="btn-secondary" @click="emit('update:modelValue', false)">Отмена</button>
        <button
          class="btn-primary"
          @click="handleCustomTransaction"
          :disabled="!customAmount || customAmount <= 0"
        >
          Добавить
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'transaction'])

const PRESET_CATEGORIES = [
  { name: '☕ Кофе', amount: 300, icon: '☕' },
  { name: '🍔 Обед', amount: 600, icon: '🍔' },
  { name: '🚕 Такси', amount: 400, icon: '🚕' },
  { name: '🎬 Кино', amount: 500, icon: '🎬' },
  { name: '🛍 Покупки', amount: 1500, icon: '🛍' },
  { name: '🍷 Бар', amount: 2000, icon: '🍷' }
]

const customAmount = ref(0)

// Сброс суммы при закрытии модалки
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) {
      customAmount.value = 0
    }
  }
)

function handleCategoryClick(category) {
  emit('transaction', {
    id: generateId(),
    name: category.name,
    amount: category.amount,
    date: new Date().toISOString()
  })
  emit('update:modelValue', false)
}

function handleCustomTransaction() {
  if (customAmount.value > 0) {
    emit('transaction', {
      id: generateId(),
      name: '💳 Покупка',
      amount: customAmount.value,
      date: new Date().toISOString()
    })
    emit('update:modelValue', false)
    customAmount.value = 0
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
</script>

<style scoped>
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

.categories {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.cat-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  background: #f3f4f6;
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-btn:hover {
  background: #e5e7eb;
  border-color: #d1d5db;
}

.cat-btn:active {
  transform: scale(0.97);
}

.cat-icon {
  font-size: 28px;
}

.cat-name {
  font-size: 13px;
  font-weight: 600;
  color: #374151;
}

.cat-amount {
  font-size: 12px;
  color: #6b7280;
}

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

/* Убираем стандартные стрелки у number input */
.input-group input[type="number"]::-webkit-inner-spin-button,
.input-group input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

.input-group input[type="number"] {
  -moz-appearance: textfield;
}
</style>
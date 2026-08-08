<template>
  <div class="modal" v-show="modelValue">
    <div class="modal-backdrop" @click="emit('update:modelValue', false)"></div>
    <div class="modal-sheet">
      <div class="modal-handle"></div>
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
          />
          <span class="suffix">₽</span>
        </div>
      </div>

      <div class="modal-buttons">
        <button class="btn-secondary" @click="emit('update:modelValue', false)">Отмена</button>
        <button 
          class="btn-primary" 
          @click="handleCustomTransaction" 
          :disabled="customAmount <= 0"
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

// Сброс суммы при открытии модалки
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
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.modal-sheet {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-radius: 20px 20px 0 0;
  padding: 24px;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.modal-handle {
  width: 40px;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  margin: 0 auto 24px;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  margin-bottom: 24px;
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
  gap: 8px;
  padding: 16px;
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

.cat-icon {
  font-size: 32px;
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.cat-amount {
  font-size: 13px;
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
</style>

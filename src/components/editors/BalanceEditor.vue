<template>
  <div class="editor-modal-overlay" @click="$emit('close')">
    <div class="editor-modal" @click.stop>
      <div class="editor-header">
        <h2>Долги и накопления</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="editor-content">
        <div class="input-group">
          <label class="input-label">Общая сумма долгов</label>
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="localTotalDebt"
              placeholder="0"
              inputmode="numeric"
              class="editor-input"
            />
            <span class="currency">₽</span>
          </div>
          <p class="hint">Кредиты, займы, другие обязательства</p>
        </div>

        <div class="input-group">
          <label class="input-label">Уже накоплено</label>
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="localTotalSavings"
              placeholder="0"
              inputmode="numeric"
              class="editor-input"
            />
            <span class="currency">₽</span>
          </div>
          <p class="hint">Сумма на счетах, вкладах, инвестициях</p>
        </div>

        <div class="balance-summary" :class="{ 'in-debt': localTotalDebt > localTotalSavings }">
          <div class="balance-item debt">
            <span class="balance-label">Долги</span>
            <span class="balance-value negative">{{ formatMoney(localTotalDebt) }} ₽</span>
          </div>
          <div class="balance-divider">−</div>
          <div class="balance-item savings">
            <span class="balance-label">Накопления</span>
            <span class="balance-value positive">{{ formatMoney(localTotalSavings) }} ₽</span>
          </div>
          <div class="balance-divider">=</div>
          <div class="balance-item net">
            <span class="balance-label">Чистая позиция</span>
            <span class="balance-value" :class="netValue >= 0 ? 'positive' : 'negative'">
              {{ formatMoney(netValue) }} ₽
            </span>
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
  totalDebt: {
    type: Number,
    default: 0
  },
  totalSavings: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['close', 'save'])

const localTotalDebt = ref(props.totalDebt)
const localTotalSavings = ref(props.totalSavings)

const netValue = computed(() => localTotalSavings.value - localTotalDebt.value)

onMounted(() => {
  localTotalDebt.value = props.totalDebt
  localTotalSavings.value = props.totalSavings
})

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function save() {
  emit('save', {
    totalDebt: localTotalDebt.value || 0,
    totalSavings: localTotalSavings.value || 0
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
  max-width: 400px;
  overflow: hidden;
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
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.editor-input {
  width: 100%;
  padding: 16px 50px 16px 16px;
  font-size: 24px;
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
  right: 16px;
  font-size: 20px;
  font-weight: 600;
  color: #6b7280;
  pointer-events: none;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  margin-top: 8px;
}

.balance-summary {
  background: #f9fafb;
  border-radius: 16px;
  padding: 20px;
  margin-top: 24px;
}

.balance-summary.in-debt {
  background: #fef2f2;
}

.balance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.balance-item:not(:last-child) {
  border-bottom: 1px solid #e5e7eb;
}

.balance-label {
  font-size: 14px;
  color: #6b7280;
}

.balance-value {
  font-size: 20px;
  font-weight: 700;
}

.balance-value.positive {
  color: #10b981;
}

.balance-value.negative {
  color: #ef4444;
}

.balance-divider {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  color: #9ca3af;
  padding: 8px 0;
}

.editor-actions {
  display: flex;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e7eb;
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

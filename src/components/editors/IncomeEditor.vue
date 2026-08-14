<template>
  <div class="editor-modal-overlay" @click="$emit('close')">
    <div class="editor-modal" @click.stop>
      <div class="editor-header">
        <h2>Доходы</h2>
        <button class="close-btn" @click="$emit('close')" aria-label="Закрыть">×</button>
      </div>

      <div class="editor-content">
        <div class="input-group">
          <label class="input-label">Ежемесячный доход</label>
          <div class="input-wrapper">
            <input
              type="number"
              v-model.number="localIncome"
              placeholder="0"
              inputmode="numeric"
              class="editor-input"
            />
            <span class="currency">₽</span>
          </div>
          <p class="hint">Сумма после вычета налогов</p>
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
import { ref, onMounted } from 'vue'

const props = defineProps({
  income: { type: Number, default: 0 }
})
const emit = defineEmits(['close', 'save'])

const localIncome = ref(props.income)

onMounted(() => {
  localIncome.value = props.income
})

function save() {
  emit('save', { income: localIncome.value || 0 })
}
</script>

<style scoped>
.editor-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 15, 0.75);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.editor-modal {
  background: #1a1a24;
  border-radius: 20px;
  width: 100%;
  max-width: 400px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.03) inset;
  animation: modalIn 0.2s ease-out;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18px 24px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #f0f0f5;
  letter-spacing: 0.01em;
}

.close-btn {
  background: none;
  border: none;
  color: #8a8a9a;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: color 0.15s, background 0.15s;
}

.close-btn:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.08);
}

.editor-content {
  padding: 20px 24px 16px;
}

.input-group {
  margin-bottom: 8px;
}

.input-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #b0b0c0;
  margin-bottom: 8px;
  letter-spacing: 0.02em;
}

.input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.editor-input {
  width: 100%;
  padding: 10px 48px 10px 18px;
  font-size: 18px;
  font-weight: 600;
  text-align: right;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 14px;
  outline: none;
  background: #222230;
  color: #ffffff;
  transition: border-color 0.2s, box-shadow 0.2s;
  height: 46px;
  box-sizing: border-box;
  caret-color: #f5a623;
}

.editor-input:focus {
  border-color: #f5a623;
  box-shadow: 0 0 0 3px rgba(245, 166, 35, 0.15);
}

.editor-input::placeholder {
  color: #5a5a6e;
  font-weight: 500;
}

.currency {
  position: absolute;
  right: 18px;
  font-size: 18px;
  font-weight: 600;
  color: #8a8a9a;
  pointer-events: none;
}

.hint {
  font-size: 12px;
  color: #7a7a8c;
  margin-top: 8px;
  padding-left: 2px;
  letter-spacing: 0.01em;
}

.editor-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 18px 24px 22px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.cancel-btn,
.save-btn {
  padding: 10px 20px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  letter-spacing: 0.02em;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #c0c0d0;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.14);
  color: #ffffff;
}

.save-btn {
  background: linear-gradient(135deg, #f7b733, #e5941f);
  color: #0b0b10;
  box-shadow: 0 4px 12px rgba(245, 166, 35, 0.3);
}

.save-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(245, 166, 35, 0.4);
}

.save-btn:active {
  transform: translateY(0);
}

/* Убираем стрелки у number input */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
}
</style>
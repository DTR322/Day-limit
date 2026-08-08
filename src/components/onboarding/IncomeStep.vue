<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Шаг 1 из 5</span>
      <h2>Сколько зарабатываешь<br>в месяц?</h2>
    </div>
    
    <div class="input-section">
      <div class="input-wrapper large">
        <input
          ref="incomeInput"
          type="number"
          :value="modelValue.income"
          @input="emitUpdate('income', $event.target.value)"
          placeholder="0"
          inputmode="numeric"
          autofocus
        />
        <span class="currency">₽</span>
      </div>
      <p class="hint">Сумма после вычета налогов</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'focus-request'])

const incomeInput = ref(null)

function emitUpdate(field, value) {
  const newValue = { ...props.modelValue, [field]: Number(value) || 0 }
  emit('update:modelValue', newValue)
}

onMounted(() => {
  if (incomeInput.value) {
    emit('focus-request', incomeInput.value)
  }
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

.input-section {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.input-wrapper.large {
  position: relative;
  width: 100%;
  max-width: 320px;
  margin-bottom: 16px;
}

input[type="number"] {
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

input[type="number"]:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.currency {
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 24px;
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
}

/* Remove default browser arrows from number inputs */
input[type="number"]::-webkit-inner-spin-button,
input[type="number"]::-webkit-outer-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

input[type="number"] {
  -moz-appearance: textfield;
}

.hint {
  font-size: 14px;
  opacity: 0.6;
  margin-top: 8px;
}
</style>

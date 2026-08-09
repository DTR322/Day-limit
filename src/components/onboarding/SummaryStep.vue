<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Шаг 3 из 5</span>
      <h2>{{ monthlyDeficit > 0 ? 'Ежемесячный дефицит' : 'Твои свободные деньги' }}</h2>
    </div>

    <div class="summary-section" :class="{ 'is-deficit': monthlyDeficit > 0 }">
      <div v-if="monthlyDeficit > 0" class="deficit-icon">⚠️</div>
      <div class="big-number" :class="{ 'is-negative': monthlyDeficit > 0 }">
        {{ formatMoney(monthlyDeficit > 0 ? monthlyDeficit : freeMoney) }}
      </div>
      <div class="big-currency">{{ monthlyDeficit > 0 ? '₽ дефицит в месяц' : '₽ в месяц' }}</div>
      <p v-if="monthlyDeficit > 0" class="deficit-hint">
        Расходы превышают доход на {{ formatMoney(monthlyDeficit) }} ₽
      </p>
      <p v-else class="calc-hint">
        {{ formatMoney(income) }} − {{ formatMoney(totalExpenses) }} = {{ formatMoney(freeMoney) }} ₽
      </p>
    </div>

    <!-- Баланс: долги и накопления -->
    <div class="balance-section">
      <div class="balance-title">А что уже есть?</div>

      <div class="balance-row">
        <span class="balance-label">Сколько всего долгов</span>
        <div class="balance-input-wrapper">
          <input
            type="number"
            :value="modelValue.totalDebt"
            @input="emitUpdate('totalDebt', $event.target.value)"
            placeholder="0"
            inputmode="numeric"
          />
          <span class="currency-symbol">₽</span>
        </div>
      </div>

      <div class="balance-row">
        <span class="balance-label">Сколько уже накопил</span>
        <div class="balance-input-wrapper">
          <input
            type="number"
            :value="modelValue.totalSavings"
            @input="emitUpdate('totalSavings', $event.target.value)"
            placeholder="0"
            inputmode="numeric"
          />
          <span class="currency-symbol">₽</span>
        </div>
      </div>

      <p class="balance-hint">Если ничего — просто оставь нули и жми «Дальше»</p>
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

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function emitUpdate(field, value) {
  emit('update:modelValue', { ...props.modelValue, [field]: Number(value) || 0 })
}

const income = computed(() => Number(props.modelValue.income) || 0)

const totalExpenses = computed(() => {
  const base = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})

const freeMoney = computed(() => income.value - totalExpenses.value)

const monthlyDeficit = computed(() => {
  const diff = totalExpenses.value - income.value
  return diff > 0 ? diff : 0
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

.summary-section {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.big-number {
  font-size: 64px;
  font-weight: 800;
  line-height: 1;
  margin: 16px 0;
  color: white;
}

.big-number.is-negative {
  color: #ef4444;
}

.big-currency {
  font-size: 20px;
  opacity: 0.8;
  margin-bottom: 16px;
}

.calc-hint {
  font-size: 14px;
  opacity: 0.6;
  font-family: monospace;
}

.summary-section.is-deficit {
  background: rgba(239, 68, 68, 0.1);
  padding: 24px;
  border-radius: 16px;
  border: 2px solid rgba(239, 68, 68, 0.3);
}

.deficit-icon {
  font-size: 48px;
  margin-bottom: 8px;
}

.deficit-hint {
  font-size: 14px;
  color: #ef4444;
  opacity: 0.9;
  margin-top: 8px;
}

/* Баланс */
.balance-section {
  width: 100%;
  max-width: 400px;
  margin-top: 32px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.balance-title {
  font-size: 16px;
  font-weight: 600;
  opacity: 0.9;
}

.balance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.balance-label {
  font-size: 15px;
  font-weight: 500;
  text-align: left;
  flex-shrink: 0;
}

.balance-input-wrapper {
  position: relative;
  flex: 1;
  max-width: 160px;
}

.balance-input-wrapper input {
  width: 100%;
  padding: 12px 35px 12px 12px;
  font-size: 18px;
  text-align: right;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  outline: none;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.balance-input-wrapper input:focus {
  border-color: rgba(255, 255, 255, 0.5);
}

.currency-symbol {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: 600;
  opacity: 0.7;
  pointer-events: none;
  color: white;
}

.balance-hint {
  font-size: 13px;
  opacity: 0.6;
  margin: 0;
}

input::placeholder {
  color: rgba(255, 255, 255, 0.4);
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
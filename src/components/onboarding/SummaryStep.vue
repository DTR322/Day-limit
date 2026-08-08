<template>
  <div class="onboarding-step">
    <div class="step-header">
      <span class="step-label">Шаг 3 из 5</span>
      <h2>Твои свободные деньги</h2>
    </div>
    
    <div class="summary-section">
      <div class="big-number">{{ formatMoney(freeMoney) }}</div>
      <div class="big-currency">₽ в месяц</div>
      <p class="calc-hint">
        {{ formatMoney(income) }} − {{ formatMoney(totalExpenses) }} = {{ formatMoney(freeMoney) }} ₽
      </p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

const income = computed(() => Number(props.modelValue.income) || 0)
const totalExpenses = computed(() => {
  const base = Object.values(props.modelValue.expenses).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = props.modelValue.customExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})
const freeMoney = computed(() => Math.max(0, income.value - totalExpenses.value))
</script>

<script>
import { computed } from 'vue'
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
}

.big-currency {
  font-size: 20px;
  opacity: 0.8;
  margin-bottom: 32px;
}

.calc-hint {
  font-size: 14px;
  opacity: 0.6;
  font-family: monospace;
}
</style>

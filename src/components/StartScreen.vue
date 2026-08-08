<template>
  <div class="onboarding">
    <!-- Прогресс-бар -->
    <div class="progress-bar">
      <div class="progress-fill" :style="{ width: (step / 5) * 100 + '%' }"></div>
    </div>
    <div class="progress-dots">
      <div v-for="i in 5" :key="i" class="dot" :class="{ active: i <= step, current: i === step }"></div>
    </div>

    <!-- Экраны -->
    <transition name="slide" mode="out-in">
      <!-- ЭКРАН 1: Доход -->
      <div v-if="step === 1" class="screen" key="1">
        <div class="screen-label">Шаг 1 из 5</div>
        <h2>Сколько зарабатываешь<br>в месяц?</h2>
        <div class="input-wrapper">
          <input
            type="number"
            v-model.number="income"
            placeholder="0"
            inputmode="numeric"
            autofocus
          />
          <span class="currency">₽</span>
        </div>
        <p class="hint">Сумма после вычета налогов</p>
      </div>

      <!-- ЭКРАН 2: Обязательные расходы -->
      <div v-else-if="step === 2" class="screen" key="2">
        <div class="screen-label">Шаг 2 из 5</div>
        <h2>Сколько уходит<br>на обязательное?</h2>

        <div class="expenses-list">
          <div v-for="(cat, key) in expenseCategories" :key="key" class="expense-row">
            <span class="expense-name">{{ cat }}</span>
            <div class="expense-input">
              <input
                type="number"
                v-model.number="expenses[key]"
                placeholder="0"
                inputmode="numeric"
              />
              <span class="currency-sm">₽</span>
            </div>
          </div>

          <!-- Кастомные расходы -->
          <div v-for="(custom, idx) in customExpenses" :key="'c' + idx" class="expense-row custom">
            <input
              type="text"
              v-model="custom.name"
              placeholder="Название"
              class="custom-name"
            />
            <div class="expense-input">
              <input
                type="number"
                v-model.number="custom.amount"
                placeholder="0"
                inputmode="numeric"
              />
              <span class="currency-sm">₽</span>
            </div>
            <button class="remove-btn" @click="removeCustom(idx)">×</button>
          </div>

          <button class="add-custom-btn" @click="addCustomExpense">
            + Добавить своё
          </button>
        </div>

        <div class="total-expenses">
          <span>Итого обязательных:</span>
          <span class="total-amount">{{ formatMoney(totalExpenses) }} ₽</span>
        </div>
      </div>

      <!-- ЭКРАН 3: Свободные деньги -->
      <div v-else-if="step === 3" class="screen" key="3">
        <div class="screen-label">Шаг 3 из 5</div>
        <h2>Твои свободные деньги</h2>
        <div class="big-number">{{ formatMoney(freeMoney) }}</div>
        <div class="big-currency">₽ в месяц</div>
        <p class="calc-hint">
          {{ formatMoney(income) }} − {{ formatMoney(totalExpenses) }} = {{ formatMoney(freeMoney) }} ₽
        </p>
      </div>

      <!-- ЭКРАН 4: Цель -->
      <div v-else-if="step === 4" class="screen" key="4">
        <div class="screen-label">Шаг 4 из 5</div>
        <h2>Копишь на что-то?</h2>

        <div class="goals-list">
          <button
            v-for="g in goals"
            :key="g.id"
            class="goal-btn"
            :class="{ selected: selectedGoal === g.id }"
            @click="selectGoal(g.id)"
          >
            <span class="goal-icon">{{ g.icon }}</span>
            <span class="goal-name">{{ g.name }}</span>
            <span v-if="g.recommended" class="badge">Рекомендуем</span>
          </button>
        </div>

        <!-- Сумма цели (редактируемая) -->
        <div v-if="selectedGoal" class="goal-amount-wrapper">
          <label>Сумма цели</label>
          <div class="input-wrapper small">
            <input
              type="number"
              v-model.number="goalAmount"
              placeholder="0"
              inputmode="numeric"
            />
            <span class="currency">₽</span>
          </div>
        </div>

        <button class="skip-btn" @click="skipGoal">Пропустить</button>

        <!-- Слайдер процента -->
        <div v-if="selectedGoal" class="slider-section">
          <label>
            Направляешь на цель:
            <span class="percent-value">{{ savingsPercent }}%</span>
          </label>
          <input
            type="range"
            v-model.number="savingsPercent"
            min="0"
            max="100"
            step="5"
          />

          <!-- Живые числа -->
          <div class="live-stats">
            <div class="stat">
              <div class="stat-value">{{ goalMonthsText }}</div>
              <div class="stat-label">Срок достижения</div>
            </div>
            <div class="stat">
              <div class="stat-value">{{ formatMoney(dailyLimit) }} ₽</div>
              <div class="stat-label">Можно тратить в день</div>
            </div>
          </div>
        </div>
      </div>

      <!-- ЭКРАН 5: Результат -->
      <div v-else-if="step === 5" class="screen" key="5">
        <div class="screen-label">Готово </div>
        <h2>Сегодня можно<br>потратить</h2>
        <div class="hero-number">{{ formatMoney(dailyLimit) }}</div>
        <div class="hero-currency">рублей</div>
        <p class="result-hint">
          При доходе {{ formatMoney(income) }} ₽ и цели {{ selectedGoal ? formatMoney(goalAmount) + ' ₽' : 'нет' }}
        </p>
      </div>
    </transition>

    <!-- Навигация -->
    <div class="navigation">
      <button v-if="step > 1" class="btn-back" @click="prev">← Назад</button>
      <button v-if="step < 5" class="btn-next" @click="next" :disabled="!canProceed">
        Дальше
      </button>
      <button v-if="step === 5" class="btn-finish" @click="finish">
        Начать пользоваться
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// === СОСТОЯНИЕ ===
const step = ref(1)
const income = ref(0)

const expenseCategories = {
  rent: 'Аренда',
  utilities: 'Коммуналка',
  food: 'Еда',
  transport: 'Транспорт',
  credits: 'Кредиты'
}

const expenses = ref({
  rent: 0,
  utilities: 0,
  food: 0,
  transport: 0,
  credits: 0
})

const customExpenses = ref([])

const goals = [
  { id: 'safety', name: 'Подушка безопасности', icon: '️', recommended: true, defaultAmount: null },
  { id: 'car', name: 'Машина', icon: '🚗', recommended: false, defaultAmount: 1500000 },
  { id: 'vacation', name: 'Отпуск', icon: '✈️', recommended: false, defaultAmount: 100000 }
]

const selectedGoal = ref(null)
const goalAmount = ref(0)
const savingsPercent = ref(0)

const DAYS_TO_SALARY = 30 // дефолт, можно менять в настройках позже

// === ВЫЧИСЛЕНИЯ ===

const totalExpenses = computed(() => {
  const base = Object.values(expenses.value).reduce((sum, val) => sum + (Number(val) || 0), 0)
  const custom = customExpenses.value.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  return base + custom
})

const freeMoney = computed(() => {
  return Math.max(0, (Number(income.value) || 0) - totalExpenses.value)
})

const goalMonthly = computed(() => {
  if (!selectedGoal.value) return 0
  return freeMoney.value * (savingsPercent.value / 100)
})

const goalMonths = computed(() => {
  if (!selectedGoal.value || goalMonthly.value === 0) return null
  return Math.ceil(goalAmount.value / goalMonthly.value)
})

const goalMonthsText = computed(() => {
  if (goalMonths.value === null) return '—'
  if (goalMonths.value < 12) return goalMonths.value + ' мес'
  const years = Math.floor(goalMonths.value / 12)
  const months = goalMonths.value % 12
  if (months === 0) return years + ' г'
  return years + ' г ' + months + ' мес'
})

const dailyLimit = computed(() => {
  const remaining = freeMoney.value - goalMonthly.value
  return Math.max(0, Math.floor(remaining / DAYS_TO_SALARY))
})

const canProceed = computed(() => {
  if (step.value === 1) return income.value > 0
  return true
})

// === МЕТОДЫ ===

function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function addCustomExpense() {
  customExpenses.value.push({ name: '', amount: 0 })
}

function removeCustom(idx) {
  customExpenses.value.splice(idx, 1)
}

function selectGoal(goalId) {
  selectedGoal.value = goalId
  const goal = goals.find(g => g.id === goalId)
  if (goal.defaultAmount !== null) {
    goalAmount.value = goal.defaultAmount
  } else {
    // Подушка безопасности = 3 обязательных расхода
    goalAmount.value = totalExpenses.value * 3
  }
  savingsPercent.value = 20 // дефолт
}

function skipGoal() {
  selectedGoal.value = null
  goalAmount.value = 0
  savingsPercent.value = 0
}

// Автопересчёт подушки безопасности при изменении расходов
watch(totalExpenses, (newTotal) => {
  if (selectedGoal.value === 'safety') {
    goalAmount.value = newTotal * 3
  }
})

function next() {
  if (step.value < 5) step.value++
}

function prev() {
  if (step.value > 1) step.value--
}

function finish() {
  const settings = {
    income: Number(income.value) || 0,
    rent: Number(expenses.value.rent) || 0,
    utilities: Number(expenses.value.utilities) || 0,
    food: Number(expenses.value.food) || 0,
    transport: Number(expenses.value.transport) || 0,
    credits: Number(expenses.value.credits) || 0,
    customExpenses: customExpenses.value,
    savings: Number(savingsPercent.value) || 0,
    goal: selectedGoal.value,
    goalName: selectedGoal.value === 'custom' ? customGoalName.value : null,
    goalAmount: Number(goalAmount.value) || 0,
    daysToSalary: DAYS_TO_SALARY,
    savingsUsed: 0,
    debt: 0          // ← добавь это
  }

  localStorage.setItem('daylimit-settings', JSON.stringify(settings))
  router.push('/')
}

</script>

<style scoped>
.onboarding {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%);
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Прогресс */
.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 16px;
}

.progress-fill {
  height: 100%;
  background: white;
  transition: width 0.4s ease;
}

.progress-dots {
  display: flex;
  gap: 8px;
  justify-content: center;
  margin-bottom: 32px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: all 0.3s;
}

.dot.active {
  background: rgba(255, 255, 255, 0.7);
}

.dot.current {
  background: white;
  transform: scale(1.3);
}

/* Экраны */
.screen {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 0;
}

.screen-label {
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
  margin-bottom: 32px;
  max-width: 400px;
}

/* Поля ввода */
.input-wrapper {
  position: relative;
  width: 100%;
  max-width: 320px;
  margin-bottom: 16px;
}

.input-wrapper.small {
  max-width: 240px;
}

input[type="number"],
input[type="text"] {
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

input[type="number"]:focus,
input[type="text"]:focus {
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
}

.currency-sm {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 16px;
  font-weight: 600;
  opacity: 0.7;
}

.hint {
  font-size: 14px;
  opacity: 0.6;
  margin-top: 8px;
}

/* Экран 2: Расходы */
.expenses-list {
  width: 100%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 20px;
}

.expense-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.expense-row.custom {
  flex-wrap: wrap;
}

.expense-name {
  font-size: 16px;
  font-weight: 500;
  min-width: 120px;
  text-align: left;
}

.expense-input {
  position: relative;
  flex: 1;
  max-width: 140px;
}

.expense-input input {
  padding: 12px 40px 12px 12px;
  font-size: 18px;
  text-align: right;
}

.custom-name {
  flex: 1;
  min-width: 120px;
  padding: 12px;
  font-size: 16px;
  text-align: left;
}

.remove-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(239, 68, 68, 0.2);
  color: #ef4444;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.add-custom-btn {
  padding: 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.add-custom-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
}

.total-expenses {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  font-size: 16px;
  width: 100%;
  max-width: 400px;
}

.total-amount {
  font-size: 20px;
  font-weight: 700;
}

/* Экран 3: Большое число */
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

/* Экран 4: Цели */
.goals-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  max-width: 400px;
  margin-bottom: 20px;
}

.goal-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
}

.goal-btn.selected {
  background: rgba(255, 255, 255, 0.2);
  border-color: white;
}

.goal-icon {
  font-size: 24px;
}

.goal-name {
  flex: 1;
}

.badge {
  padding: 4px 8px;
  background: #10b981;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
}

.goal-amount-wrapper {
  margin-bottom: 16px;
}

.goal-amount-wrapper label {
  display: block;
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 8px;
}

.skip-btn {
  padding: 12px 24px;
  background: transparent;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
  cursor: pointer;
  margin-bottom: 24px;
}

.skip-btn:hover {
  color: white;
}

.slider-section {
  width: 100%;
  max-width: 400px;
}

.slider-section label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 12px;
}

.percent-value {
  font-size: 24px;
  color: #fbbf24;
}

input[type="range"] {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
  margin-bottom: 24px;
}

input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: 50%;
  cursor: pointer;
}

.live-stats {
  display: flex;
  gap: 16px;
  justify-content: space-between;
}

.stat {
  flex: 1;
  padding: 16px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.7;
}

/* Экран 5: Результат */
.hero-number {
  font-size: 80px;
  font-weight: 800;
  line-height: 1;
  margin: 16px 0;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-currency {
  font-size: 24px;
  opacity: 0.8;
  margin-bottom: 32px;
}

.result-hint {
  font-size: 14px;
  opacity: 0.6;
  max-width: 300px;
  line-height: 1.5;
}

/* Навигация */
.navigation {
  display: flex;
  gap: 12px;
  margin-top: auto;
  padding-top: 24px;
}

.btn-back {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.btn-next,
.btn-finish {
  flex: 1;
  padding: 20px;
  background: white;
  border: none;
  border-radius: 16px;
  color: #4338ca;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s;
}

.btn-next:active,
.btn-finish:active {
  transform: scale(0.98);
}

.btn-next:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Анимации */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.3s ease;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>
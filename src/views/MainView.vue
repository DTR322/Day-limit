<template>
  <div class="container">
    <!-- Главная карточка -->
    <div class="limit-card" :class="limitCardClass">
      <div class="limit-label">{{ data.hasDebtScenario ? 'Нужно отложить сегодня' : 'Можно потратить сегодня' }}</div>
      <div class="limit-amount">{{ formatMoney(displayLimit) }} ₽</div>
      <div v-if="data.hasDebtScenario" class="limit-hint limit-debt-hint">
        Ежедневный долг: {{ formatMoney(data.dailyDebt) }} ₽ • До зарплаты {{ data.daysRemaining }} {{ getDaysWord(data.daysRemaining) }}
      </div>
      <div v-else class="limit-hint">
        До зарплаты {{ data.daysRemaining }} {{ getDaysWord(data.daysRemaining) }}
      </div>
    </div>

    <!-- Прогресс -->
    <div class="progress-card">
      <div class="progress-header">
        <span>{{ data.hasDebtScenario ? 'Отложено сегодня' : 'Потрачено сегодня' }}</span>
        <span>{{ formatMoney(data.totalSpentToday) }} ₽ / {{ formatMoney(data.dailyLimit) }} ₽</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :class="progressFillClass" :style="{ width: progressPercent + '%' }"></div>
      </div>
    </div>

    <!-- Метрики -->
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">{{ data.daysRemaining }}</div>
        <div class="metric-label">дней до зарплаты</div>
      </div>
      <div class="metric">
        <div class="metric-value">{{ formatMoney(data.availableMoney) }} ₽</div>
        <div class="metric-label">{{ data.hasDebtScenario ? 'дефицит в месяц' : 'доступно в месяц' }}</div>
      </div>

      <!-- Цель / долг -->
      <div class="metric" :class="{ 'goal-metric': showGoalProgress }">
        <div v-if="showGoalProgress" class="goal-progress-wrap">
          <div class="goal-progress-fill" :style="{ width: data.goalProgressPercent + '%' }"></div>
        </div>

        <div class="metric-value" :class="{ debt: data.debt > 0 || data.hasDebtScenario }">
          <template v-if="data.hasDebtScenario">
            -{{ formatMoney(data.monthlyDeficit) }} ₽
          </template>
          <template v-else-if="data.debt > 0">
            -{{ formatMoney(data.debt) }} ₽
          </template>
          <template v-else>
            {{ formatMoney(data.savedNow) }} ₽
          </template>
        </div>

        <div class="metric-label">
          <template v-if="data.hasDebtScenario">
            ежемесячный долг
          </template>
          <template v-else-if="data.debt > 0">
            долг
          </template>
          <template v-else-if="data.initialGoal > 0">
            из {{ formatMoney(data.initialGoal) }} ₽ · {{ data.goalProgressPercent }}%
          </template>
          <template v-else>
            цель не выбрана
          </template>
        </div>

        <div v-if="showGoalProgress" class="metric-label goal-name">
          {{ data.goalTitle }}
        </div>
      </div>
    </div>

    <!-- Траты -->
    <div class="section-header">
      <h3>Сегодня</h3>
      <button class="text-btn" @click="clearTodayExpenses" v-if="todayTransactions.length > 0">Очистить</button>
    </div>

    <div class="transactions">
      <div v-if="todayTransactions.length === 0" class="empty-state">
        <div class="empty-icon">💸</div>
        <div class="empty-title">Пока нет трат</div>
      </div>
      <div
        v-else
        class="transaction"
        v-for="t in todayTransactions"
        :key="t.id"
      >
        <div class="transaction-left">
          <div class="transaction-icon">{{ getCategoryIcon(t.name) }}</div>
          <div>
            <div class="transaction-name">{{ getTransactionName(t.name) }}</div>
            <div class="transaction-time">{{ formatTime(t.date) }}</div>
          </div>
        </div>
        <div class="transaction-right">
          <div class="transaction-amount">-{{ formatMoney(t.amount) }} ₽</div>
          <button class="delete-btn" @click="deleteTransaction(t.id)">×</button>
        </div>
      </div>
    </div>

    <!-- Кнопки -->
    <button class="btn-add" @click="showAddModal = true">+ Добавить трату</button>
    <button class="btn-settings" @click="goToSettings">Изменить бюджет</button>
  </div>

  <!-- Модалка добавления траты -->
  <AddExpenseModal
    v-model="showAddModal"
    @transaction="handleTransaction"
  />
  <InstallPrompt />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AddExpenseModal from '../components/modals/AddExpenseModal.vue'
import InstallPrompt from '../components/InstallPrompt.vue'

const router = useRouter()

// === СОСТОЯНИЕ ===
const settings = ref(null)
const transactions = ref([])
const showAddModal = ref(false)

// === КОНСТАНТЫ ===
const LIMIT_WARNING_THRESHOLD = 1500
const LIMIT_DANGER_THRESHOLD = 500
const PROGRESS_WARNING_PERCENT = 50
const PROGRESS_DANGER_PERCENT = 80

// === УТИЛИТЫ ===
function formatMoney(amount) {
  return new Intl.NumberFormat('ru-RU').format(Math.round(Math.abs(amount || 0)))
}

function getDaysWord(n) {
  const abs = Math.abs(n) % 100
  const n1 = abs % 10
  if (abs > 10 && abs < 20) return 'дней'
  if (n1 > 1 && n1 < 5) return 'дня'
  if (n1 === 1) return 'день'
  return 'дней'
}

function getMonthKey() {
  const today = new Date()
  return `daylimit-transactions-${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function isToday(dateStr) {
  const today = new Date().toDateString()
  return new Date(dateStr).toDateString() === today
}

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

function getCategoryIcon(name) {
  const match = name.match(/^[\p{Emoji}]/u)
  return match ? match[0] : '💳'
}

function getTransactionName(name) {
  return name.split(' ').slice(1).join(' ') || name
}

// === ЗАГРУЗКА/СОХРАНЕНИЕ ===
function loadSettings() {
  const saved = localStorage.getItem('daylimit-settings')
  if (!saved) {
    router.push('/settings')
    return null
  }
  const data = JSON.parse(saved)
  if (data.totalSavings === undefined) data.totalSavings = 0
  if (data.totalDebt === undefined) data.totalDebt = 0
  return data
}

function saveTransactions() {
  localStorage.setItem(getMonthKey(), JSON.stringify(transactions.value))
}

function loadTransactions() {
  const saved = localStorage.getItem(getMonthKey())
  transactions.value = saved ? JSON.parse(saved) : []
}

// === ВЫЧИСЛЕНИЯ ===
// Вся финансовая модель ВЫВОДИТСЯ из settings + трат, ничего не мутирует.
// Каскад покрытия трат: свободные деньги -> накопления в цели -> долг.
const data = computed(() => {
  if (!settings.value) {
    return {
      fixedExpenses: 0,
      freeMoney: 0,
      availableMoney: 0,
      debt: 0,
      monthlyDeficit: 0,
      dailyDebt: 0,
      daysRemaining: 0,
      dailyLimit: 0,
      totalSpentMonth: 0,
      totalSpentToday: 0,
      remainingToday: 0,
      initialGoal: 0,
      savedNow: 0,
      goalProgressPercent: 0,
      goalTitle: '',
      hasDebtScenario: false
    }
  }

  const s = settings.value
  const rent = Number(s.rent) || 0
  const utilities = Number(s.utilities) || 0
  const food = Number(s.food) || 0
  const transport = Number(s.transport) || 0
  const credits = Number(s.credits) || 0

  const customExpensesTotal = Array.isArray(s.customExpenses)
    ? s.customExpenses.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0)
    : 0

  const fixedExpenses = rent + utilities + food + transport + credits + customExpensesTotal
  const income = Number(s.income) || 0

  const monthlyDeficit = fixedExpenses - income > 0 ? fixedExpenses - income : 0
  const freeMoney = income - fixedExpenses
  const hasDebtScenario = monthlyDeficit > 0

  // === АВТОМАТИЧЕСКИЙ ПЕРЕСЧЁТ ДНЕЙ ДО ЗП ===
  const lastPayday = s.lastPayday ? new Date(s.lastPayday) : new Date()
  const payCycle = Number(s.payCycle) || 30
  const today = new Date()

  // Считаем дату следующей зарплаты
  const nextPayday = new Date(lastPayday)
  nextPayday.setDate(nextPayday.getDate() + payCycle)

  // Если сегодня уже после следующей ЗП — сдвигаем на цикл вперёд
  while (nextPayday < today) {
    nextPayday.setDate(nextPayday.getDate() + payCycle)
  }

  // Дней до следующей ЗП (минимум 1)
  const daysRemaining = Math.max(1, Math.ceil((nextPayday - today) / (1000 * 60 * 60 * 24)))

  const savingsPercent = Number(s.savings) || 0

  let monthlyContribution = 0
  let monthlyBudget = 0
  let dailyLimit = 0
  let dailyDebt = 0

  if (hasDebtScenario) {
    monthlyContribution = 0
    monthlyBudget = 0
    dailyDebt = monthlyDeficit / daysRemaining
    dailyLimit = 0
  } else {
    monthlyContribution = freeMoney * (savingsPercent / 100)
    monthlyBudget = freeMoney - monthlyContribution
    // Дневной лимит = свободные деньги / дней до ЗП
    dailyLimit = monthlyBudget / daysRemaining
  }

  const totalSpentMonth = transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalSpentToday = transactions.value
    .filter(t => isToday(t.date))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  // === КАСКАД: свободные -> накопления -> долг ===
  const initialGoal = Number(s.goalAmount) || 0
  const totalSavings = Number(s.totalSavings) || 0

  const goalBase = hasDebtScenario
    ? 0
    : (s.goal === 'debt' ? 0 : totalSavings) + monthlyContribution

  const overspend = hasDebtScenario
    ? totalSpentMonth
    : Math.max(0, totalSpentMonth - monthlyBudget)

  const goalSaved = Math.max(0, goalBase - overspend)
  const debt = hasDebtScenario
    ? totalSpentMonth
    : Math.max(0, overspend - goalBase)

  const availableMoney = hasDebtScenario
    ? monthlyDeficit
    : Math.max(0, monthlyBudget - totalSpentMonth)

  const remainingToday = dailyLimit - totalSpentToday

  const savedNow = goalSaved
  const goalProgressPercent = initialGoal > 0
    ? Math.min(100, Math.round((savedNow / initialGoal) * 100))
    : 0

  const goalTitles = {
    safety: 'Подушка безопасности',
    car: 'Машина',
    vacation: 'Отпуск',
    debt: 'Закрыть долги',
    custom: s.customGoalName || 'Моя цель'
  }
  const goalTitle = goalTitles[s.goal] || 'Цель'

  return {
    fixedExpenses,
    freeMoney,
    availableMoney,
    debt,
    monthlyDeficit,
    dailyDebt,
    hasDebtScenario,
    daysRemaining,
    dailyLimit,
    totalSpentMonth,
    totalSpentToday,
    remainingToday,
    initialGoal,
    savedNow,
    goalProgressPercent,
    goalTitle
  }
})

const showGoalProgress = computed(() =>
  !data.value.hasDebtScenario && data.value.debt <= 0 && data.value.initialGoal > 0
)

const displayLimit = computed(() => {
  if (data.value.hasDebtScenario) return data.value.dailyDebt
  return Math.max(0, data.value.remainingToday)
})

const limitCardClass = computed(() => {
  if (data.value.hasDebtScenario) return 'debt-scenario'
  const remainingToday = data.value.remainingToday
  if (remainingToday < 0) return 'overspent'
  if (remainingToday < LIMIT_DANGER_THRESHOLD) return 'danger'
  if (remainingToday < LIMIT_WARNING_THRESHOLD) return 'warning'
  return ''
})

const progressPercent = computed(() => {
  const dailyLimit = data.value.dailyLimit
  const totalSpentToday = data.value.totalSpentToday
  if (data.value.hasDebtScenario && data.value.dailyDebt > 0) {
    return Math.min((totalSpentToday / data.value.dailyDebt) * 100, 100)
  }
  return dailyLimit > 0 ? Math.min((totalSpentToday / dailyLimit) * 100, 100) : 0
})

const progressFillClass = computed(() => {
  const remainingToday = data.value.remainingToday
  const progress = progressPercent.value
  if (data.value.hasDebtScenario) return 'danger'
  if (remainingToday < 0 || progress > PROGRESS_DANGER_PERCENT) return 'danger'
  if (progress > PROGRESS_WARNING_PERCENT) return 'warning'
  return ''
})

const todayTransactions = computed(() => transactions.value.filter(t => isToday(t.date)))

// === ТРАТЫ ===
// Никаких мутаций settings: добавили транзакцию — модель пересчиталась сама.
function handleTransaction(transaction) {
  transactions.value.unshift(transaction)
  saveTransactions()
}

function deleteTransaction(id) {
  const index = transactions.value.findIndex(t => t.id === id)
  if (index === -1) return
  transactions.value.splice(index, 1)
  saveTransactions()
}

function clearTodayExpenses() {
  const today = transactions.value.filter(t => isToday(t.date))
  if (today.length === 0) return

  const totalAmountToday = today.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  if (confirm(`Очистить все траты за сегодня? Будет удалено ${today.length} транзакций на сумму ${formatMoney(totalAmountToday)} ₽`)) {
    today.forEach(t => {
      const idx = transactions.value.findIndex(tr => tr.id === t.id)
      if (idx !== -1) transactions.value.splice(idx, 1)
    })
    saveTransactions()
  }
}

function goToSettings() {
  router.push('/settings')
}

onMounted(() => {
  settings.value = loadSettings()
  if (settings.value) {
    loadTransactions()
  }
})
</script>

<style scoped>
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px;
}

.limit-card {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 20px;
  padding: 24px;
  text-align: center;
  margin-bottom: 16px;
  transition: all 0.3s;
}

.limit-card.warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.limit-card.danger {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.limit-card.overspent {
  background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
}

.limit-card.debt-scenario {
  background: linear-gradient(135deg, #991b1b 0%, #7f1d1d 100%);
}

.limit-debt-hint {
  font-size: 12px;
  opacity: 0.85;
  margin-top: 4px;
}

.limit-label {
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
}

.limit-amount {
  font-size: 42px;
  font-weight: 800;
  line-height: 1;
  margin-bottom: 8px;
}

.limit-hint {
  font-size: 13px;
  opacity: 0.8;
}

.progress-card {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 12px;
}

.progress-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #4f46e5;
  border-radius: 4px;
  transition: width 0.3s ease, background-color 0.3s;
}

.progress-fill.warning {
  background: #f59e0b;
}

.progress-fill.danger {
  background: #ef4444;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.metric {
  background: white;
  border-radius: 12px;
  padding: 16px 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.metric-value {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 4px;
}

.metric-value.debt {
  color: #ef4444;
}

.metric-label {
  font-size: 11px;
  color: #6b7280;
  line-height: 1.3;
}

.goal-metric {
  position: relative;
  overflow: hidden;
}

.goal-progress-wrap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: #e5e7eb;
}

.goal-progress-fill {
  height: 100%;
  background: #10b981;
  transition: width 0.4s ease;
}

.goal-name {
  margin-top: 4px;
  font-weight: 600;
  opacity: 0.9;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.text-btn {
  background: none;
  border: none;
  color: #4f46e5;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.text-btn:hover {
  background: #eef2ff;
}

.transactions {
  background: white;
  border-radius: 16px;
  padding: 16px;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.empty-state {
  text-align: center;
  padding: 32px 16px;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.empty-title {
  font-size: 16px;
  color: #6b7280;
}

.transaction {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f3f4f6;
}

.transaction:last-child {
  border-bottom: none;
}

.transaction-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transaction-icon {
  width: 40px;
  height: 40px;
  background: #f3f4f6;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.transaction-name {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.transaction-time {
  font-size: 12px;
  color: #6b7280;
  margin-top: 2px;
}

.transaction-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.transaction-amount {
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
}

.delete-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.delete-btn:hover {
  background: #fecaca;
}

.btn-add,
.btn-settings {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  margin-bottom: 12px;
}

.btn-add {
  background: #4f46e5;
  color: white;
}

.btn-add:hover {
  background: #4338ca;
}

.btn-settings {
  background: #f3f4f6;
  color: #374151;
}

.btn-settings:hover {
  background: #e5e7eb;
}
</style>
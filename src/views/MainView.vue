<template>
  <div class="container">
    <!-- Главная карточка с лимитом -->
    <div class="limit-card" :class="limitCardClass">
      <div class="limit-label">{{ data.hasDebtScenario ? 'Нужно отложить сегодня' : 'Можно потратить сегодня' }}</div>
      <div class="limit-amount">
        {{ formatMoney(displayLimit) }} <span class="currency-symbol">₽</span>
      </div>

      <!-- Прогресс -->
      <div class="progress-wrap">
        <div class="progress-bar">
          <div class="progress-fill" :class="progressFillClass" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <div class="progress-text">
          {{ data.hasDebtScenario ? 'Отложено' : 'Потрачено' }}
          <span class="progress-values">{{ formatMoney(data.totalSpentToday) }} ₽ / {{ formatMoney(data.dailyLimit) }} ₽</span>
        </div>
      </div>

      <div v-if="data.hasDebtScenario" class="limit-hint limit-debt-hint">
        Ежедневный долг: {{ formatMoney(data.dailyDebt) }} ₽ • До зарплаты {{ data.daysRemaining }} {{ getDaysWord(data.daysRemaining) }}
      </div>
      <div v-else class="limit-hint">
        До зарплаты {{ data.daysRemaining }} {{ getDaysWord(data.daysRemaining) }}
      </div>
    </div>

    <!-- Метрики (3 карточки) -->
    <div class="metrics">
      <div class="metric">
        <div class="metric-value">{{ data.daysRemaining }}</div>
        <div class="metric-label">дней до ЗП</div>
      </div>
      <div class="metric">
        <div class="metric-value">{{ formatMoney(data.availableMoney) }} ₽</div>
        <div class="metric-label">{{ data.hasDebtScenario ? 'дефицит' : 'доступно в месяц' }}</div>
      </div>
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
          <template v-if="data.hasDebtScenario">ежемесячный долг</template>
          <template v-else-if="data.debt > 0">долг</template>
          <template v-else-if="data.initialGoal > 0">
            из {{ formatMoney(data.initialGoal) }} ₽ · {{ data.goalProgressPercent }}%
          </template>
          <template v-else>цель не выбрана</template>
        </div>
        <div v-if="showGoalProgress" class="metric-label goal-name">{{ data.goalTitle }}</div>
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

    <!-- Кнопки действий -->
    <button class="btn-add" @click="showAddModal = true">+ Добавить трату</button>

    <div class="edit-buttons-grid">
      <button class="btn-edit" @click="showIncomeEditor = true">
        <span class="btn-edit-icon">💰</span>
        <span class="btn-edit-text">Доходы</span>
      </button>
      <button class="btn-edit" @click="showExpensesEditor = true">
        <span class="btn-edit-icon">📊</span>
        <span class="btn-edit-text">Расходы</span>
      </button>
      <button class="btn-edit" @click="openGoalEditor">
        <span class="btn-edit-icon">🎯</span>
        <span class="btn-edit-text">Цель</span>
      </button>
      <button class="btn-edit" @click="openBalanceEditor">
        <span class="btn-edit-icon">⚖️</span>
        <span class="btn-edit-text">Долги/Накопления</span>
      </button>
    </div>

    <button class="btn-settings" @click="goToSalarySettings">Настройки зарплаты</button>
  </div>

  <!-- Модалки -->
  <AddExpenseModal
    v-model="showAddModal"
    @transaction="handleTransaction"
  />

  <IncomeEditor
    v-if="showIncomeEditor"
    :income="settings?.income || 0"
    @close="showIncomeEditor = false"
    @save="handleIncomeSave"
  />

  <ExpensesEditor
    v-if="showExpensesEditor"
    :expenses="settingsExpenses"
    :customExpenses="settings?.customExpenses || []"
    :income="settings?.income || 0"
    @close="showExpensesEditor = false"
    @save="handleExpensesSave"
  />

  <GoalEditor
    v-if="showGoalEditor"
    :goal="settings?.goal || ''"
    :goalAmount="settings?.goalAmount || 0"
    :savingsPercent="settings?.savings || 0"
    :customGoalName="settings?.customGoalName || ''"
    :income="settings?.income || 0"
    :expenses="settingsExpenses"
    :customExpenses="settings?.customExpenses || []"
    @close="showGoalEditor = false"
    @save="handleGoalSave"
  />

  <BalanceEditor
    v-if="showBalanceEditor"
    :totalDebt="settings?.totalDebt || 0"
    :totalSavings="settings?.totalSavings || 0"
    @close="showBalanceEditor = false"
    @save="handleBalanceSave"
  />

  <InstallPrompt />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AddExpenseModal from '../components/modals/AddExpenseModal.vue'
import IncomeEditor from "../components/editors/IncomeEditor.vue"
import ExpensesEditor from "../components/editors/ExpensesEditor.vue"
import GoalEditor from "../components/editors/GoalEditor.vue"
import BalanceEditor from "../components/editors/BalanceEditor.vue"
import InstallPrompt from '../components/InstallPrompt.vue'

const router = useRouter()

// === СОСТОЯНИЕ ===
const settings = ref(null)
const transactions = ref([])
const showAddModal = ref(false)

const showIncomeEditor = ref(false)
const showExpensesEditor = ref(false)
const showGoalEditor = ref(false)
const showBalanceEditor = ref(false)

const settingsExpenses = computed(() => settings.value?.expenses || {})

function openGoalEditor() {
  if (!settings.value) return
  if (!settings.value.goal) settings.value.goal = ''
  if (!settings.value.goalAmount) settings.value.goalAmount = 0
  if (!settings.value.savings) settings.value.savings = 0
  if (!settings.value.customGoalName) settings.value.customGoalName = ''
  showGoalEditor.value = true
}

function openBalanceEditor() {
  if (!settings.value) return
  if (settings.value.totalDebt === undefined || settings.value.totalDebt === null) settings.value.totalDebt = 0
  if (settings.value.totalSavings === undefined || settings.value.totalSavings === null) settings.value.totalSavings = 0
  showBalanceEditor.value = true
}

function handleIncomeSave(newIncome) {
  if (!settings.value) return
  settings.value.income = newIncome
  localStorage.setItem('daylimit-settings', JSON.stringify(settings.value))
  showIncomeEditor.value = false
}

function handleExpensesSave(data) {
  if (!settings.value) return
  settings.value.expenses = data.expenses
  settings.value.customExpenses = data.customExpenses || []
  localStorage.setItem('daylimit-settings', JSON.stringify(settings.value))
  showExpensesEditor.value = false
}

function handleGoalSave(data) {
  if (!settings.value) return
  settings.value.goal = data.goal
  settings.value.goalAmount = data.goalAmount
  settings.value.savings = data.savingsPercent
  settings.value.customGoalName = data.customGoalName || ''
  localStorage.setItem('daylimit-settings', JSON.stringify(settings.value))
  showGoalEditor.value = false
}

function handleBalanceSave(data) {
  if (!settings.value) return
  settings.value.totalDebt = data.totalDebt
  settings.value.totalSavings = data.totalSavings
  localStorage.setItem('daylimit-settings', JSON.stringify(settings.value))
  showBalanceEditor.value = false
}

// === КОНСТАНТЫ ===
const LIMIT_WARNING_THRESHOLD = 1500
const LIMIT_DANGER_THRESHOLD = 500
const PROGRESS_WARNING_PERCENT = 50
const PROGRESS_DANGER_PERCENT = 80

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
  console.log('📂 Загружено транзакций:', transactions.value.length)
}

// === ВЫЧИСЛЕНИЯ ===
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

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  let daysRemaining = 30
  const payFrequency = s.payFrequency || 'once'

  if (payFrequency === 'twice' && (s.advanceDate || s.salaryDateTwice)) {
    const dates = []
    if (s.advanceDate) {
      const adv = new Date(s.advanceDate)
      const nextAdv = new Date(adv)
      nextAdv.setDate(nextAdv.getDate() + 30)
      while (nextAdv < today) nextAdv.setDate(nextAdv.getDate() + 30)
      dates.push(nextAdv)
    }
    if (s.salaryDateTwice) {
      const sal = new Date(s.salaryDateTwice)
      const nextSal = new Date(sal)
      nextSal.setDate(nextSal.getDate() + 30)
      while (nextSal < today) nextSal.setDate(nextSal.getDate() + 30)
      dates.push(nextSal)
    }
    if (dates.length > 0) {
      let minDate = dates[0]
      for (const d of dates) if (d < minDate) minDate = d
      daysRemaining = Math.max(1, Math.ceil((minDate - today) / (1000 * 60 * 60 * 24)))
    }
  } else {
    const lastPayday = s.lastPayday ? new Date(s.lastPayday) : new Date()
    const payCycle = Number(s.payCycle) || 30
    const nextPayday = new Date(lastPayday)
    nextPayday.setDate(nextPayday.getDate() + payCycle)
    while (nextPayday < today) nextPayday.setDate(nextPayday.getDate() + payCycle)
    daysRemaining = Math.max(1, Math.ceil((nextPayday - today) / (1000 * 60 * 60 * 24)))
  }

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
    dailyLimit = monthlyBudget / daysRemaining
  }

  const totalSpentMonth = transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalSpentToday = transactions.value.filter(t => isToday(t.date)).reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const initialGoal = Number(s.goalAmount) || 0
  const totalSavings = Number(s.totalSavings) || 0

  const goalBase = hasDebtScenario ? 0 : (s.goal === 'debt' ? 0 : totalSavings) + monthlyContribution
  const overspend = hasDebtScenario ? totalSpentMonth : Math.max(0, totalSpentMonth - monthlyBudget)
  const goalSaved = Math.max(0, goalBase - overspend)
  const debt = hasDebtScenario ? totalSpentMonth : Math.max(0, overspend - goalBase)

  const availableMoney = hasDebtScenario ? monthlyDeficit : Math.max(0, monthlyBudget - totalSpentMonth)
  const remainingToday = dailyLimit - totalSpentToday
  const savedNow = goalSaved
  const goalProgressPercent = initialGoal > 0 ? Math.min(100, Math.round((savedNow / initialGoal) * 100)) : 0

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

const showGoalProgress = computed(() => !data.value.hasDebtScenario && data.value.debt <= 0 && data.value.initialGoal > 0)
const displayLimit = computed(() => data.value.hasDebtScenario ? data.value.dailyDebt : Math.max(0, data.value.remainingToday))

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

const todayTransactions = computed(() => {
  const result = transactions.value.filter(t => isToday(t.date))
  console.log('todayTransactions пересчитан, длина:', result.length)
  return result
})

function handleTransaction(transaction) {
  transactions.value = [transaction, ...transactions.value]
  console.log('Новая транзакция добавлена, всего:', transactions.value.length)
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

function goToSalarySettings() {
  router.push('/salary-settings')
}

onMounted(() => {
  settings.value = loadSettings()
  if (settings.value) {
    loadTransactions()
  }
})
</script>

<style scoped>
/* ——— Общие ——— */
* {
  box-sizing: border-box;
}
.container {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px;
  background: #0B0B10;
  min-height: 100vh;
  color: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ——— Карточка лимита ——— */
.limit-card {
  background: linear-gradient(145deg, #16161F, #1E1E2A);
  border-radius: 28px;
  padding: 32px 24px 24px;
  text-align: center;
  margin-bottom: 20px;
  border: 1px solid rgba(255,255,255,0.04);
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.limit-card::after {
  content: '';
  position: absolute;
  top: -30%;
  right: -20%;
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, rgba(245,166,35,0.06) 0%, transparent 70%);
  pointer-events: none;
}
.limit-card.warning { border-color: rgba(245,158,11,0.3); }
.limit-card.danger { border-color: rgba(239,68,68,0.3); }
.limit-card.overspent { border-color: rgba(239,68,68,0.5); }
.limit-card.debt-scenario { border-color: rgba(239,68,68,0.2); }

.limit-label {
  font-size: 14px;
  font-weight: 500;
  color: #8E8EA0;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin-bottom: 8px;
}
.limit-amount {
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -1px;
  line-height: 1.1;
  color: #ffffff;
}
.currency-symbol {
  font-size: 28px;
  color: #F5A623;
  margin-left: 4px;
}
.limit-hint {
  font-size: 13px;
  color: #8E8EA0;
  margin-top: 12px;
}
.limit-debt-hint { color: #ef4444; }

/* ——— Прогресс ——— */
.progress-wrap {
  margin-top: 20px;
}
.progress-bar {
  height: 4px;
  background: #2A2A38;
  border-radius: 4px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #F5A623;
  border-radius: 4px;
  transition: width 0.5s ease;
}
.progress-fill.warning { background: #f59e0b; }
.progress-fill.danger { background: #ef4444; }
.progress-text {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6B6B80;
  margin-top: 8px;
}
.progress-values { color: #B0B0C0; }

/* ——— Метрики ——— */
.metrics {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 10px;
  margin-bottom: 24px;
}
.metric {
  background: #16161F;
  border-radius: 16px;
  padding: 16px 10px;
  text-align: center;
  border: 1px solid rgba(255,255,255,0.03);
}
.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: #ffffff;
}
.metric-value.debt { color: #ef4444; }
.metric-label {
  font-size: 11px;
  color: #6B6B80;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}
.goal-metric { position: relative; overflow: hidden; }
.goal-progress-wrap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: #2A2A38;
}
.goal-progress-fill {
  height: 100%;
  background: #F5A623;
  transition: width 0.4s ease;
}
.goal-name {
  font-size: 10px;
  color: #8E8EA0;
  margin-top: 2px;
  opacity: 0.8;
}

/* ——— Траты ——— */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.section-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
  margin: 0;
}
.text-btn {
  background: none;
  border: none;
  color: #6B6B80;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}
.text-btn:hover { color: #F5A623; }

.transactions {
  background: #16161F;
  border-radius: 20px;
  padding: 8px 0;
  margin-bottom: 24px;
  border: 1px solid rgba(255,255,255,0.03);
}
.empty-state {
  text-align: center;
  padding: 32px 16px;
}
.empty-icon { font-size: 40px; margin-bottom: 8px; opacity: 0.4; }
.empty-title { font-size: 15px; color: #6B6B80; }

.transaction {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
}
.transaction:last-child { border-bottom: none; }
.transaction-left { display: flex; align-items: center; gap: 12px; }
.transaction-icon {
  width: 40px;
  height: 40px;
  background: #1E1E2A;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}
.transaction-name { font-size: 14px; font-weight: 500; color: #ffffff; }
.transaction-time { font-size: 12px; color: #6B6B80; }
.transaction-right { display: flex; align-items: center; gap: 12px; }
.transaction-amount { font-size: 14px; font-weight: 600; color: #ef4444; }
.delete-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(239,68,68,0.15);
  color: #ef4444;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.delete-btn:hover { background: rgba(239,68,68,0.25); }

/* ——— Кнопки ——— */
.btn-add {
  width: 100%;
  padding: 16px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  margin-bottom: 12px;
  background: linear-gradient(135deg, #F5A623, #E0941A);
  color: #0B0B10;
}
.btn-add:hover { transform: scale(1.01); box-shadow: 0 8px 24px rgba(245,166,35,0.2); }
.btn-add:active { transform: scale(0.97); }

.edit-buttons-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 12px;
}
.btn-edit {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 12px;
  background: #16161F;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 500;
  color: #C0C0D0;
}
.btn-edit:hover { background: #1E1E2A; border-color: rgba(255,255,255,0.1); }
.btn-edit:active { transform: scale(0.97); }
.btn-edit-icon { font-size: 18px; }
.btn-edit-text { font-size: 13px; }

.btn-settings {
  width: 100%;
  padding: 16px;
  font-size: 15px;
  font-weight: 500;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: rgba(255,255,255,0.04);
  color: #8E8EA0;
}
.btn-settings:hover { background: rgba(255,255,255,0.08); }

/* ——— Адаптив ——— */
@media (max-width: 420px) {
  .container { padding: 16px; }
  .limit-amount { font-size: 44px; }
  .metrics { gap: 6px; }
  .metric-value { font-size: 17px; }
  .btn-edit-text { font-size: 12px; }
}
</style>
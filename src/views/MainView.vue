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
      <div class="metric">
        <div class="metric-value" :class="{ debt: data.debt > 0 || data.hasDebtScenario }">
          <template v-if="data.hasDebtScenario">
            -{{ formatMoney(data.monthlyDeficit) }} ₽
          </template>
          <template v-else-if="data.debt > 0">
            -{{ formatMoney(data.debt) }} ₽
          </template>
          <template v-else>
            {{ formatMoney(data.remainingGoal) }} ₽
          </template>
        </div>
        <div class="metric-label">
          <template v-if="data.hasDebtScenario">
            ежемесячный долг
          </template>
          <template v-else-if="data.debt > 0">
            долг
          </template>
          <template v-else>
            из {{ formatMoney(data.initialGoal) }} ₽
          </template>
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

  <!-- Модалка добавления траты (вынесена в отдельный компонент) -->
  <AddExpenseModal 
    v-model="showAddModal" 
    @transaction="handleTransaction"
  />
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AddExpenseModal from '../components/modals/AddExpenseModal.vue'

const router = useRouter()

// === СОСТОЯНИЕ ===
const settings = ref(null)
const transactions = ref([])
const showAddModal = ref(false)

// === КОНСТАНТЫ ===
// Пороговые значения для цветовой индикации лимита (в рублях)
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
  // Извлекаем эмодзи из начала названия категории
  const match = name.match(/^[\p{Emoji}]/u)
  return match ? match[0] : '💳'
}

function getTransactionName(name) {
  // Возвращаем название без эмодзи
  return name.split(' ').slice(1).join(' ') || name
}

// === ЗАГРУЗКА/СОХРАНЕНИЕ ДАННЫХ ===
function loadSettings() {
  const saved = localStorage.getItem('daylimit-settings')
  if (!saved) {
    router.push('/settings')
    return null
  }
  const data = JSON.parse(saved)
  if (data.savingsUsed === undefined) data.savingsUsed = 0
  if (data.debt === undefined) data.debt = 0
  localStorage.setItem('daylimit-settings', JSON.stringify(data))
  return data
}

function saveSettings() {
  localStorage.setItem('daylimit-settings', JSON.stringify(settings.value))
}

function loadTransactions() {
  const saved = localStorage.getItem(getMonthKey())
  transactions.value = saved ? JSON.parse(saved) : []
}

function saveTransactions() {
  localStorage.setItem(getMonthKey(), JSON.stringify(transactions.value))
}

// === ВЫЧИСЛЕНИЯ ===
const data = computed(() => {
  if (!settings.value) {
    return { 
      fixedExpenses: 0, 
      freeMoney: 0, 
      availableMoney: 0, 
      remainingGoal: 0, 
      debt: 0, 
      monthlyDeficit: 0,
      dailyDebt: 0,
      daysRemaining: 0, 
      dailyLimit: 0, 
      totalSpentMonth: 0, 
      totalSpentToday: 0, 
      remainingToday: 0,
      initialGoal: 0,
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
  
  // Новая логика: если расходы > доходов, то это ежемесячный дефицит (долг)
  const monthlyDeficit = fixedExpenses - income > 0 ? fixedExpenses - income : 0
  const freeMoney = income - fixedExpenses
  const hasDebtScenario = monthlyDeficit > 0

  let savingsPercent = Number(s.savings) || 0
  let monthlyBudget = 0
  let dailyLimit = 0
  let dailyDebt = 0

  if (hasDebtScenario) {
    // Сценарий с долгом: никаких целей, весь дефицит делится на дни
    savingsPercent = 0
    monthlyBudget = 0
    dailyDebt = monthlyDeficit / daysRemaining
    dailyLimit = 0
  } else {
    // Обычный сценарий: есть свободные деньги
    monthlyBudget = freeMoney - (freeMoney * (savingsPercent / 100))
    const daysRemaining = Math.max(1, Number(s.daysToSalary) || 30)
    dailyLimit = monthlyBudget / daysRemaining
  }

  const daysRemaining = Math.max(1, Number(s.daysToSalary) || 30)

  const totalSpentMonth = transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalSpentToday = transactions.value
    .filter(t => isToday(t.date))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const savingsUsed = Number(s.savingsUsed) || 0
  const debt = Number(s.debt) || 0

  // Доступные деньги: в сценарии с долгом показываем дефицит, иначе бюджет + цель - траты
  let availableMoney = 0
  if (hasDebtScenario) {
    availableMoney = monthlyDeficit
  } else {
    availableMoney = Math.max(0, monthlyBudget + savingsUsed - totalSpentMonth)
  }
  const remainingToday = dailyLimit - totalSpentToday

  // Сколько реально осталось от изначальной цели
  const initialGoal = Number(s.goalAmount) || 0
  const remainingGoal = hasDebtScenario ? 0 : Math.max(0, initialGoal - savingsUsed)

  return {
    fixedExpenses, 
    freeMoney, 
    availableMoney, 
    remainingGoal,
    debt, 
    monthlyDeficit,
    dailyDebt,
    hasDebtScenario,
    daysRemaining, 
    dailyLimit,
    totalSpentMonth, 
    totalSpentToday, 
    remainingToday,
    initialGoal
  }
})

const displayLimit = computed(() => {
  // В сценарии с долгом показываем dailyDebt, иначе remainingToday
  if (data.value.hasDebtScenario) {
    return data.value.dailyDebt
  }
  return Math.max(0, data.value.remainingToday)
})

const limitCardClass = computed(() => {
  // В сценарии с долгом всегда показываем красный/тревожный стиль
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
  // В сценарии с долгом прогресс показывает отношение потраченного к ежедневному долгу
  if (data.value.hasDebtScenario && data.value.dailyDebt > 0) {
    return Math.min((totalSpentToday / data.value.dailyDebt) * 100, 100)
  }
  return dailyLimit > 0 ? Math.min((totalSpentToday / dailyLimit) * 100, 100) : 0
})

const progressFillClass = computed(() => {
  const remainingToday = data.value.remainingToday
  const progress = progressPercent.value
  // В сценарии с долгом всегда показываем danger
  if (data.value.hasDebtScenario) return 'danger'
  if (remainingToday < 0 || progress > PROGRESS_DANGER_PERCENT) return 'danger'
  if (progress > PROGRESS_WARNING_PERCENT) return 'warning'
  return ''
})

const todayTransactions = computed(() => transactions.value.filter(t => isToday(t.date)))

// === ЛОГИКА ТРАТ ===
function handleTransaction(transaction) {
  executeTransactionLogic(transaction)
}

function executeTransactionLogic(transaction) {
  const s = settings.value
  
  // В сценарии с долгом: любая трата увеличивает долг
  if (data.value.hasDebtScenario) {
    s.debt = (Number(s.debt) || 0) + Number(transaction.amount)
    transactions.value.unshift(transaction)
    saveSettings()
    saveTransactions()
    return
  }
  
  const wouldRemain = data.value.availableMoney - transaction.amount

  if (wouldRemain < 0) {
    // Перерасход! Автоматически покрываем из цели, потом из долга.
    const overspend = Math.abs(wouldRemain)
    const currentGoal = Number(s.goalAmount) || 0
    const currentSavingsUsed = Number(s.savingsUsed) || 0
    const availableInGoal = Math.max(0, currentGoal - currentSavingsUsed)

    if (availableInGoal >= overspend) {
      // Цели хватает, чтобы покрыть перерасход
      s.savingsUsed = currentSavingsUsed + overspend
    } else {
      // Цель кончилась, остаток уходит в долг
      s.savingsUsed = currentSavingsUsed + availableInGoal
      s.debt = (Number(s.debt) || 0) + (overspend - availableInGoal)
    }
    saveSettings()
  }

  // Добавляем транзакцию в любом случае
  transactions.value.unshift(transaction)
  saveTransactions()
}

function deleteTransaction(id) {
  const index = transactions.value.findIndex(t => t.id === id)
  if (index === -1) return

  // Удаляем транзакцию
  transactions.value.splice(index, 1)
  
  // Пересчитываем savingsUsed и debt с нуля на основе оставшихся транзакций
  recalculateFinancialState()
  
  saveTransactions()
}

function clearTodayExpenses() {
  const today = transactions.value.filter(t => isToday(t.date))
  if (today.length === 0) return
  
  const totalAmountToday = today.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  
  if (confirm(`Очистить все траты за сегодня? Будет удалено ${today.length} транзакций на сумму ${formatMoney(totalAmountToday)} ₽`)) {
    // Удаляем все сегодняшние транзакции
    today.forEach(t => {
      const idx = transactions.value.findIndex(tr => tr.id === t.id)
      if (idx !== -1) {
        transactions.value.splice(idx, 1)
      }
    })
    
    // Пересчитываем состояние
    recalculateFinancialState()
    saveTransactions()
  }
}

/**
 * Пересчитывает savingsUsed и debt с нуля на основе текущих транзакций
 * Это исправляет баг с некорректным возвратом средств при удалении транзакций
 */
function recalculateFinancialState() {
  const s = settings.value
  const income = Number(s.income) || 0
  const fixedExpenses = (Number(s.rent) || 0) + (Number(s.utilities) || 0) + (Number(s.food) || 0) + 
                        (Number(s.transport) || 0) + (Number(s.credits) || 0) + 
                        (Array.isArray(s.customExpenses) ? s.customExpenses.reduce((sum, item) => sum + (Number(item?.amount) || 0), 0) : 0)
  const monthlyDeficit = fixedExpenses - income > 0 ? fixedExpenses - income : 0
  const freeMoney = income - fixedExpenses
  const hasDebtScenario = monthlyDeficit > 0
  
  let savingsPercent = Number(s.savings) || 0
  let monthlyBudget = 0
  
  if (hasDebtScenario) {
    // Сценарий с долгом: целей нет
    savingsPercent = 0
    monthlyBudget = 0
  } else {
    // Обычный сценарий
    monthlyBudget = freeMoney - (freeMoney * (savingsPercent / 100))
  }
  
  // Считаем общие траты за месяц после удаления
  const newTotalSpentMonth = transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  
  // Логика восстановления: пересчитываем с нуля
  if (hasDebtScenario) {
    // В сценарии с долгом всё идет в покрытие дефицита
    s.debt = newTotalSpentMonth
    s.savingsUsed = 0
  } else if (newTotalSpentMonth <= monthlyBudget) {
    // Перерасхода нет — сбрасываем всё
    s.debt = 0
    s.savingsUsed = 0
  } else {
    // Есть перерасход — всё ушло в долг
    s.debt = newTotalSpentMonth - monthlyBudget
    s.savingsUsed = Number(s.goalAmount) || 0
  }
  
  saveSettings()
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
/* Стили остаются без изменений */
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

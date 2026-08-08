<template>
  <div class="container">
    <!-- Главная карточка -->
    <div class="limit-card" :class="limitCardClass">
      <div class="limit-label">Можно потратить сегодня</div>
      <div class="limit-amount">{{ formatMoney(displayLimit) }} ₽</div>
      <div class="limit-hint">До зарплаты {{ data.daysRemaining }} {{ getDaysWord(data.daysRemaining) }}</div>
    </div>

    <!-- Прогресс -->
    <div class="progress-card">
      <div class="progress-header">
        <span>Потрачено сегодня</span>
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
      <div class="metric-label">доступно в месяц</div>
    </div>
    <div class="metric">
      <div class="metric-value" :class="{ debt: data.debt > 0 }">
        {{ data.debt > 0 ? '-' + formatMoney(data.debt) + ' ₽' : formatMoney(data.remainingGoal) + ' ₽' }}
      </div>
      <div class="metric-label">{{ data.debt > 0 ? 'долг' : 'из ' + formatMoney(data.initialGoal) + ' ₽' }}</div>
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
      <div v-else class="transaction" v-for="t in todayTransactions" :key="t.id">
        <div class="transaction-left">
          <div class="transaction-icon">{{ t.name.split(' ')[0] }}</div>
          <div>
            <div class="transaction-name">{{ t.name.split(' ').slice(1).join(' ') || t.name }}</div>
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

  <!-- Модалка добавления траты (БЕЗ выбора покрытия перерасхода) -->
  <div class="modal" v-show="showAddModal">
    <div class="modal-backdrop" @click="showAddModal = false"></div>
    <div class="modal-sheet">
      <div class="modal-handle"></div>
      <h3 class="modal-title">Новая трата</h3>

      <div class="categories">
        <button class="cat-btn" @click="processTransaction('☕ Кофе', 300)">
          <span class="cat-icon">☕</span><span class="cat-name">Кофе</span><span class="cat-amount">300 ₽</span>
        </button>
        <button class="cat-btn" @click="processTransaction('🍔 Обед', 600)">
          <span class="cat-icon">🍔</span><span class="cat-name">Обед</span><span class="cat-amount">600 ₽</span>
        </button>
        <button class="cat-btn" @click="processTransaction('🚕 Такси', 400)">
          <span class="cat-icon">🚕</span><span class="cat-name">Такси</span><span class="cat-amount">400 ₽</span>
        </button>
        <button class="cat-btn" @click="processTransaction('🎬 Кино', 500)">
          <span class="cat-icon">🎬</span><span class="cat-name">Кино</span><span class="cat-amount">500 ₽</span>
        </button>
        <button class="cat-btn" @click="processTransaction('🛍 Покупки', 1500)">
          <span class="cat-icon">🛍</span><span class="cat-name">Покупки</span><span class="cat-amount">1500 ₽</span>
        </button>
        <button class="cat-btn" @click="processTransaction('🍷 Бар', 2000)">
          <span class="cat-icon">🍷</span><span class="cat-name">Бар</span><span class="cat-amount">2000 ₽</span>
        </button>
      </div>

      <div class="custom-amount">
        <label>Своя сумма</label>
        <div class="input-group">
          <input type="number" v-model.number="customAmount" placeholder="0"/>
          <span class="suffix">₽</span>
        </div>
      </div>

      <div class="modal-buttons">
        <button class="btn-secondary" @click="showAddModal = false">Отмена</button>
        <button class="btn-primary" @click="processCustomTransaction">Добавить</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// === СОСТОЯНИЕ ===
const settings = ref(null)
const transactions = ref([])
const customAmount = ref(0)
const showAddModal = ref(false)

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

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// === ДАННЫЕ ===
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

// === МАТЕМАТИКА ===
const data = computed(() => {
  if (!settings.value) {
    return { fixedExpenses: 0, freeMoney: 0, availableMoney: 0, remainingGoal: 0, debt: 0, daysRemaining: 0, dailyLimit: 0, totalSpentMonth: 0, totalSpentToday: 0, remainingToday: 0 }
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
  const freeMoney = Math.max(0, income - fixedExpenses)

  const savingsPercent = Number(s.savings) || 0
  const monthlyBudget = freeMoney - (freeMoney * (savingsPercent / 100))

  const daysRemaining = Math.max(1, Number(s.daysToSalary) || 30)

  const totalSpentMonth = transactions.value.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
  const totalSpentToday = transactions.value
    .filter(t => isToday(t.date))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)

  const savingsUsed = Number(s.savingsUsed) || 0
  const debt = Number(s.debt) || 0

  // Доступные деньги = бюджет + то, что мы уже вытащили из цели - потраченное
  const availableMoney = Math.max(0, monthlyBudget + savingsUsed - totalSpentMonth)
  const dailyLimit = availableMoney / daysRemaining
  const remainingToday = dailyLimit - totalSpentToday

  // Сколько реально осталось от изначальной цели
  const initialGoal = Number(s.goalAmount) || 0
  const remainingGoal = Math.max(0, initialGoal - savingsUsed)

  return {
    fixedExpenses, freeMoney, availableMoney, remainingGoal,
    debt, daysRemaining, dailyLimit,
    totalSpentMonth, totalSpentToday, remainingToday
  }
})

const displayLimit = computed(() => Math.max(0, data.value.remainingToday))

const limitCardClass = computed(() => {
  const r = data.value.remainingToday
  if (r < 0) return 'overspent'
  if (r < 500) return 'danger'
  if (r < 1500) return 'warning'
  return ''
})

const progressPercent = computed(() => {
  const d = data.value
  return d.dailyLimit > 0 ? Math.min((d.totalSpentToday / d.dailyLimit) * 100, 100) : 0
})

const progressFillClass = computed(() => {
  if (data.value.remainingToday < 0 || progressPercent.value > 80) return 'danger'
  if (progressPercent.value > 50) return 'warning'
  return ''
})

const todayTransactions = computed(() => transactions.value.filter(t => isToday(t.date)))

// === ЛОГИКА ТРАТ (АВТОМАТИЧЕСКАЯ) ===
function processTransaction(name, amount) {
  const transaction = {
    id: generateId(),
    name: name,
    amount: amount,
    date: new Date().toISOString()
  }
  executeTransactionLogic(transaction)
}

function processCustomTransaction() {
  if (customAmount.value > 0) {
    const transaction = {
      id: generateId(),
      name: '💳 Покупка',
      amount: customAmount.value,
      date: new Date().toISOString()
    }
    executeTransactionLogic(transaction)
  }
  showAddModal.value = false
  customAmount.value = 0
}

function executeTransactionLogic(transaction) {
  const wouldRemain = data.value.availableMoney - transaction.amount

  if (wouldRemain < 0) {
    // Перерасход! Автоматически покрываем из цели, потом из долга.
    const overspend = Math.abs(wouldRemain)
    const s = settings.value
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
  showAddModal.value = false
}

function deleteTransaction(id) {
  const index = transactions.value.findIndex(t => t.id === id)
  if (index === -1) return

  const t = transactions.value[index]
  transactions.value.splice(index, 1)

  // При удалении траты "возвращаем" деньги: сначала гасим долг, потом восстанавливаем цель
  const s = settings.value
  if (s.debt > 0) {
    s.debt = Math.max(0, s.debt - t.amount)
  } else if (s.savingsUsed > 0) {
    s.savingsUsed = Math.max(0, s.savingsUsed - t.amount)
  }

  saveSettings()
  saveTransactions()
}

function clearTodayExpenses() {
  const today = transactions.value.filter(t => isToday(t.date))
  if (today.length === 0) return
  if (confirm('Очистить все траты за сегодня?')) {
    today.forEach(t => {
      const idx = transactions.value.findIndex(tr => tr.id === t.id)
      if (idx !== -1) {
        transactions.value.splice(idx, 1)
        // Упрощенный откат для массового удаления
        const s = settings.value
        if (s.debt > 0) s.debt = Math.max(0, s.debt - t.amount)
        else if (s.savingsUsed > 0) s.savingsUsed = Math.max(0, s.savingsUsed - t.amount)
      }
    })
    saveSettings()
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
/* Твои стили остаются без изменений */
</style>
<template>
  <div class="settings-view">
    <div class="container">
      <div class="header">
        <button class="back-btn" @click="goBack">← Назад</button>
        <h2>Настройки зарплаты</h2>
      </div>

      <!-- Выбор режима выплаты -->
      <div class="section">
        <label class="section-label">Как часто приходит зарплата?</label>
        <div class="toggle-group">
          <button 
            class="toggle-btn" 
            :class="{ active: payFrequency === 'once' }"
            @click="setFrequency('once')"
          >
            1 раз в месяц
          </button>
          <button 
            class="toggle-btn" 
            :class="{ active: payFrequency === 'twice' }"
            @click="setFrequency('twice')"
          >
            2 раза в месяц
          </button>
        </div>
      </div>

      <!-- Дата последней зарплаты для режима 1 раз в месяц -->
      <div v-if="payFrequency === 'once'" class="section">
        <label class="section-label">Дата зарплаты</label>
        <div class="date-input-wrapper">
          <input
            type="date"
            :value="salaryDate"
            @input="updateSalaryDate($event.target.value)"
            class="date-input"
          />
        </div>
        <p class="hint">Укажи дату последней выплаты зарплаты</p>
      </div>

      <!-- Даты зарплат для режима 2 раза в месяц -->
      <div v-if="payFrequency === 'twice'" class="section">
        <label class="section-label">Даты аванса и основной зарплаты</label>
        
        <div class="date-row">
          <span class="date-label">Аванс:</span>
          <input
            type="date"
            :value="advanceDate"
            @input="updateAdvanceDate($event.target.value)"
            class="date-input small"
          />
        </div>
        
        <div class="date-row">
          <span class="date-label">Зарплата:</span>
          <input
            type="date"
            :value="salaryDateTwice"
            @input="updateSalaryDateTwice($event.target.value)"
            class="date-input small"
          />
        </div>
        
        <p class="hint">Укажи даты последних выплат</p>
      </div>

      <!-- Распределение зарплаты по дням (только для 2 раз в месяц) -->
      <div v-if="payFrequency === 'twice' && advanceDate && salaryDateTwice" class="section distribution-section">
        <label class="section-label">Распределение месячного бюджета</label>
        <p class="distribution-hint">
          Как распределить свободные деньги между выплатами?
        </p>
        
        <div class="slider-container">
          <div class="slider-labels">
            <span>Аванс: {{ advancePercent }}%</span>
            <span>ЗП: {{ 100 - advancePercent }}%</span>
          </div>
          <input
            type="range"
            :value="advancePercent"
            @input="updateAdvancePercent(Number($event.target.value))"
            min="0"
            max="100"
            step="5"
            class="percent-slider"
          />
        </div>
        
        <div class="distribution-info">
          <div class="dist-item">
            <span class="dist-label">До аванса:</span>
            <span class="dist-days">{{ daysToAdvance }} дн.</span>
          </div>
          <div class="dist-item">
            <span class="dist-label">Между выплатами:</span>
            <span class="dist-days">{{ daysBetweenPaydays }} дн.</span>
          </div>
        </div>
      </div>

      <!-- Общая информация -->
      <div class="section info-section">
        <div class="info-card">
          <div class="info-title">Ближайшая зарплата</div>
          <div class="info-value">{{ nextPaydayDisplay }}</div>
          <div class="info-subtitle">через {{ daysRemaining }} {{ getDaysWord(daysRemaining) }}</div>
        </div>
      </div>

      <button class="save-btn" @click="saveSettings">Сохранить</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Состояние
const payFrequency = ref('once') // 'once' | 'twice'
const salaryDate = ref('') // для 1 раза в месяц
const advanceDate = ref('') // для 2 раз в месяц (аванс)
const salaryDateTwice = ref('') // для 2 раз в месяц (основная ЗП)
const advancePercent = ref(50) // процент распределения для аванса

// Загрузка настроек
onMounted(() => {
  const saved = localStorage.getItem('daylimit-settings')
  if (saved) {
    const data = JSON.parse(saved)
    
    // Определяем режим по наличию payFrequency или salaryDates
    if (data.payFrequency) {
      payFrequency.value = data.payFrequency
    } else if (data.salaryDates && Array.isArray(data.salaryDates) && data.salaryDates.length > 1) {
      payFrequency.value = 'twice'
    }
    
    // Загружаем даты
    if (data.lastPayday) {
      salaryDate.value = data.lastPayday
    }
    if (data.advanceDate) {
      advanceDate.value = data.advanceDate
    }
    if (data.salaryDateTwice) {
      salaryDateTwice.value = data.salaryDateTwice
    }
    if (data.advancePercent !== undefined) {
      advancePercent.value = data.advancePercent
    }
  }
})

// Вычисляемые значения
const daysRemaining = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (payFrequency.value === 'once') {
    if (!salaryDate.value) return 30
    
    const lastPayday = new Date(salaryDate.value)
    const nextPayday = new Date(lastPayday)
    nextPayday.setDate(nextPayday.getDate() + 30)
    
    while (nextPayday < today) {
      nextPayday.setDate(nextPayday.getDate() + 30)
    }
    
    return Math.max(1, Math.ceil((nextPayday - today) / (1000 * 60 * 60 * 24)))
  } else {
    // Режим 2 раза в месяц
    const dates = []
    
    if (advanceDate.value) {
      const adv = new Date(advanceDate.value)
      const nextAdv = new Date(adv)
      nextAdv.setDate(nextAdv.getDate() + 30)
      dates.push(nextAdv)
    }
    
    if (salaryDateTwice.value) {
      const sal = new Date(salaryDateTwice.value)
      const nextSal = new Date(sal)
      nextSal.setDate(nextSal.getDate() + 30)
      dates.push(nextSal)
    }
    
    if (dates.length === 0) return 15
    
    // Находим ближайшую будущую дату
    let minDays = Infinity
    for (const d of dates) {
      while (d < today) {
        d.setDate(d.getDate() + 30)
      }
      const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24))
      if (diff < minDays) minDays = diff
    }
    
    return Math.max(1, minDays)
  }
})

const nextPaydayDisplay = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  if (payFrequency.value === 'once') {
    if (!salaryDate.value) return 'Не указана'
    
    const lastPayday = new Date(salaryDate.value)
    const nextPayday = new Date(lastPayday)
    nextPayday.setDate(nextPayday.getDate() + 30)
    
    while (nextPayday < today) {
      nextPayday.setDate(nextPayday.getDate() + 30)
    }
    
    return nextPayday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
  } else {
    const dates = []
    const labels = []
    
    if (advanceDate.value) {
      const adv = new Date(advanceDate.value)
      const nextAdv = new Date(adv)
      nextAdv.setDate(nextAdv.getDate() + 30)
      while (nextAdv < today) {
        nextAdv.setDate(nextAdv.getDate() + 30)
      }
      dates.push({ date: nextAdv, label: 'Аванс' })
    }
    
    if (salaryDateTwice.value) {
      const sal = new Date(salaryDateTwice.value)
      const nextSal = new Date(sal)
      nextSal.setDate(nextSal.getDate() + 30)
      while (nextSal < today) {
        nextSal.setDate(nextSal.getDate() + 30)
      }
      dates.push({ date: nextSal, label: 'Зарплата' })
    }
    
    if (dates.length === 0) return 'Не указаны'
    
    // Сортируем по дате
    dates.sort((a, b) => a.date - b.date)
    const nearest = dates[0]
    
    return `${nearest.label}: ${nearest.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
  }
})

const daysToAdvance = computed(() => {
  if (!advanceDate.value) return 0
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const adv = new Date(advanceDate.value)
  const nextAdv = new Date(adv)
  nextAdv.setDate(nextAdv.getDate() + 30)
  while (nextAdv < today) {
    nextAdv.setDate(nextAdv.getDate() + 30)
  }
  return Math.max(0, Math.ceil((nextAdv - today) / (1000 * 60 * 60 * 24)))
})

const daysBetweenPaydays = computed(() => {
  if (!advanceDate.value || !salaryDateTwice.value) return 0
  
  const adv = new Date(advanceDate.value)
  const sal = new Date(salaryDateTwice.value)
  
  // Нормализуем до текущего месяца
  const today = new Date()
  while (adv < today) {
    adv.setDate(adv.getDate() + 30)
  }
  while (sal < today) {
    sal.setDate(sal.getDate() + 30)
  }
  
  // Считаем разницу
  const diff = Math.abs(Math.ceil((sal - adv) / (1000 * 60 * 60 * 24)))
  return diff > 0 ? diff : 15
})

// Методы
function setFrequency(freq) {
  payFrequency.value = freq
}

function updateSalaryDate(value) {
  salaryDate.value = value
}

function updateAdvanceDate(value) {
  advanceDate.value = value
}

function updateSalaryDateTwice(value) {
  salaryDateTwice.value = value
}

function updateAdvancePercent(value) {
  advancePercent.value = value
}

function getDaysWord(n) {
  const abs = Math.abs(n) % 100
  const n1 = abs % 10
  if (abs > 10 && abs < 20) return 'дней'
  if (n1 > 1 && n1 < 5) return 'дня'
  if (n1 === 1) return 'день'
  return 'дней'
}

function saveSettings() {
  const saved = localStorage.getItem('daylimit-settings')
  const data = saved ? JSON.parse(saved) : {}
  
  // Сохраняем режим и даты
  data.payFrequency = payFrequency.value
  data.lastPayday = salaryDate.value
  data.advanceDate = advanceDate.value
  data.salaryDateTwice = salaryDateTwice.value
  data.advancePercent = advancePercent.value
  
  // Для совместимости сохраняем salaryDates массив
  if (payFrequency.value === 'twice') {
    data.salaryDates = [advanceDate.value, salaryDateTwice.value].filter(Boolean)
  } else {
    data.salaryDates = [salaryDate.value].filter(Boolean)
  }
  
  localStorage.setItem('daylimit-settings', JSON.stringify(data))
  
  alert('Настройки сохранены!')
  goBack()
}

function goBack() {
  router.push('/')
}
</script>

<style scoped>
.settings-view {
  min-height: 100vh;
  background: #f9fafb;
  padding: 20px;
}

.container {
  max-width: 480px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  font-size: 16px;
  color: #4f46e5;
  cursor: pointer;
  padding: 8px;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #1f2937;
}

.section {
  background: white;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.section-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  margin-bottom: 12px;
}

.toggle-group {
  display: flex;
  gap: 8px;
}

.toggle-btn {
  flex: 1;
  padding: 14px;
  border: 2px solid #e5e7eb;
  background: white;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn.active {
  border-color: #4f46e5;
  background: #4f46e5;
  color: white;
}

.date-input-wrapper {
  margin-bottom: 8px;
}

.date-input {
  width: 100%;
  padding: 14px;
  font-size: 16px;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  outline: none;
  background: white;
  color: #1f2937;
}

.date-input.small {
  max-width: 200px;
}

.date-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.date-label {
  font-size: 14px;
  color: #6b7280;
  min-width: 80px;
}

.hint {
  font-size: 12px;
  color: #9ca3af;
  margin: 8px 0 0 0;
}

.distribution-hint {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 16px;
}

.slider-container {
  margin-bottom: 16px;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  font-weight: 600;
  color: #4f46e5;
  margin-bottom: 8px;
}

.percent-slider {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  outline: none;
  -webkit-appearance: none;
}

.percent-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  background: #4f46e5;
  border-radius: 50%;
  cursor: pointer;
}

.distribution-info {
  display: flex;
  justify-content: space-around;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
}

.dist-item {
  text-align: center;
}

.dist-label {
  display: block;
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.dist-days {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1f2937;
}

.info-section {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
}

.info-card {
  text-align: center;
}

.info-title {
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 8px;
}

.info-value {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.info-subtitle {
  font-size: 13px;
  opacity: 0.8;
}

.save-btn {
  width: 100%;
  padding: 16px;
  background: #4f46e5;
  color: white;
  border: none;
  border-radius: 16px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
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

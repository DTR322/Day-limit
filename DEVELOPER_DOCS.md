# Day Limit — Документация разработчика

## 📋 Обзор проекта

**Day Limit** — Vue.js приложение для управления личным бюджетом с фокусом на дневные лимиты трат. Приложение помогает пользователям распределять свободные деньги между текущими тратами и накоплениями.

### Стек технологий
- **Vue 3** (Composition API, `<script setup>`)
- **Vue Router 4** (маршрутизация)
- **Vite** (сборщик)
- **localStorage** (хранение данных)
- **CSS Modules** (scoped стили)

---

## 🏗 Архитектура проекта

### Структура файлов

```
src/
├── main.js                    # Точка входа приложения
├── App.vue                    # Корневой компонент с <router-view>
├── style.css                  # Глобальные стили
├── router/
│   └── index.js               # Конфигурация маршрутов
├── views/                     # Страницы приложения (route-level компоненты)
│   └── MainView.vue           # Главная страница (дневной лимит, траты)
├── components/
│   ├── modals/                # Переиспользуемые модальные окна
│   │   └── AddExpenseModal.vue    # Модалка добавления траты
│   └── onboarding/            # Компоненты онбординга (пошагового)
│       ├── OnboardingContainer.vue  # Контейнер онбординга (оркестратор)
│       ├── IncomeStep.vue     # Шаг 1: Ввод дохода
│       ├── ExpensesStep.vue   # Шаг 2: Обязательные расходы
│       ├── SummaryStep.vue    # Шаг 3: Свободные деньги (summary)
│       ├── GoalStep.vue       # Шаг 4: Цель накоплений
│       └── ResultStep.vue     # Шаг 5: Финальный результат
└── components/ (legacy)
    ├── MainScreen.vue         # ⚠️ Устарел, использовать MainView.vue
    └── StartScreen.vue        # ⚠️ Устарел, использовать onboarding/*
```

### Архитектурные принципы

1. **Разделение ответственности**:
   - `views/` — компоненты уровня страниц, привязанные к маршрутам
   - `components/` — переиспользуемые UI-компоненты
   - `components/modals/` — изолированные модальные окна с чётким API
   - `components/onboarding/` — модульные шаги онбординга

2. **Масштабируемость онбординга**:
   - Каждый шаг онбординга — независимый компонент
   - `OnboardingContainer` управляет состоянием всех шагов через единый объект `onboardingData`
   - Легко добавлять новые шаги: создать компонент → добавить в `STEP_COMPONENTS`

3. **Изоляция модалок**:
   - Модалки вынесены в отдельные компоненты
   - Используют `v-model` для управления видимостью
   - Эмитят события вместо прямого изменения состояния родителя

---

## 🛣 Маршрутизация

| Path | Component | Описание |
|------|-----------|----------|
| `/` | `MainView.vue` | Главная страница: дневной лимит, прогресс, список трат |
| `/settings` | `OnboardingContainer.vue` | Онбординг/настройка бюджета |

### Добавление нового маршрута

```javascript
// src/router/index.js
import NewView from '../views/NewView.vue'

const routes = [
  // ... existing routes
  {
    path: '/new-route',
    name: 'NewRoute',
    component: NewView
  }
]
```

---

## 💾 Хранение данных (localStorage)

### Ключи localStorage

| Ключ | Тип | Описание |
|------|-----|----------|
| `daylimit-settings` | Object | Настройки пользователя (доход, расходы, цели) |
| `daylimit-transactions-YYYY-MM` | Array | Транзакции за месяц |

### Структура `daylimit-settings`

```typescript
interface Settings {
  income: number;                    // Месячный доход (после налогов)
  rent: number;                      // Аренда
  utilities: number;                 // Коммуналка
  food: number;                      // Еда
  transport: number;                 // Транспорт
  credits: number;                   // Кредиты
  customExpenses: CustomExpense[];   // Кастомные расходы
  savings: number;                   // Процент на цель (0-100)
  goal: string | null;               // ID выбранной цели
  goalAmount: number;                // Сумма цели
  daysToSalary: number;              // Дней до зарплаты (default: 30)
  savingsUsed: number;               // Сколько уже взято из цели
  debt: number;                      // Текущий долг (перерасход)
}

interface CustomExpense {
  name: string;
  amount: number;
}
```

### Структура транзакции

```typescript
interface Transaction {
  id: string;           // Уникальный ID (timestamp + random)
  name: string;         // Название категории (с эмодзи)
  amount: number;       // Сумма траты
  date: string;         // ISO 8601 timestamp
}
```

---

## 🧮 Алгоритмы расчётов

### 1. Расчёт свободных денег

```javascript
const fixedExpenses = rent + utilities + food + transport + credits + customExpensesTotal
const freeMoney = Math.max(0, income - fixedExpenses)
```

### 2. Расчёт месячного бюджета

```javascript
const savingsPercent = settings.savings  // 0-100
const monthlyBudget = freeMoney - (freeMoney * (savingsPercent / 100))
```

### 3. Расчёт дневного лимита

```javascript
const daysRemaining = Math.max(1, settings.daysToSalary)
const availableMoney = Math.max(0, monthlyBudget + savingsUsed - totalSpentMonth)
const dailyLimit = availableMoney / daysRemaining
const remainingToday = dailyLimit - totalSpentToday
```

### 4. Логика перерасхода (Overspend)

При добавлении траты, превышающей доступные деньги:

```javascript
const wouldRemain = availableMoney - transaction.amount

if (wouldRemain < 0) {
  const overspend = Math.abs(wouldRemain)
  const availableInGoal = Math.max(0, goalAmount - savingsUsed)
  
  if (availableInGoal >= overspend) {
    // Цели хватает
    settings.savingsUsed += overspend
  } else {
    // Цель кончилась, остаток в долг
    settings.savingsUsed += availableInGoal
    settings.debt += (overspend - availableInGoal)
  }
}
```

### 5. Пересчёт при удалении транзакции

**Важно**: При удалении транзакции состояние (`debt`, `savingsUsed`) пересчитывается **с нуля**, а не эвристически:

```javascript
function recalculateFinancialState() {
  const newTotalSpentMonth = transactions.reduce((sum, t) => sum + t.amount, 0)
  
  if (newTotalSpentMonth <= monthlyBudget) {
    // Перерасхода нет
    settings.debt = 0
    settings.savingsUsed = 0
  } else {
    // Есть перерасход
    settings.debt = newTotalSpentMonth - monthlyBudget
    settings.savingsUsed = settings.goalAmount
  }
}
```

---

## 🎨 Визуальные состояния

### Цветовая индикация лимита

| Состояние | Порог (₽) | Класс | Цвет карточки |
|-----------|-----------|-------|---------------|
| Normal | ≥ 1500 | — | Фиолетовый (#4f46e5) |
| Warning | 500–1500 | `warning` | Оранжевый (#f59e0b) |
| Danger | < 500 | `danger` | Красный (#ef4444) |
| Overspent | < 0 | `overspent` | Тёмно-красный (#7f1d1d) |

### Индикация прогресса

| Состояние | Прогресс | Класс | Цвет полоски |
|-----------|----------|-------|--------------|
| Normal | ≤ 50% | — | Фиолетовый |
| Warning | 50–80% | `warning` | Оранжевый |
| Danger | > 80% или перерасход | `danger` | Красный |

---

## 📦 Детальное описание компонентов

### MainView.vue

**Расположение**: `src/views/MainView.vue`

**Ответственность**: Отображение дневного лимита, прогресса, метрик и списка трат.

#### Props
Нет (корневой компонент страницы)

#### State
```javascript
const settings = ref(null)      // Объект настроек
const transactions = ref([])    // Массив транзакций
const showAddModal = ref(false) // Видимость модалки
```

#### Computed
| Имя | Тип | Описание |
|-----|-----|----------|
| `data` | Object | Все рассчитанные метрики (см. раздел "Алгоритмы") |
| `displayLimit` | Number | Максимум(0, remainingToday) |
| `limitCardClass` | String | CSS-класс для цветовой индикации |
| `progressPercent` | Number | Процент потраченного сегодня (0-100) |
| `progressFillClass` | String | Класс цвета прогресс-бара |
| `todayTransactions` | Array | Отфильтрованные сегодняшние транзакции |

#### Methods
| Метод | Параметры | Возвращает | Описание |
|-------|-----------|------------|----------|
| `formatMoney(amount)` | Number | String | Форматирование числа (1000 → "1 000") |
| `getDaysWord(n)` | Number | String | Склонение слова "день/дня/дней" |
| `getMonthKey()` | — | String | Ключ localStorage для текущего месяца |
| `isToday(dateStr)` | String | Boolean | Проверка даты на "сегодня" |
| `formatTime(dateStr)` | String | String | Форматирование времени (HH:MM) |
| `getCategoryIcon(name)` | String | String | Извлечение эмодзи из названия |
| `getTransactionName(name)` | String | String | Название без эмодзи |
| `handleTransaction(tx)` | Transaction | void | Обработка новой траты от модалки |
| `deleteTransaction(id)` | String | void | Удаление транзакции + пересчёт |
| `clearTodayExpenses()` | — | void | Массовое удаление за сегодня |
| `recalculateFinancialState()` | — | void | Пересчёт debt/savingsUsed с нуля |
| `goToSettings()` | — | void | Навигация на /settings |

#### Events (от дочерних компонентов)
- `@transaction` (от AddExpenseModal) — новая трата

---

### OnboardingContainer.vue

**Расположение**: `src/components/onboarding/OnboardingContainer.vue`

**Ответственность**: Оркестрация шагов онбординга, управление состоянием, навигация.

#### Props
Нет

#### Emits
Нет

#### State
```javascript
const currentStep = ref(1)
const onboardingData = ref({
  income: 0,
  expenses: { rent: 0, utilities: 0, food: 0, transport: 0, credits: 0 },
  customExpenses: [],
  selectedGoal: null,
  goalAmount: 0,
  savingsPercent: 0
})
```

#### Computed
| Имя | Тип | Описание |
|-----|-----|----------|
| `currentStepComponent` | Component | Динамический компонент для текущего шага |
| `canProceed` | Boolean | Можно ли перейти дальше (валидация шага 1) |

#### Methods
| Метод | Описание |
|-------|----------|
| `next()` | Переход к следующему шагу |
| `prev()` | Переход к предыдущему шагу |
| `finish()` | Сохранение настроек в localStorage, редирект на главную |

---

### AddExpenseModal.vue

**Расположение**: `src/components/modals/AddExpenseModal.vue`

**Ответственность**: UI для добавления траты (preset категории + кастомная сумма).

#### Props
| Имя | Тип | Обязательный | Описание |
|-----|-----|--------------|----------|
| `modelValue` | Boolean | Да | Видимость модалки (v-model) |

#### Emits
| Событие | Payload | Описание |
|---------|---------|----------|
| `update:modelValue` | Boolean | Закрытие модалки |
| `transaction` | Transaction | Новая трата готова к обработке |

#### State
```javascript
const customAmount = ref(0)
```

#### Constants
```javascript
const PRESET_CATEGORIES = [
  { name: '☕ Кофе', amount: 300, icon: '☕' },
  { name: '🍔 Обед', amount: 600, icon: '🍔' },
  // ...
]
```

#### Methods
| Метод | Параметры | Описание |
|-------|-----------|----------|
| `handleCategoryClick(cat)` | Category | Эмитит транзакцию, закрывает модалку |
| `handleCustomTransaction()` | — | Создаёт транзакцию с кастомной суммой |
| `generateId()` | — | Генерирует уникальный ID |

---

### IncomeStep.vue

**Расположение**: `src/components/onboarding/IncomeStep.vue`

**Props**: `modelValue: Object` (общие данные онбординга)

**Emits**: `update:modelValue`

**Поля ввода**:
- `income` — месячный доход

---

### ExpensesStep.vue

**Расположение**: `src/components/onboarding/ExpensesStep.vue`

**Props**: `modelValue: Object`

**Emits**: `update:modelValue`

**Структура данных**:
```javascript
{
  expenses: { rent, utilities, food, transport, credits },
  customExpenses: [{ name, amount }]
}
```

**Методы**:
- `emitExpenseUpdate(key, value)` — обновление стандартной категории
- `emitCustomNameUpdate(idx, value)` — имя кастомного расхода
- `emitCustomAmountUpdate(idx, value)` — сумма кастомного расхода
- `addCustomExpense()` — добавить кастомный расход
- `removeCustom(idx)` — удалить кастомный расход

---

### SummaryStep.vue

**Расположение**: `src/components/onboarding/SummaryStep.vue`

**Props**: `modelValue: Object`

**Computed**:
- `income` — из modelValue
- `totalExpenses` — сумма всех расходов
- `freeMoney` — income − totalExpenses

---

### GoalStep.vue

**Расположение**: `src/components/onboarding/GoalStep.vue`

**Props**: `modelValue: Object`

**Emits**: `update:modelValue`

**Constants**:
```javascript
const PRESET_GOALS = [
  { id: 'safety', name: 'Подушка безопасности', icon: '🛡️', recommended: true },
  { id: 'car', name: 'Машина', icon: '🚗', defaultAmount: 1500000 },
  { id: 'vacation', name: 'Отпуск', icon: '✈️', defaultAmount: 100000 }
]
```

**Computed**:
- `freeMoney` — свободные деньги
- `goalMonthly` — ежемесячный взнос на цель
- `goalMonths` — срок достижения цели
- `goalMonthsText` — человекочитаемый срок
- `dailyLimit` — дневной лимит после вычета цели

**Watch**:
- Автоматический пересчёт `goalAmount` для "Подушки безопасности" при изменении расходов

---

### ResultStep.vue

**Расположение**: `src/components/onboarding/ResultStep.vue`

**Props**: `modelValue: Object`

**Computed**:
- `dailyLimit` — финальный дневной лимит
- `income` — доход
- `selectedGoal` — выбранная цель
- `goalAmount` — сумма цели

---

## 🐛 Исправленные баги

### 1. Некорректный возврат средств при удалении транзакции
**Файл**: `MainView.vue` (функция `recalculateFinancialState`)

**Проблема**: При удалении транзакции `debt` и `savingsUsed` восстанавливались эвристически, что приводило к несоответствиям.

**Решение**: Полный пересчёт состояния с нуля на основе оставшихся транзакций.

### 2. Отсутствие валидации суммы траты
**Файл**: `AddExpenseModal.vue`

**Проблема**: Можно было ввести отрицательную сумму или 0.

**Решение**: 
- Атрибут `min="1"` на input
- `:disabled="customAmount <= 0"` на кнопке

### 3. Модалка не закрывалась при нулевой сумме
**Файл**: `AddExpenseModal.vue`

**Проблема**: Модалка закрывалась даже если `customAmount === 0`.

**Решение**: Закрытие только внутри условия `if (customAmount.value > 0)`.

### 4. Дублирование CSS-стилей
**Файл**: `style.css`

**Решение**: Удалены дубли, добавлена структурированная навигация.

### 5. Неиспользуемый код в App.vue
**Файл**: `App.vue`

**Решение**: Удалены дублирующие глобальные стили.

---

## 🔧 Расширение функционала

### Добавление нового шага онбординга

1. Создать компонент в `src/components/onboarding/NewStep.vue`
2. Добавить импорт в `OnboardingContainer.vue`
3. Добавить в `STEP_COMPONENTS`
4. Увеличить `TOTAL_STEPS`

### Добавление preset категории трат

Изменить массив в `AddExpenseModal.vue`:
```javascript
const PRESET_CATEGORIES = [
  // ...
  { name: '🏋️ Спортзал', amount: 2500, icon: '🏋️' }
]
```

### Добавление типа расхода в онбординге

1. Добавить в `expenseCategories` в `ExpensesStep.vue`
2. Обновить структуру `expenses` в `OnboardingContainer.vue`
3. Обновить `finish()` для сохранения нового поля

---

## ⚠️ Известные ограничения

1. **Один месяц транзакций**: Данные хранятся только за текущий месяц.
2. **Нет синхронизации**: Только localStorage, при очистке данные теряются.
3. **Жёстко заданный период до зарплаты**: 30 дней по умолчанию.
4. **Один пользователь**: Нет поддержки нескольких профилей.

---

## 🚀 Сборка и запуск

### Development
```bash
npm install
npm run dev
```

### Production build
```bash
npm run build
```

### Preview production
```bash
npm run preview
```

---

## 📝 Best Practices

1. **Не изменяйте напрямую `settings.value`** вне функций сохранения.
2. **Всегда вызывайте `recalculateFinancialState()`** после массовых изменений транзакций.
3. **Используйте `v-model` для модалок** вместо прямого управления видимостью.
4. **Добавляйте JSDoc комментарии** к сложным функциям.
5. **Проверяйте существование полей** через `Number(x) || 0`.
6. **Новые страницы создавайте в `views/`**.
7. **Модалки размещайте в `components/modals/`**.

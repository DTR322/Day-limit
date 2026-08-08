# Day Limit — Документация разработчика

## 📋 Обзор проекта

**Day Limit** — Vue.js приложение для управления личным бюджетом с фокусом на дневные лимиты трат.

### Стек технологий
- **Vue 3** (Composition API, `<script setup>`)
- **Vue Router** (маршрутизация)
- **Vite** (сборка)
- **localStorage** (хранение данных)

---

## 🏗 Архитектура проекта

```
src/
├── App.vue                    # Корневой компонент
├── main.js                    # Точка входа
├── router/
│   └── index.js               # Конфигурация роутера
├── views/
│   └── MainView.vue           # Главный экран (дневной лимит + траты)
├── components/
│   ├── modals/
│   │   └── AddExpenseModal.vue    # Модалка добавления траты
│   └── onboarding/
│       ├── OnboardingContainer.vue  # Контейнер онбординга
│       ├── IncomeStep.vue           # Шаг 1: Доход
│       ├── ExpensesStep.vue         # Шаг 2: Обязательные расходы
│       ├── SummaryStep.vue          # Шаг 3: Свободные деньги
│       ├── GoalStep.vue             # Шаг 4: Цель накопления
│       └── ResultStep.vue           # Шаг 5: Результат
└── style.css                  # Глобальные стили
```

---

## 🛣 Маршрутизация

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | `MainView.vue` | Главный экран с дневным лимитом |
| `/settings` | `OnboardingContainer.vue` | Онбординг/настройки бюджета |

**Файл:** `src/router/index.js`

```javascript
const routes = [
  { path: '/', name: 'MainView', component: MainView },
  { path: '/settings', name: 'Onboarding', component: OnboardingContainer }
]
```

---

## 💾 Хранение данных (localStorage)

### Ключ: `daylimit-settings`

Структура объекта настроек:

```typescript
interface Settings {
  income: number;              // Ежемесячный доход (после налогов)
  rent: number;                // Аренда жилья
  utilities: number;           // Коммунальные услуги
  food: number;                // Питание
  transport: number;           // Транспорт
  credits: number;             // Кредиты/займы
  customExpenses: Array<{      // Пользовательские категории расходов
    name: string;
    amount: number;
  }>;
  savings: number;             // Процент от свободных денег на цель (0-100)
  goal: string | null;         // ID выбранной цели ('safety' | 'car' | 'vacation')
  goalAmount: number;          // Сумма цели
  daysToSalary: number;        // Дней до зарплаты (по умолчанию 30)
  savingsUsed: number;         // Сколько уже взято из цели на покрытие перерасхода
  debt: number;                // Текущий долг (когда цель исчерпана)
}
```

### Ключ: `daylimit-transactions-YYYY-MM`

Массив транзакций за текущий месяц:

```typescript
interface Transaction {
  id: string;      // Уникальный ID (timestamp + random)
  name: string;    // Название категории (например, "☕ Кофе")
  amount: number;  // Сумма траты
  date: string;    // ISO 8601 timestamp
}
```

---

## 🧮 Алгоритмы расчётов

### 1. Расчёт обязательных расходов

```javascript
const fixedExpenses = 
  rent + utilities + food + transport + credits + 
  customExpenses.reduce((sum, item) => sum + item.amount, 0)
```

### 2. Расчёт свободных денег

```javascript
const freeMoney = Math.max(0, income - fixedExpenses)
```

### 3. Месячный бюджет на траты

```javascript
const monthlyBudget = freeMoney - (freeMoney * (savings / 100))
// где savings — процент на цель (0-100)
```

### 4. Доступные деньги (с учётом перерасхода)

```javascript
const availableMoney = Math.max(0, monthlyBudget + savingsUsed - totalSpentMonth)
```

### 5. Дневной лимит

```javascript
const dailyLimit = availableMoney / daysRemaining
```

### 6. Остаток на сегодня

```javascript
const remainingToday = dailyLimit - totalSpentToday
```

---

## 📊 Логика перерасхода (Overspend Logic)

Когда пользователь совершает трату, которая превышает доступный бюджет:

```javascript
function executeTransactionLogic(transaction) {
  const wouldRemain = availableMoney - transaction.amount
  
  if (wouldRemain < 0) {
    const overspend = Math.abs(wouldRemain)
    const availableInGoal = goalAmount - savingsUsed
    
    if (availableInGoal >= overspend) {
      // Цели хватает для покрытия
      settings.savingsUsed += overspend
    } else {
      // Цель исчерпана, остаток в долг
      settings.savingsUsed += availableInGoal
      settings.debt += (overspend - availableInGoal)
    }
    saveSettings()
  }
  
  transactions.unshift(transaction)
  saveTransactions()
}
```

---

## 🔄 Пересчёт при удалении транзакции

**Важно:** При удалении транзакции состояние `savingsUsed` и `debt` пересчитывается **с нуля** на основе оставшихся транзакций:

```javascript
function recalculateFinancialState() {
  const monthlyBudget = /* расчёт бюджета */
  const newTotalSpentMonth = transactions.reduce(...)
  
  if (newTotalSpentMonth <= monthlyBudget) {
    // Перерасхода нет — сбрасываем всё
    settings.debt = 0
    settings.savingsUsed = 0
  } else {
    // Есть перерасход — всё ушло в долг
    settings.debt = newTotalSpentMonth - monthlyBudget
    settings.savingsUsed = settings.goalAmount
  }
  
  saveSettings()
}
```

Это предотвращает баги с некорректным возвратом средств.

---

## 🎨 Визуальные состояния

### Карточка дневного лимита

| Класс | Условие | Стиль |
|-------|---------|-------|
| (none) | `remainingToday >= 1500` | Градиент фиолетовый (#4f46e5 → #7c3aed) |
| `warning` | `500 <= remainingToday < 1500` | Градиент оранжевый (#f59e0b → #d97706) |
| `danger` | `0 <= remainingToday < 500` | Градиент красный (#ef4444 → #dc2626) |
| `overspent` | `remainingToday < 0` | Градиент тёмно-красный (#7f1d1d → #991b1b) |

### Прогресс-бар трат за сегодня

| Класс | Условие | Цвет |
|-------|---------|------|
| (none) | `progress <= 50%` | Фиолетовый (#4f46e5) |
| `warning` | `50% < progress <= 80%` | Оранжевый (#f59e0b) |
| `danger` | `progress > 80%` или перерасход | Красный (#ef4444) |

**Константы порогов:**
```javascript
const LIMIT_WARNING_THRESHOLD = 1500   // руб.
const LIMIT_DANGER_THRESHOLD = 500     // руб.
const PROGRESS_WARNING_PERCENT = 50    // %
const PROGRESS_DANGER_PERCENT = 80     // %
```

---

## 🧩 Компоненты

### `MainView.vue`

**Расположение:** `src/views/MainView.vue`

**Описание:** Главный экран приложения. Отображает дневной лимит, прогресс трат, метрики и список транзакций.

**Props:** Нет (использует route)

**Events:** Нет

**State:**
- `settings` (ref) — настройки из localStorage
- `transactions` (ref) — массив транзакций
- `showAddModal` (ref) — видимость модалки добавления траты

**Computed:**
- `data` — агрегированные данные для отображения (лимиты, остатки, долги)
- `displayLimit` — отображаемый лимит (max(0, remainingToday))
- `limitCardClass` — CSS класс для карточки лимита
- `progressPercent` — процент заполнения прогресс-бара
- `progressFillClass` — CSS класс для заполнения прогресс-бара
- `todayTransactions` — фильтрованные транзакции за сегодня

**Methods:**
- `handleTransaction(transaction)` — обработка новой траты
- `executeTransactionLogic(transaction)` — логика проведения транзакции
- `deleteTransaction(id)` — удаление транзакции
- `clearTodayExpenses()` — очистка всех трат за сегодня
- `recalculateFinancialState()` — пересчёт financial state
- `goToSettings()` — переход в настройки

---

### `AddExpenseModal.vue`

**Расположение:** `src/components/modals/AddExpenseModal.vue`

**Описание:** Модальное окно для добавления траты. Содержит пресеты категорий и поле для ввода своей суммы.

**Props:**
- `modelValue` (Boolean) — видимость модалки (v-model)

**Emits:**
- `update:modelValue` — изменение видимости
- `transaction` — новая транзакция (объект Transaction)

**Preset категории:**
```javascript
const PRESET_CATEGORIES = [
  { name: '☕ Кофе', amount: 300, icon: '☕' },
  { name: '🍔 Обед', amount: 600, icon: '🍔' },
  { name: '🚕 Такси', amount: 400, icon: '🚕' },
  { name: '🎬 Кино', amount: 500, icon: '🎬' },
  { name: '🛍 Покупки', amount: 1500, icon: '🛍' },
  { name: '🍷 Бар', amount: 2000, icon: '🍷' }
]
```

---

### `OnboardingContainer.vue`

**Расположение:** `src/components/onboarding/OnboardingContainer.vue`

**Описание:** Контейнер онбординга. Управляет навигацией между шагами и собирает итоговые данные.

**State:**
- `currentStep` (ref) — текущий шаг (1-5)
- `onboardingData` (ref) — единое состояние для всех шагов

**Шаги:**
1. `IncomeStep` — ввод дохода
2. `ExpensesStep` — ввод обязательных расходов
3. `SummaryStep` — отображение свободных денег
4. `GoalStep` — выбор цели и процента накоплений
5. `ResultStep` — финальный расчёт дневного лимита

**Методы:**
- `next()` — переход к следующему шагу
- `prev()` — переход к предыдущему шагу
- `finish()` — сохранение настроек и редирект на главный экран

---

### `IncomeStep.vue`

**Расположение:** `src/components/onboarding/IncomeStep.vue`

**Props:**
- `modelValue` (Object) — общее состояние онбординга

**Emits:**
- `update:modelValue` — обновление данных
- `focus-request` — запрос фокуса (для автофокуса input)

---

### `ExpensesStep.vue`

**Расположение:** `src/components/onboarding/ExpensesStep.vue`

**Props:**
- `modelValue` (Object) — общее состояние онбординга

**Emits:**
- `update:modelValue` — обновление данных

**Категории расходов:**
```javascript
const expenseCategories = {
  rent: 'Аренда',
  utilities: 'Коммуналка',
  food: 'Еда',
  transport: 'Транспорт',
  credits: 'Кредиты'
}
```

---

### `SummaryStep.vue`

**Расположение:** `src/components/onboarding/SummaryStep.vue`

**Описание:** Показывает расчёт свободных денег (`income - expenses`).

**Computed:**
- `income` — доход
- `totalExpenses` — сумма всех расходов
- `freeMoney` — свободные деньги

---

### `GoalStep.vue`

**Расположение:** `src/components/onboarding/GoalStep.vue`

**Пресеты целей:**
```javascript
const PRESET_GOALS = [
  { id: 'safety', name: 'Подушка безопасности', icon: '🛡️', recommended: true },
  { id: 'car', name: 'Машина', icon: '🚗', defaultAmount: 1500000 },
  { id: 'vacation', name: 'Отпуск', icon: '✈️', defaultAmount: 100000 }
]
```

**Логика:**
- Для "Подушки безопасности" сумма = 3 × обязательные расходы
- Для остальных целей — фиксированная сумма по умолчанию (редактируемая)
- Автослайдер процента накоплений (0-100%, шаг 5%)
- Живой расчёт срока достижения цели и дневного лимита

---

### `ResultStep.vue`

**Расположение:** `src/components/onboarding/ResultStep.vue`

**Описание:** Финальный экран с рассчитанным дневным лимитом.

---

## 🔧 Утилитарные функции

### `formatMoney(amount)`
Форматирует число в русскую денежную строку.
```javascript
formatMoney(1500) // "1 500"
```

### `getDaysWord(n)`
Склоняет слово "день" по падежам.
```javascript
getDaysWord(1)  // "день"
getDaysWord(2)  // "дня"
getDaysWord(5)  // "дней"
getDaysWord(21) // "день"
```

### `getMonthKey()`
Генерирует ключ localStorage для текущего месяца.
```javascript
// Август 2025
getMonthKey() // "daylimit-transactions-2025-08"
```

### `isToday(dateStr)`
Проверяет, является ли дата сегодняшней.

### `formatTime(dateStr)`
Форматирует время в ЧЧ:ММ.

### `getCategoryIcon(name)`
Извлекает эмодзи из названия категории.

### `generateId()`
Генерирует уникальный ID для транзакции.

---

## 🐛 Исправленные баги

### 1. Некорректный возврат средств при удалении транзакции
**Проблема:** При удалении транзакции `savingsUsed` и `debt` не пересчитывались корректно.

**Решение:** Полная пересчётка финансового состояния с нуля на основе оставшихся транзакций.

**Файл:** `MainView.vue`, функция `recalculateFinancialState()`

### 2. Отсутствие валидации суммы траты
**Проблема:** Можно было добавить трату с нулевой или отрицательной суммой.

**Решение:** Добавлен атрибут `min="1"` на input и блокировка кнопки при `customAmount <= 0`.

**Файл:** `AddExpenseModal.vue`, строки 28, 39

### 3. Преждевременное закрытие модалки
**Проблема:** Модалка закрывалась даже если сумма не валидна.

**Решение:** Закрытие модалки только внутри условия `if (customAmount.value > 0)`.

**Файл:** `AddExpenseModal.vue`, строка 92-100

---

## 📝 Расширение функционала

### Добавление новой категории расходов в онбординге

1. Откройте `ExpensesStep.vue`
2. Добавьте новую категорию в объект `expenseCategories`:
```javascript
const expenseCategories = {
  // ...существующие
  insurance: 'Страховка'  // новая категория
}
```
3. В `OnboardingContainer.vue` добавьте поле в объект `expenses` (если нужно)
4. В `MainView.vue` обновите расчёт `fixedExpenses`

### Добавление нового пресета траты

1. Откройте `AddExpenseModal.vue`
2. Добавьте новый объект в массив `PRESET_CATEGORIES`:
```javascript
{ name: '🍕 Пицца', amount: 800, icon: '🍕' }
```

### Добавление новой цели накопления

1. Откройте `GoalStep.vue` (и `ResultStep.vue` для консистентности)
2. Добавьте новую цель в `PRESET_GOALS`:
```javascript
{ id: 'house', name: 'Дом', icon: '🏠', defaultAmount: 5000000 }
```

### Изменение порогов цветовой индикации

Откройте `MainView.vue` и измените константы:
```javascript
const LIMIT_WARNING_THRESHOLD = 1500
const LIMIT_DANGER_THRESHOLD = 500
const PROGRESS_WARNING_PERCENT = 50
const PROGRESS_DANGER_PERCENT = 80
```

---

## ⚠️ Известные ограничения

1. **Хранение данных:** Все данные хранятся в localStorage браузера. При очистке кэша данные будут потеряны.

2. **Месячные транзакции:** Транзакции привязаны к месяцу. При переходе на новый месяц история прошлого месяца остаётся в localStorage, но не отображается.

3. **Дни до зарплаты:** Фиксированное значение (30 дней по умолчанию). Нет динамического расчёта по календарю.

4. **Мультивалютность:** Поддерживается только одна валюта (российский рубль).

5. **Синхронизация:** Нет облачной синхронизации между устройствами.

---

## 🚀 Сборка и запуск

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка production-версии
npm run build

# Предпросмотр сборки
npm run preview
```

---

## 📄 Лицензия

MIT

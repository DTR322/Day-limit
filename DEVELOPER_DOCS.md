# Day Limit — Документация разработчика

**Версия:** 1.0  
**Фреймворк:** Vue 3 (Composition API)  
**Сборщик:** Vite  
**Хранение данных:** localStorage  

---

## 📁 Структура проекта

```
src/
├── main.js              # Точка входа, инициализация роутера
├── App.vue              # Корневой компонент, содержит RouterView
├── style.css            # Глобальные стили приложения
├── router/
│   └── index.js         # Конфигурация vue-router (2 маршрута)
└── components/
    ├── StartScreen.vue  # Онбординг (5 шагов настройки бюджета)
    └── MainScreen.vue   # Главный экран: лимит, транзакции, метрики
```

---

## 🔀 Маршрутизация

| Путь      | Компонент     | Описание                          |
|-----------|---------------|-----------------------------------|
| `/`       | `MainScreen`  | Главная страница с дневным лимитом |
| `/settings` | `StartScreen` | Онбординг / настройка бюджета     |

**Файл:** `src/router/index.js`

```js
const routes = [
  { path: '/', name: 'MainScreen', component: MainScreen },
  { path: '/settings', name: 'StartScreen', component: StartScreen }
]
```

---

## 💾 Хранение данных (localStorage)

### Ключи

| Ключ                           | Тип     | Описание                              |
|--------------------------------|---------|---------------------------------------|
| `daylimit-settings`            | Object  | Настройки бюджета пользователя        |
| `daylimit-transactions-YYYY-MM`| Array   | Транзакции за конкретный месяц        |

### Структура `daylimit-settings`

```ts
interface Settings {
  income: number           // Месячный доход (после налогов)
  rent: number             // Аренда жилья
  utilities: number        // Коммунальные услуги
  food: number             // Еда (базовая)
  transport: number        // Транспорт
  credits: number          // Ежемесячный платёж по кредитам/ипотеке
  customExpenses: Array<{  // Пользовательские категории расходов
    name: string
    amount: number
  }>
  savings: number          // Процент от свободных денег на цель (0–100)
  goal: string|null        // ID выбранной цели ('safety', 'car', 'vacation')
  goalAmount: number       // Сумма цели в рублях
  daysToSalary: number     // Дней до следующей зарплаты (по умолчанию 30)
  savingsUsed: number      // Сколько уже взято из цели на покрытие трат
  debt: number             // Накопленный долг (перерасход сверх цели)
}
```

### Структура транзакции

```ts
interface Transaction {
  id: string      // Уникальный ID (timestamp + random)
  name: string    // Название категории (например, "☕ Кофе")
  amount: number  // Сумма в рублях
  date: string    // ISO 8601 timestamp
}
```

---

## 🧮 Алгоритмы расчётов

### 1. Расчёт обязательных расходов (`fixedExpenses`)

**Файл:** `MainScreen.vue`, computed `data`

```js
const fixedExpenses = 
  rent + utilities + food + transport + credits + 
  customExpenses.reduce((sum, item) => sum + item.amount, 0)
```

### 2. Свободные деньги (`freeMoney`)

```js
const freeMoney = Math.max(0, income - fixedExpenses)
```

### 3. Месячный бюджет на переменные расходы (`monthlyBudget`)

```js
const monthlyBudget = freeMoney - (freeMoney * (savings / 100))
// где savings — процент, направляемый на цель
```

### 4. Дневной лимит (`dailyLimit`)

```js
const dailyLimit = availableMoney / daysRemaining
// availableMoney = monthlyBudget + savingsUsed - totalSpentMonth
```

### 5. Доступные деньги на месяц (`availableMoney`)

```js
const availableMoney = Math.max(
  0,
  monthlyBudget + savingsUsed - totalSpentMonth
)
```

### 6. Остаток цели (`remainingGoal`)

```js
const remainingGoal = Math.max(0, goalAmount - savingsUsed)
```

---

## ⚠️ Логика перерасхода (Overspend)

При добавлении транзакции система проверяет, хватает ли `availableMoney`.

**Файл:** `MainScreen.vue`, функция `executeTransactionLogic`

```js
const wouldRemain = data.value.availableMoney - transaction.amount

if (wouldRemain < 0) {
  const overspend = Math.abs(wouldRemain)
  const availableInGoal = goalAmount - savingsUsed
  
  if (availableInGoal >= overspend) {
    // Покрытие из цели
    savingsUsed += overspend
  } else {
    // Цель исчерпана, остаток в долг
    savingsUsed += availableInGoal
    debt += (overspend - availableInGoal)
  }
}
```

**Последовательность покрытия:**
1. Сначала `availableMoney` (бюджет месяца)
2. Затем `savingsUsed` (цель)
3. В последнюю очередь `debt` (долг)

---

## 🗑️ Удаление транзакций

### Исправленная логика (Bug Fix v1.0)

**Проблема:** При удалении транзакции неправильно восстанавливались `savingsUsed` и `debt`.

**Решение:** Полный пересчёт состояния на основе оставшихся транзакций.

**Файл:** `MainScreen.vue`, функция `deleteTransaction`

```js
function deleteTransaction(id) {
  // 1. Удаляем транзакцию
  transactions.value.splice(index, 1)
  
  // 2. Пересчитываем сумму всех трат за месяц
  const newTotalSpentMonth = transactions.value.reduce(...)
  
  // 3. Вычисляем месячный бюджет
  const monthlyBudget = ... // та же формула что и при создании
  
  // 4. Восстанавливаем состояние
  if (newTotalSpentMonth <= monthlyBudget) {
    s.debt = 0
    s.savingsUsed = 0
  } else {
    s.debt = newTotalSpentMonth - monthlyBudget
    s.savingsUsed = goalAmount
  }
  
  saveSettings()
  saveTransactions()
}
```

**Аналогично работает `clearTodayExpenses`** — удаляет все сегодняшние транзакции и пересчитывает `debt`/`savingsUsed` с нуля.

---

## 🎨 Визуальные состояния

### Карточка лимита (`.limit-card`)

| Класс        | Условие                                 | Стиль                            |
|--------------|-----------------------------------------|----------------------------------|
| (нет)        | `remainingToday >= 1500`                | Фиолетовый градиент              |
| `.warning`   | `500 <= remainingToday < 1500`          | Оранжевый градиент               |
| `.danger`    | `0 <= remainingToday < 500`             | Красный градиент                 |
| `.overspent` | `remainingToday < 0`                    | Тёмно-красный + пульсация        |

**Файл:** `MainScreen.vue`, computed `limitCardClass`

```js
const limitCardClass = computed(() => {
  const remainingToday = data.value.remainingToday
  if (remainingToday < 0) return 'overspent'
  if (remainingToday < LIMIT_DANGER_THRESHOLD) return 'danger'
  if (remainingToday < LIMIT_WARNING_THRESHOLD) return 'warning'
  return ''
})
```

### Прогресс-бар (`.progress-fill`)

| Класс        | Условие                                  |
|--------------|------------------------------------------|
| (нет)        | `progressPercent < 50`                   |
| `.warning`   | `50 <= progressPercent < 80`             |
| `.danger`    | `progressPercent >= 80` или перерасход   |

**Константы:**
```js
const PROGRESS_WARNING_PERCENT = 50
const PROGRESS_DANGER_PERCENT = 80
```

---

## 🔧 Переменные и функции

### MainScreen.vue

#### State

| Переменная         | Тип     | Описание                        |
|--------------------|---------|---------------------------------|
| `settings`         | Ref<Object> | Настройки из localStorage    |
| `transactions`     | Ref<Array>  | Массив транзакций месяца     |
| `customAmount`     | Ref<number> | Сумма пользовательской траты |
| `showAddModal`     | Ref<boolean>| Видимость модалки добавления  |

#### Constants

| Константа                  | Значение | Описание                         |
|----------------------------|----------|----------------------------------|
| `PRESET_CATEGORIES`        | Array    | 6 предустановленных категорий    |
| `LIMIT_WARNING_THRESHOLD`  | 1500     | Порог предупреждения (₽)         |
| `LIMIT_DANGER_THRESHOLD`   | 500      | Порог опасности (₽)              |
| `PROGRESS_WARNING_PERCENT` | 50       | % заполнения для warning         |
| `PROGRESS_DANGER_PERCENT`  | 80       | % заполнения для danger          |

#### Computed

| Имя                | Возвращает | Описание                               |
|--------------------|------------|----------------------------------------|
| `data`             | Object     | Все расчётные метрики бюджета          |
| `displayLimit`     | number     | Можно потратить сегодня (не отр.)      |
| `limitCardClass`   | string     | CSS-класс для карточки лимита          |
| `progressPercent`  | number     | % потраченного от дневного лимита      |
| `progressFillClass`| string     | CSS-класс для полосы прогресса         |
| `todayTransactions`| Array      | Транзакции за сегодня                  |

#### Functions

| Функция                    | Параметры          | Описание                                |
|----------------------------|--------------------|-----------------------------------------|
| `formatMoney(amount)`      | number             | Форматирование числа (10 000)           |
| `getDaysWord(n)`           | number             | Склонение слова "день/дня/дней"         |
| `getMonthKey()`            | —                  | Ключ localStorage для текущего месяца   |
| `isToday(dateStr)`         | string             | Проверка даты на "сегодня"              |
| `formatTime(dateStr)`      | string             | Время в формате ЧЧ:ММ                   |
| `generateId()`             | —                  | Генерация уникального ID транзакции     |
| `loadSettings()`           | —                  | Загрузка из localStorage                |
| `saveSettings()`           | —                  | Сохранение в localStorage               |
| `loadTransactions()`       | —                  | Загрузка транзакций месяца              |
| `saveTransactions()`       | —                  | Сохранение транзакций месяца            |
| `processTransaction(name, amount)` | string, number | Добавлениеpreset-траты           |
| `processCustomTransaction()`| —                 | Добавление траты со своей суммой        |
| `executeTransactionLogic(transaction)` | Object | Основная логика списания с проверкой перерасхода |
| `deleteTransaction(id)`    | string             | Удаление транзакции с пересчётом        |
| `clearTodayExpenses()`     | —                  | Массовое удаление сегодняшних трат      |
| `goToSettings()`           | —                  | Переход на страницу настроек            |

### StartScreen.vue

#### State

| Переменная         | Тип     | Описание                        |
|--------------------|---------|---------------------------------|
| `step`             | Ref<number> | Текущий шаг онбординга (1–5)  |
| `income`           | Ref<number> | Доход пользователя            |
| `expenses`         | Ref<Object> | Обязательные расходы (5 категорий) |
| `customExpenses`   | Ref<Array>  | Пользовательские категории    |
| `selectedGoal`     | Ref<string|null> | ID выбранной цели        |
| `goalAmount`       | Ref<number> | Сумма цели                    |
| `savingsPercent`   | Ref<number> | Процент накоплений (0–100)    |

#### Constants

| Константа           | Значение | Описание                      |
|---------------------|----------|-------------------------------|
| `PRESET_GOALS`      | Array    | 3 предустановленные цели      |
| `DEFAULT_DAYS_TO_SALARY` | 30  | Дней до зарплаты по умолчанию |

#### Computed

| Имя              | Возвращает | Описание                          |
|------------------|------------|-----------------------------------|
| `totalExpenses`  | number     | Сумма всех обязательных расходов  |
| `freeMoney`      | number     | Доход − расходы                   |
| `goalMonthly`    | number     | Сколько идёт на цель в месяц      |
| `goalMonths`     | number|null| Срок достижения цели (мес)        |
| `goalMonthsText` | string     | Человекочитаемый срок             |
| `dailyLimit`     | number     | Дневной лимит (на экране 5)       |
| `canProceed`     | boolean    | Можно ли перейти дальше           |

---

## 🐛 Исправленные баги (v1.0)

### 1. Некорректный возврат средств при удалении транзакции
**Файл:** `MainScreen.vue`, строки 330–372  
**Проблема:** При удалении транзакции `debt` и `savingsUsed` не восстанавливались корректно.  
**Решение:** Полный пересчёт состояния на основе оставшихся транзакций.

### 2. Отсутствие валидации суммы траты
**Файл:** `MainScreen.vue`, строки 98–109  
**Проблема:** Можно было добавить трату с нулевой суммой.  
**Решение:** Добавлен `min="1"` на input и `:disabled="customAmount <= 0"` на кнопку.

### 3. Дублирование CSS-стилей
**Файл:** `style.css`  
**Проблема:** Стили `body` и `.limit-card` дублировались.  
**Решение:** Убраны дубли, добавлены комментарии-разделители.

### 4. Необязательное закрытие модалки при добавлении кастомной траты
**Файл:** `MainScreen.vue`, строки 277–289  
**Проблема:** Модалка закрывалась даже если сумма = 0.  
**Решение:** Закрытие только внутри условия `if (customAmount.value > 0)`.

### 5. Упрощённая логика массового удаления
**Файл:** `MainScreen.vue`, `clearTodayExpenses`  
**Проблема:** Непоследовательный пересчёт `savingsUsed`.  
**Решение:** Унифицирована логика с `deleteTransaction`.

---

## 📝 Рекомендации по расширению

### Добавить новую категорию расходов
1. Откройте `StartScreen.vue`
2. Добавьте поле в объект `expenseCategories`
3. Добавьте начальное значение в `expenses.value`
4. Обновите расчёт `fixedExpenses` в `MainScreen.vue`

### Изменить пороги цветовой индикации
Отредактируйте константы в `MainScreen.vue`:
```js
const LIMIT_WARNING_THRESHOLD = 1500  // ← ваше значение
const LIMIT_DANGER_THRESHOLD = 500
```

### Добавить новый пресет цели
В `StartScreen.vue` добавьте объект в `PRESET_GOALS`:
```js
{ id: 'house', name: 'Дом', icon: '🏠', recommended: false, defaultAmount: 5000000 }
```

### Изменить количество дней до зарплаты по умолчанию
В `StartScreen.vue` измените:
```js
const DEFAULT_DAYS_TO_SALARY = 30  // ← ваше значение
```

---

## 🚀 Сборка и запуск

```bash
# Установка зависимостей
npm install

# Запуск dev-сервера
npm run dev

# Сборка продакшена
npm run build

# Предпросмотр сборки
npm run preview
```

**Выходные файлы:** `dist/index.html`, `dist/assets/*`

---

## 📌 Известные ограничения

1. **Один месяц хранения** — транзакции хранятся только за текущий месяц (`daylimit-transactions-YYYY-MM`). При наступлении нового месяца история теряется.
2. **Нет синхронизации** — данные хранятся только в браузере пользователя.
3. **Нет бэкенда** — вся бизнес-логика на клиенте.
4. **Валюта** — жёстко задан рубль (₽). Для поддержки других валют нужно изменить все строки с `' ₽'`.

---

## 🔐 Безопасность

⚠️ **Не используйте для реальных финансовых данных!** Приложение хранит всё в открытом localStorage без шифрования.

---

**Документация актуальна для версии 1.0**  
Последнее обновление: 2025

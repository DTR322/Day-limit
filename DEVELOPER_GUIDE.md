# Day Limit — Документация для разработчика

## 📋 Обзор проекта

**Day Limit** — Vue.js приложение для управления личным бюджетом с фокусом на дневной лимит трат. Приложение помогает пользователям распределять свободные деньги на месяц, учитывая обязательные расходы и финансовые цели.

### Стек технологий
- **Vue 3** (Composition API, `<script setup>`)
- **Vue Router 4** (навигация между экранами)
- **Vite** (сборщик)
- **localStorage** (хранение данных на клиенте)
- **CSS** (scoped стили в компонентах + глобальные стили)

---

## 🏗 Архитектура проекта

```
src/
├── main.js              # Точка входа, инициализация app и router
├── App.vue              # Корневой компонент с RouterView
├── style.css            # Глобальные стили
├── router/
│   └── index.js         # Конфигурация роутера
└── components/
    ├── StartScreen.vue  # Онбординг (5 шагов настройки)
    └── MainScreen.vue   # Главный экран с лимитом и транзакциями
```

---

## 🛣 Маршрутизация

| Путь | Компонент | Описание |
|------|-----------|----------|
| `/` | `MainScreen` | Главный экран с дневным лимитом |
| `/settings` | `StartScreen` | Онбординг/настройка бюджета |

**Файл:** `src/router/index.js`

```javascript
const routes = [
  { path: '/', name: 'MainScreen', component: MainScreen },
  { path: '/settings', name: 'StartScreen', component: StartScreen }
]
```

---

## 💾 Хранение данных

### localStorage ключи

#### `daylimit-settings`
Объект настроек пользователя:
```javascript
{
  income: Number,           // Ежемесячный доход (после налогов)
  rent: Number,             // Аренда жилья
  utilities: Number,        // Коммуналка
  food: Number,             // Еда
  transport: Number,        // Транспорт
  credits: Number,          // Кредиты
  customExpenses: Array,    // Пользовательские категории расходов
                            // [{ name: String, amount: Number }]
  savings: Number,          // Процент от свободных денег на цель (0-100)
  goal: String|null,        // ID выбранной цели ('safety', 'car', 'vacation')
  goalAmount: Number,       // Сумма финансовой цели
  daysToSalary: Number,     // Дней до зарплаты (по умолчанию 30)
  savingsUsed: Number,      // Сколько уже взято из цели на покрытие трат
  debt: Number              // Текущий долг (перерасход бюджета)
}
```

#### `daylimit-transactions-YYYY-MM`
Массив транзакций за текущий месяц:
```javascript
[
  {
    id: String,             // Уникальный ID (timestamp + random)
    name: String,           // Название категории/транзакции
    amount: Number,         // Сумма траты
    date: String            // ISO 8601 timestamp
  }
]
```

**Важно:** Ключ хранилища транзакций включает год и месяц, поэтому данные автоматически разделяются по месяцам.

---

## 🧮 Алгоритмы расчёта

### 1. Расчёт свободных денег (freeMoney)

**Файл:** `src/components/MainScreen.vue`, computed `data`

```javascript
const fixedExpenses = 
  rent + utilities + food + transport + credits + customExpensesTotal

const freeMoney = Math.max(0, income - fixedExpenses)
```

### 2. Расчёт месячного бюджета (monthlyBudget)

```javascript
const monthlyBudget = freeMoney - (freeMoney * (savingsPercent / 100))
```

Где `savingsPercent` — процент, направляемый на финансовую цель.

### 3. Доступные деньги (availableMoney)

```javascript
const availableMoney = Math.max(0, monthlyBudget + savingsUsed - totalSpentMonth)
```

- `savingsUsed` — сколько уже взято из цели на покрытие перерасхода
- `totalSpentMonth` — все траты за текущий месяц

### 4. Дневной лимит (dailyLimit)

```javascript
const dailyLimit = availableMoney / daysRemaining
```

### 5. Остаток на сегодня (remainingToday)

```javascript
const remainingToday = dailyLimit - totalSpentToday
```

### 6. Логика перерасхода (executeTransactionLogic)

**Файл:** `src/components/MainScreen.vue`, строки 283-309

При добавлении транзакции:
1. Вычисляется `wouldRemain = availableMoney - transaction.amount`
2. Если `wouldRemain < 0` (перерасход):
   - Сначала используется доступная сумма из цели (`goalAmount - savingsUsed`)
   - Если цели не хватает, остаток уходит в `debt`

```javascript
if (wouldRemain < 0) {
  const overspend = Math.abs(wouldRemain)
  const availableInGoal = Math.max(0, goalAmount - savingsUsed)
  
  if (availableInGoal >= overspend) {
    savingsUsed += overspend
  } else {
    savingsUsed += availableInGoal
    debt += (overspend - availableInGoal)
  }
}
```

### 7. Удаление транзакции (deleteTransaction)

**Файл:** `src/components/MainScreen.vue`, строки 311-367

При удалении транзакции:
1. Транзакция удаляется из массива
2. Пересчитывается `totalSpentMonth`
3. Определяется, была ли трата в пределах бюджета или ушла в перерасход
4. Если трата вызвала перерасход — уменьшается `debt`

**Логика:**
- Если `availableMoney <= 0` до удаления → трата точно ушла в долг, гасим `debt`
- Если `availableMoney < amount` → часть в бюджете, часть в долг
- Иначе → трата была в бюджете, `availableMoney` увеличится автоматически

### 8. Массовое удаление (clearTodayExpenses)

**Файл:** `src/components/MainScreen.vue`, строки 369-412

1. Удаляются все сегодняшние транзакции
2. `savingsUsed` и `debt` пересчитываются с нуля на основе оставшихся транзакций:
   - Если `totalSpentMonth > monthlyBudget` → `debt = overspend`, `savingsUsed = goalAmount`
   - Иначе → `debt = 0`, `savingsUsed = totalSpentMonth - monthlyBudget`

---

## 🎨 Визуальные состояния

### Карточка лимита (limitCardClass)

**Файл:** `src/components/MainScreen.vue`, строки 253-259

| Класс | Условие | Стиль |
|-------|---------|-------|
| `overspent` | `remainingToday < 0` | Красный градиент, пульсация |
| `danger` | `remainingToday < 500` | Оранжевый градиент |
| `warning` | `remainingToday < 1500` | Жёлтый градиент |
| — | иначе | Стандартный фиолетовый |

**Константы:** `LIMIT_DANGER_THRESHOLD = 500`, `LIMIT_WARNING_THRESHOLD = 1500`

### Прогресс-бар (progressFillClass)

**Файл:** `src/components/MainScreen.vue`, строки 267-273

| Класс | Условие | Цвет |
|-------|---------|------|
| `danger` | `remainingToday < 0` ИЛИ `progress > 80%` | Красный |
| `warning` | `progress > 50%` | Оранжевый |
| — | иначе | Фиолетовый |

**Константы:** `PROGRESS_WARNING_PERCENT = 50`, `PROGRESS_DANGER_PERCENT = 80`

---

## 🔧 Исправленные баги

### 1. ❌ Некорректный возврат средств при удалении транзакции
**Файл:** `MainScreen.vue`, строки 311-367

**Проблема:** При удалении транзакции деньги возвращались некорректно — сначала гасился долг, потом восстанавливалась цель, без учёта реального влияния этой конкретной траты на бюджет.

**Решение:** Полная переработка логики:
- Пересчёт `totalSpentMonth` после удаления
- Определение, была ли трата в пределах бюджета или ушла в перерасход
- Корректное уменьшение `debt` только на сумму перерасхода

### 2. ❌ Упрощённая логика массового удаления
**Файл:** `MainScreen.vue`, строки 369-412

**Проблема:** При очистке всех трат за сегодня каждая транзакция обрабатывалась отдельно с упрощённой логикой, что приводило к накоплению ошибок.

**Решение:** Полный пересчёт `savingsUsed` и `debt` с нуля на основе оставшихся транзакций.

### 3. ❌ Необъявленная переменная `customGoalName`
**Файл:** `StartScreen.vue`, строка 318

**Проблема:** В функции `finish()` использовалась переменная `customGoalName.value`, которая нигде не объявлена.

**Решение:** Удалена строка `goalName: selectedGoal.value === 'custom' ? customGoalName.value : null`, так как функционал кастомных целей не реализован.

### 4. ❌ Неиспользуемый импорт RouterView
**Файл:** `App.vue`, строка 8

**Проблема:** Импорт `RouterView` был, но в template использовался `<router-view />` (через глобальную регистрацию).

**Решение:** Явное использование `<RouterView />` в template с импортом.

### 5. ❌ Дублирование CSS-стилей
**Файл:** `style.css`, строки 1-5 и 77-81

**Проблема:** Правила `* { margin: 0; padding: 0; box-sizing: border-box; }` и `body {...}` дублировались.

**Решение:** Удалены дублирующиеся блоки, стили консолидированы.

### 6. ⚠️ Магические числа в вычисляемых свойствах
**Файл:** `MainScreen.vue`

**Проблема:** Пороговые значения (500, 1500, 50, 80) были захардкожены в computed свойствах.

**Решение:** Вынесены в константы:
```javascript
const LIMIT_WARNING_THRESHOLD = 1500
const LIMIT_DANGER_THRESHOLD = 500
const PROGRESS_WARNING_PERCENT = 50
const PROGRESS_DANGER_PERCENT = 80
```

---

## 📝 Нелогичные названия (исправлено)

### StartScreen.vue

| Было | Стало | Причина |
|------|-------|---------|
| `goals` | `PRESET_GOALS` | Массив констант, не реактивный |
| `DAYS_TO_SALARY` | `DEFAULT_DAYS_TO_SALARY` | Явно указано, что это дефолтное значение |
| `remaining` (в dailyLimit) | `remainingAfterGoal` | Более понятное название |

### MainScreen.vue

| Было | Стало | Причина |
|------|-------|---------|
| `r` (в limitCardClass) | `remainingToday` | Расшифрована переменная |
| `d` (в progressPercent) | `dailyLimit`, `totalSpentToday` | Деструктурировано для читаемости |
| — | Добавлены константы порогов | Убраны магические числа |

---

## 🚀 Расширение функционала

### Добавление новой категории расходов

1. Откройте `src/components/StartScreen.vue`
2. Найдите объект `expenseCategories` (строка 189)
3. Добавьте новую категорию:
```javascript
const expenseCategories = {
  rent: 'Аренда',
  utilities: 'Коммуналка',
  food: 'Еда',
  transport: 'Транспорт',
  credits: 'Кредиты',
  insurance: 'Страховка'  // ← новая категория
}
```
4. Добавьте поле в `expenses.ref`:
```javascript
const expenses = ref({
  rent: 0,
  utilities: 0,
  food: 0,
  transport: 0,
  credits: 0,
  insurance: 0  // ← новое поле
})
```
5. Обновите `finish()` функцию для сохранения:
```javascript
const settings = {
  // ...
  insurance: Number(expenses.value.insurance) || 0,
  // ...
}
```
6. В `MainScreen.vue` добавьте чтение нового поля в computed `data`:
```javascript
const insurance = Number(s.insurance) || 0
const fixedExpenses = rent + utilities + food + transport + credits + insurance + customExpensesTotal
```

### Добавление новойpreset цели

1. Откройте `src/components/StartScreen.vue`
2. Найдите массив `PRESET_GOALS` (строка 208)
3. Добавьте новую цель:
```javascript
const PRESET_GOALS = [
  { id: 'safety', name: 'Подушка безопасности', icon: '🛡️', recommended: true, defaultAmount: null },
  { id: 'car', name: 'Машина', icon: '🚗', recommended: false, defaultAmount: 1500000 },
  { id: 'vacation', name: 'Отпуск', icon: '✈️', recommended: false, defaultAmount: 100000 },
  { id: 'education', name: 'Образование', icon: '📚', recommended: false, defaultAmount: 50000 }  // ← новая
]
```

### Изменение порогов цветовой индикации

Откройте `src/components/MainScreen.vue` и измените константы (строки 136-140):
```javascript
const LIMIT_WARNING_THRESHOLD = 1500    // жёлтый при < 1500₽
const LIMIT_DANGER_THRESHOLD = 500      // красный при < 500₽
const PROGRESS_WARNING_PERCENT = 50     // жёлтый прогресс при > 50%
const PROGRESS_DANGER_PERCENT = 80      // красный прогресс при > 80%
```

### Добавление быстрой категории траты

1. Откройте `src/components/MainScreen.vue`
2. Найдите массив `PRESET_CATEGORIES` (строка 127)
3. Добавьте новую категорию:
```javascript
const PRESET_CATEGORIES = [
  { name: '☕ Кофе', amount: 300 },
  { name: '🍔 Обед', amount: 600 },
  { name: '🚕 Такси', amount: 400 },
  { name: '🎬 Кино', amount: 500 },
  { name: '🛍 Покупки', amount: 1500 },
  { name: '🍷 Бар', amount: 2000 },
  { name: '🍕 Пицца', amount: 800 }  // ← новая
]
```
4. В template (строки 77-96) добавьте кнопку:
```html
<button class="cat-btn" @click="processTransaction('🍕 Пицца', 800)">
  <span class="cat-icon">🍕</span>
  <span class="cat-name">Пицца</span>
  <span class="cat-amount">800 ₽</span>
</button>
```

---

## 🧪 Тестирование

### Ручное тестирование сценариев

#### Сценарий 1: Добавление траты в пределах бюджета
1. Установите доход 100000₽, обязательные расходы 50000₽
2. Не выбирайте цель (savings = 0%)
3. Добавьте трату 300₽
4. **Ожидаемо:** `availableMoney` уменьшился на 300₽, `debt = 0`, `savingsUsed = 0`

#### Сценарий 2: Перерасход с покрытием из цели
1. Установите цель 100000₽, savings = 20%
2. Совершите траты на сумму больше `monthlyBudget`
3. **Ожидаемо:** `savingsUsed` увеличился на сумму перерасхода, `debt = 0`

#### Сценарий 3: Перерасход с уходом в долг
1. Исчерпайте цель полностью
2. Совершите ещё одну трату
3. **Ожидаемо:** `savingsUsed = goalAmount`, `debt > 0`

#### Сценарий 4: Удаление транзакции
1. Создайте несколько транзакций
2. Удалите одну из них
3. **Ожидаемо:** `debt` или `savingsUsed` корректно уменьшились

#### Сценарий 5: Массовое удаление за сегодня
1. Добавьте 3-5 транзакций за сегодня
2. Нажмите "Очистить"
3. **Ожидаемо:** Все транзакции удалены, `debt` и `savingsUsed` пересчитаны

---

## 📦 Сборка и развёртывание

### Установка зависимостей
```bash
npm install
```

### Запуск dev-сервера
```bash
npm run dev
```

### Production сборка
```bash
npm run build
```

Результат в папке `/dist`:
- `index.html` — точка входа
- `assets/index-*.css` — стили
- `assets/index-*.js` — JavaScript бандл

### Предпросмотр production сборки
```bash
npm run preview
```

---

## 🔐 Безопасность и ограничения

### Текущие ограничения
1. **Нет бэкенда** — все данные хранятся в localStorage браузера
   - При очистке кэша данные теряются
   - Нет синхронизации между устройствами
   
2. **Нет аутентификации** — любой, кто имеет доступ к браузеру, видит данные

3. **Нет валидации ввода** на уровне БД (только UI валидация)

### Рекомендации для production
- Добавить экспорт/импорт данных (JSON файл)
- Реализовать облачную синхронизацию
- Добавить PIN-код для доступа к приложению
- Валидировать суммы трат (защита от отрицательных значений, слишком больших чисел)

---

## 📞 Контакты и поддержка

Проект открыт для расширения. Основные точки роста:
- Интеграция с банковскими API для автоматического импорта транзакций
- Категоризация трат с аналитикой
- Push-уведомления о приближении к лимиту
- Мультивалютность
- Совместный бюджет для семей

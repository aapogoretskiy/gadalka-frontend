# 📦 Содержимое архива Frontend

## Файлы в архиве `tarot-numerology-frontend.tar.gz`

### 📄 Конфигурационные файлы
```
├── package.json                    # Зависимости проекта
├── pnpm-lock.yaml                  # Lock файл для pnpm
├── pnpm-workspace.yaml             # Workspace конфигурация
├── vite.config.ts                  # Конфигурация Vite
├── postcss.config.mjs              # PostCSS конфигурация
├── .npmrc                          # NPM конфигурация
├── .env.example                    # Пример переменных окружения
├── __figma__entrypoint__.ts        # Entrypoint для Figma Make
└── default_shadcn_theme.css        # Дефолтная тема shadcn
```

### 📚 Документация
```
├── FRONTEND_README.md              # Инструкции по запуску (НАЧНИТЕ С ЭТОГО!)
└── TELEGRAM_INTEGRATION.md         # Детали интеграции Telegram SDK
```

### 🎨 Исходный код (src/)

#### Главные файлы
```
src/
├── app/
│   └── App.tsx                     # Главный компонент приложения
```

#### Экраны приложения
```
src/app/components/screens/
├── HomeScreen.tsx                   # Главный экран
├── TarotDeckScreen.tsx             # Колода таро (78 карт)
├── TarotDayDetailedScreen.tsx      # Детальный расклад дня
├── TarotCardDetailScreen.tsx       # Детали карты таро
├── NumerologyScreen.tsx            # Главный экран нумерологии
├── NumerologyPeriodSelectScreen.tsx # Выбор периода
├── NumerologyPeriodDetailsScreen.tsx # Детали периода
├── CompatibilityScreen.tsx         # Расчет совместимости
├── CompatibilityDetailsScreen.tsx  # Результаты совместимости
├── ProfileScreen.tsx               # Профиль пользователя
├── OnboardingScreen.tsx            # Онбординг (имя, дата рождения)
├── CardDiaryScreen.tsx             # Дневник избранных карт
├── HistoryScreen.tsx               # История всех расчетов
├── DeckShopScreen.tsx              # Магазин визуальных колод
└── NotificationsSettingsScreen.tsx # Настройки уведомлений
```

#### UI компоненты
```
src/app/components/ui/
├── button.tsx                      # Кнопки
├── card.tsx                        # Карточки
├── badge.tsx                       # Бейджи
├── slider.tsx                      # Слайдеры
├── tooltip.tsx                     # Подсказки
├── accordion.tsx                   # Аккордеоны
├── carousel.tsx                    # Карусели
├── dialog.tsx                      # Диалоги
├── switch.tsx                      # Переключатели
├── DailyQuote.tsx                  # Ежедневные цитаты
├── ProgressIndicator.tsx           # Индикатор прогресса
└── ScreenTransition.tsx            # Анимации переходов
```

#### Другие компоненты
```
src/app/components/
├── BottomNav.tsx                   # Нижняя навигация
├── TarotCard.tsx                   # Компонент карты таро
├── IPhoneFrame.tsx                 # iPhone фрейм для превью
└── figma/                          # Figma-специфичные компоненты
```

#### Данные и утилиты
```
src/app/
├── data/
│   └── tarotDeck.ts               # Все 78 карт таро с описаниями
└── utils/
    └── telegram.ts                 # Telegram SDK интеграция
```

#### Стили
```
src/styles/
├── index.css                       # Главный CSS файл
├── tailwind.css                    # Tailwind импорты
├── theme.css                       # Тема (цвета, токены)
└── fonts.css                       # Шрифты
```

#### Ресурсы
```
src/imports/
└── image-0.png                     # Импортированные изображения
```

---

## 🚀 Быстрый старт

1. **Распакуйте архив:**
   ```bash
   tar -xzf tarot-numerology-frontend.tar.gz -C my-project
   cd my-project
   ```

2. **Установите зависимости:**
   ```bash
   pnpm install
   # или
   npm install
   ```

3. **Настройте переменные окружения:**
   ```bash
   cp .env.example .env
   # Отредактируйте .env, укажите VITE_API_URL
   ```

4. **Запустите:**
   ```bash
   pnpm run dev
   ```

5. **Прочитайте FRONTEND_README.md** для полных инструкций!

---

## 📊 Статистика

- **Всего файлов:** 107
- **Размер архива:** ~473 KB
- **Экраны:** 14
- **UI компоненты:** 30+
- **Карты таро:** 78 (полная колода)

## 🛠️ Технологии

- ⚛️ React 18
- 📘 TypeScript
- ⚡ Vite
- 🎨 Tailwind CSS v4
- 🎬 Motion (Framer Motion)
- 📱 Telegram Web App SDK (@twa-dev/sdk)
- 🎭 Radix UI компоненты

---

**Готово к разработке!** 🎉

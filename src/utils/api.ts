import axios from 'axios'
import { useToast } from '@/composables/useToast'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipGlobalError?: boolean
  }
}

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// ── Axios instance ──────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Перехватчик: автоматически добавляет JWT-токен к каждому запросу
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('jwt_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Перехватчик ответов: при 401 (токен истёк/невалиден) очищаем токен
// и перезагружаем страницу — App.vue снова вызовет authWithTelegram()
const { addToast } = useToast()

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const skip = error.config?.skipGlobalError

    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('jwt_token')
      localStorage.removeItem('jwt_token')
      // Перезагружаем только если токен был — чтобы не зациклиться.
      // Используем location.href вместо reload() для надёжности в Telegram WebView.
      if (hadToken) {
        window.location.href = window.location.href
      }
    } else if (!skip && error.response) {
      // 4xx / 5xx (кроме 401)
      const message: string =
        error.response.data?.message || 'Что-то пошло не так, попробуйте позже'
      addToast(message)
    } else if (!skip && error.request) {
      // Сетевая ошибка: нет соединения или таймаут
      addToast('Нет соединения с сервером')
    }

    return Promise.reject(error)
  }
)

// ── Типы, точно соответствующие OpenAPI-спецификации бэкенда ───────────────

// POST /api/auth/telegram
export interface TelegramUserDto {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  // Может ли бот проактивно писать пользователю в Telegram (см. User.notificationsAllowed
  // на бэке). false — вероятно, зашёл в MiniApp по прямой ссылке (?startapp=...) минуя /start,
  // и рассылки/уведомления до него не доходят. Используется для баннера requestWriteAccess.
  notificationsAllowed?: boolean
}

export interface TelegramAuthResponse {
  user: TelegramUserDto
  jwtToken: string
  readingBalance: number   // баланс знаков на момент входа
  isNewUser: boolean       // true если пользователь зарегистрировался впервые
  termsAccepted: boolean   // принял ли оферту/ПК — гейт онбординга (welcome vs главная)
}

// Время уведомлений — должно точно совпадать с enum NotificationTime на бэкенде
export type NotificationTime = 'MORNING' | 'EVENING' | 'DISABLED'

// GET/POST/PUT /api/user-profiles
export interface ProfileResponse {
  id: number
  birthDate?: string       // format: date (YYYY-MM-DD)
  birthTime?: {
    hour: number
    minute: number
    second: number
    nano: number
  }
  birthCity?: string
  goals?: Goal[]
  notificationTime?: NotificationTime
}

export type Goal = 'LOVE' | 'MONEY' | 'SELF_CONFIDENCE' | 'CAREER' | 'HEALTH'

export interface CreateProfileRequest {
  birthDate?: string       // format: date (YYYY-MM-DD)
  birthTime?: string       // format: "12:30:00"
  birthCity?: string
  goals?: Goal[]
  termsVersion?: string    // версия принятых юридических документов (YYYY-MM-DD)
  notificationTime?: NotificationTime
}

export interface UpdateProfileRequest {
  birthDate?: string
  birthTime?: string
  birthCity?: string
  goals?: Goal[]
  notificationTime?: NotificationTime
  numerologyName?: string
}

// GET /api/numerology/portrait
export interface NumerologyPortraitCompatibilityItem {
  number: number
  archetype: string
  compatibility: number
}

export interface NumerologyPortraitResponse {
  lifePathNumber: number
  lifePathArchetype: string
  lifePathDescription: string
  lifePathStrengths: string
  lifePathGrowthPoints: string
  lifePathCalling: string
  lifePathFamousPeople: string

  birthdayNumber: number
  birthdayArchetype: string
  birthdayDescription: string

  soulNumber: number
  soulArchetype: string
  soulDescription: string

  nameNumber: number
  nameArchetype: string
  nameDescription: string

  nameUsed: string
  nameSource: 'custom' | 'telegram'

  compatibility: NumerologyPortraitCompatibilityItem[]
}

// GET /api/daily-card
export interface DailyCardResponse {
  cardId: number
  name: string
  meaning: string
  advice: string
  imageUrl?: string
  date: string             // format: date
  insightTitle?: string
  descriptionParagraph1?: string
  descriptionParagraph2?: string
  keywords?: string[]
}

// GET /api/fortune
export type SpreadType = 'THREE_CARD' | 'HORSESHOE' | 'CELTIC_CROSS'

export type CardPosition =
  // Три карты
  | 'PAST' | 'PRESENT' | 'FUTURE'
  // Подкова (7 карт)
  | 'HORSESHOE_PAST' | 'HORSESHOE_PRESENT' | 'HORSESHOE_HIDDEN'
  | 'HORSESHOE_OBSTACLES' | 'HORSESHOE_EXTERNAL' | 'HORSESHOE_ADVICE' | 'HORSESHOE_OUTCOME'
  // Кельтский крест (10 карт)
  | 'CELTIC_HEART' | 'CELTIC_CROSS' | 'CELTIC_FOUNDATION' | 'CELTIC_PAST'
  | 'CELTIC_POSSIBLE_FUTURE' | 'CELTIC_NEAR_FUTURE' | 'CELTIC_SELF'
  | 'CELTIC_EXTERNAL' | 'CELTIC_HOPES_FEARS' | 'CELTIC_OUTCOME'

export interface CardDto {
  id: number
  name: string
  meaning: string
  cardPosition: CardPosition
  interpretation?: string
  imageUrl?: string
}

export interface FortuneResponse {
  id?: number
  username: string
  question?: string
  cards: CardDto[]
  interpretation: string
  spreadType: SpreadType
}

// POST /api/fortune/compatibility
export interface PersonInput {
  name: string
  birthDate: string  // format: date (YYYY-MM-DD)
}

export interface CompatibilityRequest {
  persons: [PersonInput, PersonInput]
}

export interface CompatibilityCategoryScore {
  name: string
  score: number
}

export interface CompatibilityResponse {
  id: number
  persons: PersonInput[]
  compatibilityScore: number
  label: string
  unlocked: boolean
  interpretation?: string
  categories?: CompatibilityCategoryScore[]
}

// GET /api/numerology/week
export interface NumerologyWeekDayDto {
  date: string             // format: date (YYYY-MM-DD)
  dayOfWeek: string         // "Пн" … "Вс"
  dayCode: number
  dayCodeTitle: string
  resonanceScore: number    // 0–100, насколько код дня резонирует с числом жизненного пути
  resonanceLabel: string    // "Благоприятный" | "Нейтральный" | "Будьте внимательнее"
}

export interface NumerologyWeekPeakDayDto {
  date: string
  dayOfWeek: string
  label: string
  advice: string
}

export interface NumerologyWeekResponse {
  id: number
  weekStart: string
  weekEnd: string
  weekNumber: number
  weekNumberTitle: string
  weekDescription: string
  days: NumerologyWeekDayDto[]
  bestDay: NumerologyWeekDayDto
  challengingDay: NumerologyWeekDayDto
  weeklyAffirmation: string
  // Может быть null/undefined для раскладов, созданных до появления этих полей
  mainTheme?: string | null
  peakDays?: NumerologyWeekPeakDayDto[] | null
  whatToStrengthen?: string | null
  whatToAvoid?: string | null
  relationships?: string | null
  finance?: string | null
}

// GET /api/numerology/month
export interface NumerologyMonthLifeAreaDto {
  score: number   // 1–5
  text: string
}

export interface NumerologyMonthLifeAreasDto {
  relationships: NumerologyMonthLifeAreaDto
  career: NumerologyMonthLifeAreaDto
  finance: NumerologyMonthLifeAreaDto
  health: NumerologyMonthLifeAreaDto
}

export interface NumerologyMonthKeyDateDto {
  date: string          // YYYY-MM-DD
  badge: string          // "Пик" | "Осторожно" | "Решения" | "Встреча"
  description: string
}

// Превью одной из 4 недель месяца — полный расклад открывается через getNumerologyWeekByDate(startDate)
export interface NumerologyMonthWeekPreviewDto {
  weekIndex: number      // 1–4
  startDate: string
  endDate: string
  weekNumber: number
  weekNumberTitle: string
  resonanceLabel: string
}

export interface NumerologyMonthResponse {
  id: number
  monthStart: string
  monthEnd: string
  monthNumber: number
  monthNumberTitle: string
  mainTheme: string
  lifeAreas: NumerologyMonthLifeAreasDto
  keyDates: NumerologyMonthKeyDateDto[]
  whatToAvoid: string
  advice: string
  weekPreviews: NumerologyMonthWeekPreviewDto[]
}

// GET /api/numerology/year
// Один из 4 ключевых периодов года (квартал) — позиция бейджа зафиксирована
// (Старт/Пауза/Пик/Итоги), а месяц-победитель внутри квартала определяется резонансом.
export interface NumerologyYearKeyPeriodDto {
  badge: string          // "Старт" | "Пауза" | "Пик" | "Итоги"
  calendarMonth: number  // 1-12
  monthName: string
  monthNumber: number
  monthNumberTitle: string
  description: string
}

// Лёгкое превью одного из 12 месяцев года — считается на лету, без создания записи.
// Полный разбор месяца открывается по клику через getNumerologyMonthByDate(date).
export interface NumerologyYearMonthPreviewDto {
  calendarMonth: number  // 1-12
  monthName: string
  monthNumber: number
  monthNumberTitle: string
  resonanceLabel: string
}

export interface NumerologyYearResponse {
  id: number
  yearStart: string
  yearEnd: string
  yearNumber: number
  yearTitle: string
  mainTheme: string
  lifeAreas: NumerologyMonthLifeAreasDto
  keyPeriods: NumerologyYearKeyPeriodDto[]
  whatToAvoid: string
  advice: string
  monthPreviews: NumerologyYearMonthPreviewDto[]
}

// GET /api/numerology/today
export interface NumerologyTodayResponse {
  id: number
  date: string
  dayCode: number
  dayCodeTitle: string
  lifePathNumber: number
  lifePathTitle: string
  lifePathDescription: string
  moonPhase: string
  zodiacSign: string
  bestTime: string
  energyOfDay: string
  whatToDo: string
  whatToAvoid: string
  astroEvent: string
  affirmation: string
  personalYearNumber: number
  personalMonthNumber: number
}

// GET /api/horoscope/daily
export interface DailyHoroscopeResponse {
  date: string             // format: date (YYYY-MM-DD)
  zodiacSign: string       // отображаемое имя знака, например "Телец"
  periodLabel: string      // "20 апреля — 20 мая"
  generalScore: number     // 1–5
  loveScore: number        // 1–5
  careerScore: number      // 1–5
  moneyScore: number       // 1–5
  general: string
  advice: string
  love: string
  career: string
  money: string
  luckyNumbers: number[]   // статично по знаку, не зависит от даты
  luckyColors: string[]    // статично по знаку
  stone: string            // статично по знаку
  stale: boolean           // true — сегодняшняя генерация не удалась, показан вчерашний гороскоп (см. date)
}

// ── Платежи ─────────────────────────────────────────────────────────────────

export interface PaymentProduct {
  code: string           // "pack_3", "pack_7", "pack_15"
  name: string           // "3 знака"
  readingsCount: number  // сколько знаков даёт пакет
  bonusCredits: number   // бонусные знаки сверх пакета (0 или 2 для pack_15)
  priceRub: number       // цена в рублях
  priceStars: number     // цена в Telegram Stars
}

export interface BalanceResponse {
  balance: number
  hasActiveSubscription: boolean
  // Доступна ли покупка подписок (пока фича в закрытом тесте — true только для админов).
  // Фронт показывает остальным вкладку «Подписки» задизейбленной («Будет доступна позже»).
  subscriptionsAvailable: boolean
}

// ── Подписки ────────────────────────────────────────────────────────────────

// Чем оплачивается платное действие: знаки или квота подписки.
// Должно совпадать с enum SpendMode на бэкенде.
export type SpendMode = 'CREDITS' | 'QUOTA'

export type QuotaPeriod = 'DAILY' | 'PER_PERIOD'

// GET /api/v1/subscriptions/plans — квота плана («5 × Три карты на весь срок»)
export interface SubscriptionPlanQuota {
  featureType: FeatureType
  quotaCount: number
  quotaPeriod: QuotaPeriod
}

export interface SubscriptionPlan {
  id: number
  name: string
  priceRub: number       // в рублях (как PaymentProduct.priceRub)
  priceStars: number
  durationDays: number
  quotas: SubscriptionPlanQuota[]
}

// GET /api/v1/subscriptions/my — остаток квоты активной подписки
export interface SubscriptionQuotaState {
  featureType: FeatureType
  quotaPeriod: QuotaPeriod
  total: number
  remaining: number
}

export interface MySubscriptionResponse {
  subscriptionId: number
  planName: string
  startedAt: string
  expiresAt: string
  quotas: SubscriptionQuotaState[]
}

// GET /api/v1/payments/spend-options — данные для модалки выбора способа списания
export interface SpendOptionsResponse {
  creditCost: number
  balance: number
  canSpendCredits: boolean
  hasQuota: boolean
  quotaRemaining: number
  quotaTotal: number
  quotaPeriod: QuotaPeriod | null
}

export interface CreatePaymentRequest {
  productCode: string
}

export interface CreatePaymentResponse {
  paymentUrl: string
}

export interface PaymentConfig {
  /** Активный провайдер рублёвых платежей: "robokassa" | "yookassa" */
  rubProvider: 'robokassa' | 'yookassa'
}

// GET/POST /api/diary
export type FeatureType = 'THREE_CARD' | 'HORSESHOE' | 'CELTIC_CROSS' | 'COMPATIBILITY' | 'DAILY_CARD' | 'NUMEROLOGY_DAY' | 'NUMEROLOGY_WEEK' | 'NUMEROLOGY_MONTH' | 'NUMEROLOGY_YEAR' | 'DAILY_HOROSCOPE' | 'DREAM'

export interface DiarySaveRequest {
  featureType: FeatureType
  referenceId: number
}

export interface DiaryEntryDto {
  id: number
  featureType: FeatureType
  createdAt: string
  data: any
}

export interface DiaryHistoryResponse {
  entries: DiaryEntryDto[]
}

// ── Входящие (сообщения от администратора внутри приложения) ────────────────
// Второй канал доставки рассылок, не зависящий от Telegram (см. User.notificationsAllowed
// и баннер requestWriteAccess на HomeScreen) — MiniApp доступен пользователю напрямую,
// вне зависимости от того, может ли бот писать ему проактивно.
export interface InboxMessageDto {
  id: number
  text: string
  createdAt: string
  read: boolean
}

export interface InboxPageResponse {
  content: InboxMessageDto[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// GET /api/question-presets
export interface QuestionPresetDto {
  id: number
  questionText: string
}

export interface QuestionCategoryDto {
  id: number
  code: string          // love | money | work | life | health — совпадает с FortuneRequest.category
  name: string
  presets: QuestionPresetDto[]
}

// GET /api/feature-costs — актуальная стоимость платных функций в знаках.
// Запрашивается заново при каждом заходе на экран с платным контентом,
// чтобы цена на экране совпадала с тем, что реально списывается (цены настраиваются
// в админ-панели без деплоя и могут поменяться в любой момент).
export interface FeatureCostsResponse {
  threeCard: number
  horseshoe: number
  celticCross: number
  compatibilityUnlock: number
  numerologyWeek: number
  numerologyMonth: number
  numerologyYear: number
  dream: number
}

// Отметки «Новинка»/«Хит» — включаются и выключаются из админ-панели (вкладка «Цены»),
// без деплоя. newSince — момент, когда «Новинка» была проставлена последний раз;
// нужен, чтобы корректно решать, показывать ли пользователю жёлтую точку в навигации
// заново (см. useNewFeatureDots.ts).
export interface FeatureBadge {
  isNew: boolean
  isHot: boolean
  newSince: string | null
}

export interface FeatureBadgesResponse {
  threeCard: FeatureBadge
  horseshoe: FeatureBadge
  celticCross: FeatureBadge
  compatibilityUnlock: FeatureBadge
  numerologyWeek: FeatureBadge
  numerologyMonth: FeatureBadge
  numerologyYear: FeatureBadge
  dream: FeatureBadge
}

// ── Сонник ──────────────────────────────────────────────────────────────────

// GET /api/dreams/symbols — чипы «Частые символы в снах»
export interface DreamSymbolDto {
  id: number
  emoji: string
  name: string
}

// POST /api/dreams
export interface DreamRequest {
  dreamText?: string | null   // до 1000 символов; можно не передавать, если выбраны чипы
  symbolIds?: number[]        // можно не передавать, если есть текст
  spendMode?: SpendMode       // чем оплатить: знаки (по умолчанию) или квота подписки
}

export interface DreamSymbolMeaningDto {
  name: string
  meaning: string
}

// Полный разбор сна (и ответ POST /api/dreams, и GET /api/dreams/{id})
export interface DreamResponse {
  id: number
  createdAt: string
  dreamText?: string | null
  selectedSymbols: string[]        // снимок выбранных чипов
  titleSymbols: string[]           // 2-3 ключевых символа для заголовка
  mainMeaning: string
  lifeNumber: number
  lifeNumberTitle: string          // архетип числа («Лидер»)
  lifeNumberSection: string
  zodiacSign: string               // «Телец»
  zodiacSection: string
  symbols: DreamSymbolMeaningDto[] // разбор каждого символа в контексте сна
  advice: string
  oracleQuestion: string           // предзаполненный вопрос для «Спросить карты об этом»
}

// GET /api/dreams/recent — карточки «Недавние сны»
export interface DreamHistoryItemDto {
  id: number
  createdAt: string
  titleSymbols: string[]
}

// GET /api/themes
export interface ThemeDto {
  id: number
  slug: string
  name: string
  description: string
  price: number        // стоимость в кредитах (знаках)
  owned: boolean       // пользователь владеет темой (куплена или бесплатная)
  active: boolean      // текущая активная тема
  enabled: boolean     // доступна для покупки (false = "скоро")
  free: boolean        // бесплатная тема
}

// ── API-методы ──────────────────────────────────────────────────────────────
export const api = {

  // Авторизация через Telegram initData
  // Бэкенд ожидает строку initData в теле запроса
  authTelegram: (initData: string) =>
    apiClient.post<TelegramAuthResponse>('/api/auth/telegram', initData, {
      headers: { 'Content-Type': 'text/plain' },
    }),

  // Получить текущего пользователя по JWT-токену
  getMe: () =>
    apiClient.get<TelegramUserDto>('/api/me'),

  // Фиксация согласия с офертой и политикой конфиденциальности (welcome-экран онбординга)
  acceptTerms: (termsVersion: string) =>
    apiClient.post<{ accepted: boolean }>('/api/me/accept-terms', { termsVersion }),

  // Профиль пользователя
  getProfile: () =>
    apiClient.get<ProfileResponse>('/api/user-profiles', { skipGlobalError: true }),

  createProfile: (data: CreateProfileRequest) =>
    apiClient.post<ProfileResponse>('/api/user-profiles', data, { skipGlobalError: true }),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<ProfileResponse>('/api/user-profiles', data),

  deleteProfile: () =>
    apiClient.delete('/api/user-profiles'),

  // Карта дня
  getDailyCard: () =>
    apiClient.get<DailyCardResponse>('/api/daily-card'),

  // Гадание (тип расклада передаётся явно; по умолчанию THREE_CARD)
  // Кельтский крест (10 карт) делает 11 последовательных запросов к AI — может занять до ~20с,
  // поэтому таймаут для этого эндпоинта выше глобального.
  getFortune: (question: string, category?: string, spreadType: SpreadType = 'THREE_CARD', spendMode: SpendMode = 'CREDITS') =>
    apiClient.post<FortuneResponse>(
      '/api/fortune',
      { question, category: category || null, spreadType, spendMode },
      { timeout: 60000 },
    ),

  // Онбординг: вопросы для подарочного расклада (кнопки)
  getOnboardingQuestions: () =>
    apiClient.get<string[]>('/api/fortune/onboarding/questions'),

  // Онбординг: подарочный первый расклад (без списания знаков, из предгенерированного пула)
  createOnboardingFortune: (question: string) =>
    apiClient.post<FortuneResponse>('/api/fortune/onboarding', { question }),

  // Совместимость
  getCompatibility: (data: CompatibilityRequest) =>
    apiClient.post<CompatibilityResponse>('/api/fortune/compatibility', data),

  // Разблокировать полный анализ совместимости (знаки или квота подписки)
  unlockCompatibility: (id: number, spendMode: SpendMode = 'CREDITS') =>
    apiClient.post<CompatibilityResponse>(`/api/fortune/compatibility/${id}/unlock`, null, { params: { spendMode } }),

  // Дневник
  getDiaryHistory: (featureType: FeatureType, from: string, to: string) =>
    apiClient.get<DiaryHistoryResponse>('/api/diary', { params: { featureType, from, to } }),

  saveDiaryEntry: (data: DiarySaveRequest) =>
    apiClient.post<DiaryEntryDto>('/api/diary', data),

  // Нумерология дня
  getNumerologyToday: () =>
    apiClient.get<NumerologyTodayResponse>('/api/numerology/today'),

  // Нумерологический портрет
  getNumerologyPortrait: () =>
    apiClient.get<NumerologyPortraitResponse>('/api/numerology/portrait', { skipGlobalError: true }),

  // Сохранить имя для портрета (пустая строка = сброс на TG-имя)
  saveNumerologyName: (name: string) =>
    apiClient.patch<void>(`/api/numerology/portrait/name`, null, { params: { name } }),

  // Гороскоп на день (бесплатно, по знаку зодиака из профиля)
  // skipGlobalError: true — 422 (нет даты рождения в профиле) обрабатываем сами в useHoroscope
  getDailyHoroscope: () =>
    apiClient.get<DailyHoroscopeResponse>('/api/horoscope/daily', { skipGlobalError: true }),

  // Нумерология недели (платно — 3 знака; повторный вызов в течение действующих 7 дней бесплатен)
  // skipGlobalError: true — 402 (мало знаков) и 422 (нет даты рождения) обрабатываем сами в виджете
  getNumerologyWeek: (spendMode: SpendMode = 'CREDITS') =>
    apiClient.get<NumerologyWeekResponse>('/api/numerology/week', { params: { spendMode }, skipGlobalError: true }),

  // Тихая проверка уже оплаченного расклада на неделю — НЕ создаёт новый и НЕ списывает знаки.
  // 404, если на эту неделю расклада ещё нет (нормальный случай, не показываем ошибку).
  getNumerologyWeekCurrent: () =>
    apiClient.get<NumerologyWeekResponse>('/api/numerology/week/current', { skipGlobalError: true }),

  // Расклад на неделю по точной дате начала (YYYY-MM-DD) — бесплатно и без создания,
  // используется для перехода на одну из 4 недель внутри купленного месяца.
  // 404, если расклада с такой датой ещё нет.
  getNumerologyWeekByDate: (date: string) =>
    apiClient.get<NumerologyWeekResponse>('/api/numerology/week/by-date', { params: { date }, skipGlobalError: true }),

  // Нумерология месяца (платно — 10 знаков; повторный вызов в течение действующего месяца бесплатен).
  // 4 недели внутри месяца включены в стоимость и создаются автоматически.
  getNumerologyMonth: (spendMode: SpendMode = 'CREDITS') =>
    apiClient.get<NumerologyMonthResponse>('/api/numerology/month', { params: { spendMode }, skipGlobalError: true }),

  // Тихая проверка уже оплаченного разбора на месяц — НЕ создаёт новый и НЕ списывает знаки.
  getNumerologyMonthCurrent: () =>
    apiClient.get<NumerologyMonthResponse>('/api/numerology/month/current', { skipGlobalError: true }),

  // Открыть конкретный месяц (любой из 12) внутри уже купленного годового разбора — бесплатно,
  // создаётся по клику. 402, если год на этот год ещё не куплен; 422 без даты рождения.
  getNumerologyMonthByDate: (date: string) =>
    apiClient.get<NumerologyMonthResponse>('/api/numerology/month/by-date', { params: { date }, skipGlobalError: true }),

  // Нумерология года (платно — 18 знаков; повторный вызов в течение действующего года бесплатен).
  // 12 месяцев показаны как лёгкие превью и открываются бесплатно по клику (см. getNumerologyMonthByDate).
  getNumerologyYear: (spendMode: SpendMode = 'CREDITS') =>
    apiClient.get<NumerologyYearResponse>('/api/numerology/year', { params: { spendMode }, skipGlobalError: true }),

  // Тихая проверка уже оплаченного разбора на год — НЕ создаёт новый и НЕ списывает знаки.
  getNumerologyYearCurrent: () =>
    apiClient.get<NumerologyYearResponse>('/api/numerology/year/current', { skipGlobalError: true }),

  // Платежи
  getProducts: () =>
    apiClient.get<PaymentProduct[]>('/api/v1/payments/products'),

  getPaymentConfig: () =>
    apiClient.get<PaymentConfig>('/api/v1/payments/config'),

  getBalance: () =>
    apiClient.get<BalanceResponse>('/api/v1/payments/balance'),

  createYooKassaPayment: (data: CreatePaymentRequest) =>
    apiClient.post<CreatePaymentResponse>('/api/v1/payments/yookassa/create', data),

  createStarsPayment: (data: CreatePaymentRequest) =>
    apiClient.post<CreatePaymentResponse>('/api/v1/payments/stars/create', data),

  createRobokassaPayment: (data: CreatePaymentRequest) =>
    apiClient.post<CreatePaymentResponse>('/api/v1/payments/robokassa/create', data),

  // ── Подписки ──────────────────────────────────────────────────────────────

  // Каталог планов подписки (вкладка «Подписки»)
  getSubscriptionPlans: () =>
    apiClient.get<SubscriptionPlan[]>('/api/v1/subscriptions/plans'),

  // Моя активная подписка с остатками квот. 404 — подписки нет (не ошибка)
  getMySubscription: () =>
    apiClient.get<MySubscriptionResponse>('/api/v1/subscriptions/my', { skipGlobalError: true }),

  // Покупка подписки: provider = 'robokassa' | 'yookassa' | 'stars'
  createSubscriptionPayment: (provider: 'robokassa' | 'yookassa' | 'stars', planId: number) =>
    apiClient.post<CreatePaymentResponse>(`/api/v1/subscriptions/${provider}/create`, { planId }),

  // Чем можно оплатить фичу (модалка выбора способа списания)
  getSpendOptions: (feature: FeatureType) =>
    apiClient.get<SpendOptionsResponse>('/api/v1/payments/spend-options', { params: { feature } }),

  // Входящие
  getInbox: (page = 0, size = 20) =>
    apiClient.get<InboxPageResponse>('/api/inbox', { params: { page, size } }),

  getInboxUnreadCount: () =>
    apiClient.get<{ unreadCount: number }>('/api/inbox/unread-count'),

  markInboxRead: () =>
    apiClient.post<void>('/api/inbox/read-all'),

  // Пресеты вопросов по категориям (экран "О чём спросить карты?")
  // Данные почти статичны — composable useQuestionPresets кэширует результат.
  getQuestionPresets: () =>
    apiClient.get<QuestionCategoryDto[]>('/api/question-presets'),

  // Темы карт (магазин колод)
  getThemes: () =>
    apiClient.get<ThemeDto[]>('/api/themes'),

  activateTheme: (themeId: number) =>
    apiClient.post<void>(`/api/themes/${themeId}/activate`),

  // skipGlobalError: true — обрабатываем ошибки вручную в useTheme
  // (402 = мало кредитов, 409 = уже куплена — показываем свои сообщения)
  purchaseTheme: (themeId: number) =>
    apiClient.post<void>(`/api/themes/${themeId}/purchase`, {}, { skipGlobalError: true }),

  // Health check
  health: () =>
    apiClient.get<Record<string, string>>('/api/health'),

  // Актуальная стоимость платных функций (расклады, совместимость, нумерология недели, сонник)
  getFeatureCosts: () =>
    apiClient.get<FeatureCostsResponse>('/api/feature-costs'),

  // Отметки «Новинка»/«Хит» по всем платным функциям
  getFeatureBadges: () =>
    apiClient.get<FeatureBadgesResponse>('/api/feature-badges'),

  // ── Сонник ────────────────────────────────────────────────────────────────

  // Чипы «Частые символы в снах» (справочник, редактируется в админке)
  getDreamSymbols: () =>
    apiClient.get<DreamSymbolDto[]>('/api/dreams/symbols'),

  // Платный AI-разбор сна. skipGlobalError — ошибки (402 мало знаков,
  // 422 чувствительная тема/нет даты рождения) показываем внутри экрана, а не тостом.
  // Таймаут выше глобального: генерация JSON-разбора занимает до ~30с.
  analyzeDream: (data: DreamRequest) =>
    apiClient.post<DreamResponse>('/api/dreams', data, { timeout: 60000, skipGlobalError: true }),

  // Недавние сны (последние 5) для экрана Сонника
  getRecentDreams: () =>
    apiClient.get<DreamHistoryItemDto[]>('/api/dreams/recent'),

  // Открыть сохранённый разбор из истории — бесплатно
  getDream: (id: number) =>
    apiClient.get<DreamResponse>(`/api/dreams/${id}`),

  // Реферальная ссылка текущего пользователя
  getReferralLink: () =>
    apiClient.get<{ code: string; link: string }>('/api/me/referral'),

  // Обратная связь (тикеты поддержки)
  // skipGlobalError: true — показываем кастомное сообщение при лимите (400)
  submitFeedback: (description: string) =>
    apiClient.post<{ id: number; status: string; createdAt: string }>(
      '/api/feedback',
      { description },
      { skipGlobalError: true },
    ),

  // Оценка платного действия (👍/👎)
  // type: 'FORTUNE' | 'COMPATIBILITY' | 'NUMEROLOGY_WEEK' | 'NUMEROLOGY_MONTH' | 'NUMEROLOGY_YEAR' | 'DREAM'
  // skipGlobalError: true — виджет сам обрабатывает ошибку (не мешаем UI)
  submitActionFeedback: (
    type: 'FORTUNE' | 'COMPATIBILITY' | 'NUMEROLOGY_WEEK' | 'NUMEROLOGY_MONTH' | 'NUMEROLOGY_YEAR' | 'DREAM',
    actionId: number,
    rating: 'POSITIVE' | 'NEGATIVE',
    comment?: string,
  ) =>
    apiClient.post<void>(
      `/api/action-feedback/${type}/${actionId}`,
      { rating, comment: comment ?? null },
      { skipGlobalError: true },
    ),
}

export default apiClient

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
}

export interface TelegramAuthResponse {
  user: TelegramUserDto
  jwtToken: string
  readingBalance: number   // баланс знаков на момент входа
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
}

// GET /api/daily-card
export interface DailyCardResponse {
  cardId: number
  name: string
  meaning: string
  advice: string
  imageUrl?: string
  date: string             // format: date
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

// ── Платежи ─────────────────────────────────────────────────────────────────

export interface PaymentProduct {
  code: string           // "pack_3", "pack_7", "pack_15"
  name: string           // "3 знака"
  readingsCount: number  // сколько знаков даёт пакет
  priceRub: number       // цена в рублях
  priceStars: number     // цена в Telegram Stars
}

export interface BalanceResponse {
  balance: number
  hasActiveSubscription: boolean
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
export type FeatureType = 'THREE_CARD' | 'HORSESHOE' | 'CELTIC_CROSS' | 'COMPATIBILITY' | 'DAILY_CARD' | 'NUMEROLOGY_DAY'

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
  getFortune: (question: string, category?: string, spreadType: SpreadType = 'THREE_CARD') =>
    apiClient.post<FortuneResponse>(
      '/api/fortune',
      { question, category: category || null, spreadType },
      { timeout: 60000 },
    ),

  // Совместимость
  getCompatibility: (data: CompatibilityRequest) =>
    apiClient.post<CompatibilityResponse>('/api/fortune/compatibility', data),

  // Разблокировать полный анализ совместимости за 1 знак
  unlockCompatibility: (id: number) =>
    apiClient.post<CompatibilityResponse>(`/api/fortune/compatibility/${id}/unlock`),

  // Дневник
  getDiaryHistory: (featureType: FeatureType, from: string, to: string) =>
    apiClient.get<DiaryHistoryResponse>('/api/diary', { params: { featureType, from, to } }),

  saveDiaryEntry: (data: DiarySaveRequest) =>
    apiClient.post<DiaryEntryDto>('/api/diary', data),

  // Нумерология дня
  getNumerologyToday: () =>
    apiClient.get<NumerologyTodayResponse>('/api/numerology/today'),

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

  // Реферальная ссылка текущего пользователя
  getReferralLink: () =>
    apiClient.get<{ code: string; link: string }>('/api/me/referral'),
}

export default apiClient

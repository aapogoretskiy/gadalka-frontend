import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// ── Axios instance ──────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'ngrok-skip-browser-warning': 'true'
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
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem('jwt_token')
      localStorage.removeItem('jwt_token')
      // Перезагружаем только если токен был — чтобы не зациклиться
      if (hadToken) {
        window.location.reload()
      }
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
}

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
}

export type Goal = 'LOVE' | 'MONEY' | 'SELF_CONFIDENCE' | 'CAREER' | 'HEALTH'

export interface CreateProfileRequest {
  birthDate?: string       // format: date (YYYY-MM-DD)
  birthTime?: string       // format: "12:30:00"
  birthCity?: string
  goals?: Goal[]
}

export interface UpdateProfileRequest {
  birthDate?: string
  birthTime?: string
  birthCity?: string
  goals?: Goal[]
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
export interface CardDto {
  id: number
  name: string
  meaning: string
  cardPosition: 'PAST' | 'PRESENT' | 'FUTURE'
  interpretation?: string
}

export interface FortuneResponse {
  id?: number
  username: string
  cards: CardDto[]
  interpretation: string
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
  id?: number
  persons: PersonInput[]
  compatibilityScore: number
  label: string
  interpretation: string
  categories: CompatibilityCategoryScore[]
}

// GET/POST /api/diary
export type FeatureType = 'THREE_CARD' | 'COMPATIBILITY' | 'DAILY_CARD'

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
    apiClient.get<ProfileResponse>('/api/user-profiles'),

  createProfile: (data: CreateProfileRequest) =>
    apiClient.post<ProfileResponse>('/api/user-profiles', data),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.put<ProfileResponse>('/api/user-profiles', data),

  deleteProfile: () =>
    apiClient.delete('/api/user-profiles'),

  // Карта дня
  getDailyCard: () =>
    apiClient.get<DailyCardResponse>('/api/daily-card'),

  // Гадание "3 карты"
  getFortune: (question: string) =>
    apiClient.post<FortuneResponse>('/api/fortune', { question }),

  // Совместимость
  getCompatibility: (data: CompatibilityRequest) =>
    apiClient.post<CompatibilityResponse>('/api/fortune/compatibility', data),

  // Дневник
  getDiaryHistory: (featureType: FeatureType, from: string, to: string) =>
    apiClient.get<DiaryHistoryResponse>('/api/diary', { params: { featureType, from, to } }),

  saveDiaryEntry: (data: DiarySaveRequest) =>
    apiClient.post<DiaryEntryDto>('/api/diary', data),

  // Health check
  health: () =>
    apiClient.get<Record<string, string>>('/api/health'),
}

export default apiClient

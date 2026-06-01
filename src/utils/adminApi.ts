import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

/**
 * Отдельный axios-инстанс для запросов к /api/admin/**.
 *
 * Ключевое отличие от основного api.ts:
 * - withCredentials: true — браузер автоматически прикладывает httpOnly-куку
 *   admin_token к каждому запросу. Без этого флага кука не отправляется.
 * - Не добавляем Authorization header — авторизация через куку, не Bearer-токен.
 */
const adminAxios = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // отправлять httpOnly-куки с каждым запросом
})

// Типы ответов от AdminController
export interface AdminUserSummary {
  id: number
  telegramId: number
  username: string
  firstName: string
  createdAt: string
  lastActiveAt: string
  banned: boolean
}

export interface AdminUserDetails extends AdminUserSummary {
  lastName: string
  referralSource: string
  balance: number
  totalSpent: number
  totalGranted: number
}

export interface AdminUsersPage {
  content: AdminUserSummary[]
  totalElements: number
  totalPages: number
  number: number  // текущая страница
  size: number
}

export interface AdminSessionResponse {
  authenticated: boolean
  telegramId?: number
}

// Данные, которые Telegram Login Widget передаёт в callback
export interface TelegramWidgetUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  photo_url?: string
  auth_date: number
  hash: string
}

export const adminApi = {

  // ── Авторизация ────────────────────────────────────────────────────────────

  /** Войти: отправить данные Telegram Widget на бэк, получить httpOnly-куку */
  login: (widgetData: TelegramWidgetUser) =>
    adminAxios.post<{ message: string }>('/api/admin/auth/login', widgetData),

  /** Выйти: бэк сбросит куку */
  logout: () =>
    adminAxios.post<{ message: string }>('/api/admin/auth/logout'),

  /** Проверить активную сессию (используется в navigation guard) */
  checkSession: () =>
    adminAxios.get<AdminSessionResponse>('/api/admin/auth/me'),

  // ── Пользователи ──────────────────────────────────────────────────────────

  /** Список пользователей с пагинацией и опциональным поиском */
  getUsers: (page = 0, size = 20, search?: string) =>
    adminAxios.get<AdminUsersPage>('/api/admin/users', {
      params: { page, size, ...(search ? { search } : {}) },
    }),

  /** Детальная информация об одном пользователе */
  getUser: (id: number) =>
    adminAxios.get<AdminUserDetails>(`/api/admin/users/${id}`),

  /** Подарить знаки пользователю */
  giftCredits: (id: number, amount: number) =>
    adminAxios.post<{ message: string }>(`/api/admin/users/${id}/gift`, { amount }),

  /** Заблокировать пользователя */
  banUser: (id: number) =>
    adminAxios.post<{ message: string }>(`/api/admin/users/${id}/ban`),

  /** Разблокировать пользователя */
  unbanUser: (id: number) =>
    adminAxios.post<{ message: string }>(`/api/admin/users/${id}/unban`),

  // ── Рассылка ──────────────────────────────────────────────────────────────

  /**
   * Запустить массовую рассылку.
   * @param message    текст сообщения (Markdown)
   * @param giftAmount количество знаков (null — не начислять)
   * @param userIds    список ID пользователей (пусто — рассылка всем)
   */
  broadcast: (message: string, giftAmount: number | null, userIds: number[]) =>
    adminAxios.post<{ message: string }>('/api/admin/broadcast', {
      message,
      giftAmount: giftAmount && giftAmount > 0 ? giftAmount : null,
      userIds: userIds.length > 0 ? userIds : null,
    }),
}

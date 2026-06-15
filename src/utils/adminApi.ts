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
  premium: boolean
  visitCount: number
  totalActionsCount: number
}

export interface AdminUserDetails extends AdminUserSummary {
  lastName: string
  referralSource: string
  referrerName: string
  balance: number
  totalSpent: number
  totalGranted: number
  birthDate: string   // YYYY-MM-DD или пустая строка если профиль не создан
}

export interface UserAction {
  id: number
  type: string
  label: string
  date: string
  details: string
  interpretation: string | null
  /** null если пользователь не оставлял оценку */
  feedbackRating: 'POSITIVE' | 'NEGATIVE' | null
  /** null если нет комментария */
  feedbackComment: string | null
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

  /** Список пользователей с пагинацией, поиском и сортировкой */
  getUsers: (page = 0, size = 20, search?: string, sortBy = 'createdAt', sortDir = 'desc') =>
    adminAxios.get<AdminUsersPage>('/api/admin/users', {
      params: { page, size, sortBy, sortDir, ...(search ? { search } : {}) },
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
  // ── Реферальная аналитика ─────────────────────────────────────────────────

  getReferralStats: () =>
    adminAxios.get<ReferralStats>('/api/admin/referral-stats'),

  getUserInvites: (userId: number) =>
    adminAxios.get<InvitedUser[]>(`/api/admin/users/${userId}/invites`),

  // ── Рассылка ──────────────────────────────────────────────────────────────

  /**
   * Запустить массовую рассылку.
   * Отправляется как multipart/form-data: JSON-часть "data" + опциональный файл "photo".
   *
   * @param message     текст сообщения
   * @param giftAmount  количество знаков (null — не начислять)
   * @param userIds     список ID пользователей (пусто — все или только админы)
   * @param onlyAdmins  если true — рассылка только администраторам
   * @param photo       файл изображения (null — только текст)
   */
  broadcast: (
    message: string,
    giftAmount: number | null,
    userIds: number[],
    onlyAdmins: boolean,
    photo?: File | null,
  ) => {
    const form = new FormData()
    form.append('data', new Blob([JSON.stringify({
      message,
      giftAmount: giftAmount && giftAmount > 0 ? giftAmount : null,
      userIds: userIds.length > 0 ? userIds : null,
      onlyAdmins,
    })], { type: 'application/json' }))
    if (photo) {
      form.append('photo', photo)
    }
    return adminAxios.post<{ message: string }>('/api/admin/broadcast', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  /** Lazy-история действий пользователя (гадания, совместимость, нумерология, карта дня) */
  getUserActions: (id: number, limit = 30) =>
    adminAxios.get<UserAction[]>(`/api/admin/users/${id}/actions`, { params: { limit } }),

  // ── Отчёты ────────────────────────────────────────────────────────────────

  /** Получить агрегированный отчёт по метрикам */
  getReports: () =>
    adminAxios.get<AdminReports>('/api/admin/reports'),

  /**
   * Получить отчёт за произвольный диапазон дат.
   * @param from начало диапазона в формате YYYY-MM-DD
   * @param to   конец диапазона в формате YYYY-MM-DD
   */
  getRangeReport: (from: string, to: string) =>
    adminAxios.get<RangeReport>('/api/admin/reports/range', { params: { from, to } }),

  // ── Заявки обратной связи ─────────────────────────────────────────────────

  /** Список заявок. status: 'OPEN' | 'CLOSED' | undefined (все) */
  getTickets: (status?: string, page = 0, size = 20) =>
    adminAxios.get<AdminTicketsPage>('/api/admin/tickets', {
      params: { page, size, ...(status ? { status } : {}) },
    }),

  /** Детальная информация об одной заявке */
  getTicket: (id: number) =>
    adminAxios.get<AdminTicketDetails>(`/api/admin/tickets/${id}`),

  /**
   * Закрыть заявку.
   * @param creditsToGift 0 или null — закрыть без подарка
   */
  closeTicket: (id: number, creditsToGift?: number | null) =>
    adminAxios.post<{ message: string; ticketId: number; creditsGifted: number }>(
      `/api/admin/tickets/${id}/close`,
      { creditsToGift: creditsToGift && creditsToGift > 0 ? creditsToGift : null },
    ),
}

// ── Типы заявок ───────────────────────────────────────────────────────────────

export interface AdminTicketSummary {
  id: number
  userId: number
  userName: string
  status: 'OPEN' | 'CLOSED'
  createdAt: string
  descriptionPreview: string
}

export interface AdminTicketDetails {
  id: number
  description: string
  status: 'OPEN' | 'CLOSED'
  createdAt: string
  closedAt: string
  creditsGifted: number
  user: {
    id: number
    telegramId: number
    username: string
    firstName: string
  }
}

export interface AdminTicketsPage {
  content: AdminTicketSummary[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

// ── Типы отчётов ──────────────────────────────────────────────────────────────

export interface MarketingSource {
  source: string
  clicks: number
  appOpens: number
  newUsers: number
  conversionPct: number
}

export interface TopReferrer {
  userId: number
  telegramId: number
  firstName: string
  username: string
  invitedCount: number
}

export interface InvitedUser {
  userId: number
  telegramId: number
  firstName: string
  username: string
  createdAt: string
}

export interface ReferralStats {
  marketing: MarketingSource[]
  topUserReferrers: TopReferrer[]
}

// ── Тип отчёта за диапазон ────────────────────────────────────────────────────

export interface RangeReport {
  from: string
  to: string
  newUsers: number
  fortunes: {
    total: number
    threeCard: number
    horseshoe: number
    celticCross: number
  }
  compatibility: number
  actions: {
    total: number
    compatibility: number
    threeCard: number
    horseshoe: number
    celticCross: number
  }
  returningUsers: number
  payments: {
    rubKopecks: number
    rubTransactions: number
    stars: number
    starsTransactions: number
  }
}

export interface AdminReports {
  users: {
    total: number
    newToday: number
    new7Days: number
    new30Days: number
    dau: number
    wau: number
  }
  fortunes: {
    total: number
    last7Days: number
    last30Days: number
  }
  compatibility: {
    total: number
    last7Days: number
    last30Days: number
  }
  actionsToday: {
    total: number
    threeCard: number
    horseshoe: number
    celticCross: number
    compatibility: number
    numerology: number
    dailyCard: number
  }
  returningUsers: {
    returning1Day: number
    returning7Days: number
    returning30Days: number
  }
  payments: {
    rubKopecksTotal: number
    rubKopecks7Days: number
    rubKopecks30Days: number
    rubPayingUsers: number
    starsTotal: number
    stars7Days: number
    stars30Days: number
    starsPayingUsers: number
  }
  credits: {
    totalGranted: number
    totalSpent: number
    currentInCirculation: number
    grantedByPayment: number
    grantedByAdmin: number
    grantedByBonus: number
  }
}

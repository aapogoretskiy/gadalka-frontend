// Telegram Mini App integration utilities для Vue
import WebApp from '@twa-dev/sdk'

export const initTelegramApp = () => {
  try { WebApp.ready() } catch {}
  try { WebApp.expand() } catch {}

  try {
    const version = parseFloat(WebApp.version || '6.0')
    if (version >= 6.2 && WebApp.enableClosingConfirmation) {
      WebApp.enableClosingConfirmation()
    }
  } catch {}

  return WebApp
}

// Получить данные пользователя Telegram
export const getTelegramUser = () => {
  const user = WebApp.initDataUnsafe?.user
  return user ? {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    username: user.username,
    languageCode: user.language_code,
  } : null
}

// Haptic feedback для кнопок
export const hapticFeedback = {
  light: () => WebApp.HapticFeedback.impactOccurred('light'),
  medium: () => WebApp.HapticFeedback.impactOccurred('medium'),
  heavy: () => WebApp.HapticFeedback.impactOccurred('heavy'),
  success: () => WebApp.HapticFeedback.notificationOccurred('success'),
  warning: () => WebApp.HapticFeedback.notificationOccurred('warning'),
  error: () => WebApp.HapticFeedback.notificationOccurred('error'),
}

// Показать всплывающее окно
export const showAlert = (message: string) => {
  WebApp.showAlert(message)
}

export const showConfirm = (message: string): Promise<boolean> => {
  return new Promise((resolve) => {
    WebApp.showConfirm(message, (confirmed) => {
      resolve(confirmed)
    })
  })
}

// Закрыть Mini App
export const closeApp = () => {
  WebApp.close()
}

// ── Разрешение на проактивные сообщения от бота ─────────────────────────────
// Пользователи, открывшие Mini App по прямой ссылке (?startapp=...), никогда
// не писали боту — Telegram не даёт ему право слать им сообщения ("chat not found"
// при рассылках). requestWriteAccess() показывает нативный диалог прямо в MiniApp:
// при согласии Telegram присылает боту служебное сообщение write_access_allowed,
// и бэкенд помечает пользователя notificationsAllowed=true (см. GadalkaTelegramBot).
// Доступно с версии клиента Telegram 6.9.

/** Поддерживает ли текущий клиент Telegram метод requestWriteAccess (>= 6.9) */
export const canRequestWriteAccess = (): boolean => {
  try {
    const version = parseFloat(WebApp.version || '6.0')
    return version >= 6.9 && typeof WebApp.requestWriteAccess === 'function'
  } catch {
    return false
  }
}

/**
 * Запрашивает у пользователя разрешение получать сообщения от бота.
 * @returns true если пользователь разрешил, false если отклонил или метод недоступен
 */
export const requestWriteAccess = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!canRequestWriteAccess()) {
      resolve(false)
      return
    }
    try {
      WebApp.requestWriteAccess((access) => resolve(!!access))
    } catch {
      resolve(false)
    }
  })
}

// Получить тему Telegram
export const getTelegramTheme = () => {
  return WebApp.colorScheme // 'light' или 'dark'
}

export default WebApp

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

// Получить тему Telegram
export const getTelegramTheme = () => {
  return WebApp.colorScheme // 'light' или 'dark'
}

export default WebApp

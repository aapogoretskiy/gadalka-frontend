// Vue composable для работы с Telegram SDK
import { ref, onMounted } from 'vue'
import { initTelegramApp, getTelegramUser, hapticFeedback } from '@/utils/telegram'
import type WebApp from '@twa-dev/sdk'

export function useTelegram() {
  const tg = ref<typeof WebApp | null>(null)
  const user = ref(getTelegramUser())

  onMounted(() => {
    tg.value = initTelegramApp()
    user.value = getTelegramUser()

    // Добавляем haptic feedback на все клики по кнопкам
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        hapticFeedback.light()
      }
    })
  })

  return {
    tg,
    user,
    hapticFeedback
  }
}

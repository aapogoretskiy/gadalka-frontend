import { ref } from 'vue'
import { api, type InboxMessageDto } from '@/utils/api'

// Синглтон — счётчик непрочитанных общий для всего приложения
// (шилдик на кнопке "Входящие" в Profile должен обновляться сразу после прочтения,
// независимо от того, на каком экране сейчас пользователь).
const unreadCount = ref(0)
const messages = ref<InboxMessageDto[]>([])
const isLoading = ref(false)

export function useInbox() {
  // Подтягивает счётчик непрочитанных — вызывается при старте приложения
  const refreshUnreadCount = async () => {
    try {
      const res = await api.getInboxUnreadCount()
      unreadCount.value = res.data.unreadCount
    } catch {
      // Молча игнорируем — шилдик просто не обновится в этот раз
    }
  }

  // Загружает список сообщений — вызывается при заходе на экран "Входящие"
  const fetchMessages = async () => {
    isLoading.value = true
    try {
      const res = await api.getInbox()
      messages.value = res.data.content
    } finally {
      isLoading.value = false
    }
  }

  // Отмечает всё прочитанным: сразу зануляем шилдик локально (оптимистично)
  // и подтверждаем на бэке — так решили: открыл вкладку → всё прочитано разом.
  const markAllRead = async () => {
    if (unreadCount.value === 0) return
    unreadCount.value = 0
    messages.value = messages.value.map(m => ({ ...m, read: true }))
    try {
      await api.markInboxRead()
    } catch {
      // Не критично — при следующем refreshUnreadCount счётчик синхронизируется сам
    }
  }

  return { unreadCount, messages, isLoading, refreshUnreadCount, fetchMessages, markAllRead }
}

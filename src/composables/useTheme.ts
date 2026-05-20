import { ref, computed } from 'vue'
import { api, type ThemeDto } from '@/utils/api'
import { useToast } from '@/composables/useToast'
import { useBalance } from '@/composables/useBalance'
import { useDailyCard } from '@/composables/useDailyCard'

// ── Синглтон — состояние одно на всё приложение ─────────────────────────────
const themes     = ref<ThemeDto[]>([])
const isLoading  = ref(false)
const isPurchasing = ref(false)  // блокирует кнопку "Купить" во время запроса
let   fetched    = false

export function useTheme() {
  const { addToast }      = useToast()
  const { refreshBalance } = useBalance()
  const { invalidate: invalidateDailyCard } = useDailyCard()

  // Активная тема — та у которой active=true; если не найдена — null
  const activeTheme = computed(() => themes.value.find(t => t.active) ?? null)

  // Общее количество тем для отображения на главном экране
  const themesCount = computed(() => themes.value.length)

  /**
   * Загружает список тем с бэка.
   * Повторный вызов без force=true ничего не делает — данные уже есть.
   */
  const fetchThemes = async (force = false) => {
    if (fetched && !force) return
    isLoading.value = true
    try {
      const res = await api.getThemes()
      themes.value = res.data
      fetched = true
    } catch {
      // Глобальный перехватчик axios уже показал toast с ошибкой
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Активирует тему — устанавливает её как текущую для пользователя.
   *
   * Используем оптимистичное обновление: сразу меняем флаг active локально,
   * не дожидаясь ответа сервера. Если запрос упадёт — откатываемся обратно.
   *
   * После успешной активации инвалидируем кэш карты дня, чтобы при следующем
   * заходе на главный экран карта загрузилась с новым imageUrl.
   */
  const activateTheme = async (themeId: number) => {
    // Сохраняем предыдущее состояние на случай отката
    const previous = themes.value.map(t => ({ ...t }))

    // Оптимистично обновляем: снимаем active со всех, ставим на нужную
    themes.value = themes.value.map(t => ({ ...t, active: t.id === themeId }))

    try {
      await api.activateTheme(themeId)
      // Инвалидируем карту дня — imageUrl обновится при следующем fetchDailyCard()
      invalidateDailyCard()
      addToast('Тема активирована', 'success')
    } catch {
      // Откатываем локальное состояние
      themes.value = previous
      // Глобальный перехватчик уже показал toast с ошибкой
    }
  }

  /**
   * Покупает тему за кредиты (гадания).
   *
   * Намеренно НЕ используем оптимистичное обновление — покупка затрагивает баланс,
   * лучше дождаться подтверждения сервера прежде чем обновлять UI.
   *
   * Обрабатываем специфичные ошибки вручную (skipGlobalError: true в api.ts):
   *   402 — недостаточно кредитов
   *   409 — тема уже куплена
   */
  const purchaseTheme = async (themeId: number): Promise<boolean> => {
    isPurchasing.value = true
    try {
      await api.purchaseTheme(themeId)

      // Помечаем тему как купленную в локальном состоянии
      themes.value = themes.value.map(t =>
        t.id === themeId ? { ...t, owned: true } : t
      )

      // Обновляем баланс на экране (списались кредиты)
      await refreshBalance()

      addToast('Тема куплена!', 'success')
      return true
    } catch (err: any) {
      const status = err.response?.status
      if (status === 402) {
        addToast('Недостаточно гаданий для покупки', 'error')
      } else if (status === 409) {
        addToast('Эта тема уже куплена', 'info')
        // Синхронизируем локальное состояние на случай рассинхрона
        themes.value = themes.value.map(t =>
          t.id === themeId ? { ...t, owned: true } : t
        )
      } else {
        addToast('Не удалось купить тему', 'error')
      }
      return false
    } finally {
      isPurchasing.value = false
    }
  }

  return {
    themes,
    isLoading,
    isPurchasing,
    activeTheme,
    themesCount,
    fetchThemes,
    activateTheme,
    purchaseTheme,
  }
}

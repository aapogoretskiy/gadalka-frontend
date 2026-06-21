import { ref } from 'vue'
import { api, type QuestionCategoryDto } from '@/utils/api'

// ── Синглтон — общее состояние на всё приложение ──
// Кэширование временно отключено: кэш-флаг мог "залипнуть" на пустом ответе,
// если бэкенд в момент первого запроса ещё не отдавал данные (например,
// миграция не была применена) — после этого данные не обновлялись до полной
// перезагрузки MiniApp. Пока всегда делаем свежий запрос; вернуть кэш можно
// будет на бэке (например, через HTTP-кэш/ETag), это надёжнее.
const categories = ref<QuestionCategoryDto[]>([])
const isLoading = ref(false)

export function useQuestionPresets() {
  /** Загружает категории с пресетами вопросов с бэка. */
  const fetchQuestionPresets = async () => {
    isLoading.value = true
    try {
      const res = await api.getQuestionPresets()
      categories.value = res.data
    } catch {
      // Глобальный перехватчик axios уже показал toast с ошибкой
    } finally {
      isLoading.value = false
    }
  }

  /** Пресеты для конкретной категории по её коду (love/money/work/life/health) */
  const getPresetsByCode = (code: string) =>
    categories.value.find((c) => c.code === code)?.presets ?? []

  return {
    categories,
    isLoading,
    fetchQuestionPresets,
    getPresetsByCode,
  }
}

import { ref } from 'vue'
import { api, type QuestionCategoryDto } from '@/utils/api'

// ── Синглтон — общее состояние на всё приложение ──
// Кэшируем по факту наличия данных, а не по флагу "запрос уже делали":
// раньше кэш-флаг мог "залипнуть" на пустом ответе, если бэкенд в момент
// первого запроса ещё не отдавал данные (например, миграция не была
// применена) — после этого данные не обновлялись до полной перезагрузки
// MiniApp. Теперь повторный запрос пропускаем только если categories.value
// реально не пуст — пустой/неудачный ответ не "залипает" и будет запрошен
// заново при следующем заходе на экран.
const categories = ref<QuestionCategoryDto[]>([])
const isLoading = ref(false)

export function useQuestionPresets() {
  /** Загружает категории с пресетами вопросов с бэка (если ещё не загружены). */
  const fetchQuestionPresets = async () => {
    if (categories.value.length > 0) return
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

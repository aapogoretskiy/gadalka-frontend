import { ref } from 'vue'
import { api, type QuestionCategoryDto } from '@/utils/api'

// ── Синглтон — данные почти статичны, грузим один раз и кэшируем на всё приложение ──
const categories = ref<QuestionCategoryDto[]>([])
const isLoading = ref(false)
let fetched = false

export function useQuestionPresets() {
  /**
   * Загружает категории с пресетами вопросов с бэка.
   * Повторный вызов без force=true ничего не делает — данные уже закэшированы.
   */
  const fetchQuestionPresets = async (force = false) => {
    if (fetched && !force) return
    isLoading.value = true
    try {
      const res = await api.getQuestionPresets()
      categories.value = res.data
      fetched = true
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

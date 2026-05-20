import { ref } from 'vue'
import { api, type DailyCardResponse } from '@/utils/api'

// Модульный уровень — данные живут один раз на всё приложение.
// Повторный вызов useDailyCard() из любого экрана не делает второй HTTP-запрос.
const dailyCard  = ref<DailyCardResponse | null>(null)
const isLoading  = ref(false)
const error      = ref<string | null>(null)
let   fetched    = false   // флаг: был ли уже выполнен запрос

export function useDailyCard() {

  /**
   * Загружает карту дня с бэка. Безопасно вызывать несколько раз —
   * повторный запрос делается только при явном force=true.
   */
  const fetchDailyCard = async (force = false) => {
    if (fetched && !force) return
    isLoading.value = true
    error.value     = null
    try {
      const res      = await api.getDailyCard()
      dailyCard.value = res.data
      fetched         = true
    } catch {
      error.value = 'Не удалось загрузить карту дня'
    } finally {
      isLoading.value = false
    }
  }

  /**
   * Сбрасывает кэш карты дня.
   * Вызывается после смены активной темы — при следующем заходе на главный экран
   * карта перезагрузится с новым imageUrl (из активной темы).
   */
  const invalidate = () => {
    fetched = false
    dailyCard.value = null
  }

  return { dailyCard, isLoading, error, fetchDailyCard, invalidate }
}

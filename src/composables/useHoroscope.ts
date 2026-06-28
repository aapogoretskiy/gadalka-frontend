import { ref } from 'vue'
import { api, type DailyHoroscopeResponse } from '@/utils/api'

// Модульный уровень — данные живут один раз на всё приложение, как в useDailyCard.
// Гороскоп кэшируется на бэке по знаку зодиака (а не по пользователю), поэтому
// здесь достаточно простого fetched-флага без TTL — за день контент не меняется.
const horoscope       = ref<DailyHoroscopeResponse | null>(null)
const isLoading       = ref(false)
const error           = ref<string | null>(null)
const needsBirthDate  = ref(false)   // true, если бэк ответил 422 (в профиле не указана дата рождения)
let   fetched         = false

export function useHoroscope() {

  /**
   * Загружает гороскоп на день. Безопасно вызывать несколько раз —
   * повторный запрос делается только при явном force=true.
   *
   * 422 от бэка (нет даты рождения в профиле) — это ожидаемый случай,
   * а не ошибка: выставляем needsBirthDate, чтобы экран показал
   * предложение заполнить профиль, а не текст про сбой загрузки.
   */
  const fetchHoroscope = async (force = false) => {
    if (fetched && !force) return
    isLoading.value      = true
    error.value          = null
    needsBirthDate.value = false
    try {
      const res        = await api.getDailyHoroscope()
      horoscope.value   = res.data
      fetched           = true
    } catch (e: any) {
      if (e?.response?.status === 422) {
        needsBirthDate.value = true
      } else {
        error.value = 'Не удалось загрузить гороскоп'
      }
    } finally {
      isLoading.value = false
    }
  }

  return { horoscope, isLoading, error, needsBirthDate, fetchHoroscope }
}

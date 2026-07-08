import { ref } from 'vue'
import { api, type FeatureBadgesResponse, type FeatureBadge } from '@/utils/api'

// Синглтон — по аналогии с useFeatureCosts: отметки «Новинка»/«Хит» едины для
// всего приложения и настраиваются админом (вкладка «Цены»). Экраны с карточками
// функций и навигация читают их отсюда, а не хардкодят прямо в вёрстке — иначе
// для показа/снятия отметки требовался бы деплой фронтенда.

const EMPTY_BADGE: FeatureBadge = { isNew: false, isHot: false, newSince: null }

const DEFAULT_BADGES: FeatureBadgesResponse = {
  threeCard: EMPTY_BADGE,
  horseshoe: EMPTY_BADGE,
  celticCross: EMPTY_BADGE,
  compatibilityUnlock: EMPTY_BADGE,
  numerologyWeek: EMPTY_BADGE,
  numerologyMonth: EMPTY_BADGE,
  numerologyYear: EMPTY_BADGE,
  dream: EMPTY_BADGE,
}

const featureBadges = ref<FeatureBadgesResponse>({ ...DEFAULT_BADGES })
const loaded = ref(false)

export function useFeatureBadges() {
  const loadFeatureBadges = async () => {
    try {
      const res = await api.getFeatureBadges()
      featureBadges.value = res.data
      loaded.value = true
    } catch {
      // Молча игнорируем — до нового успешного запроса остаются старые/дефолтные
      // значения (все флаги выключены), это безопасный fallback: просто не покажем
      // лишний бейдж, а не сломаем экран.
    }
  }

  return { featureBadges, loaded, loadFeatureBadges }
}

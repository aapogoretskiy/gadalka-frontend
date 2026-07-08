import { ref } from 'vue'
import { useFeatureBadges } from './useFeatureBadges'
import type { FeatureBadgesResponse } from '@/utils/api'

// Жёлтые точки-уведомления на вкладках навигации («Числа», «Астро» и т.д.).
//
// Точка показывается, если хотя бы у одной фичи данной вкладки бэкенд прислал
// isNew = true (флаг ставит админ в «Цены»), и пользователь ещё не «подтвердил»
// именно эту фичу — то есть не открывал вкладку уже после того, как её пометили
// новинкой.
//
// Важный момент: «просмотрено» храним в localStorage не одним булевым флагом на
// вкладку, а по каждой фиче отдельно (ключ фичи -> дата подтверждения). Если бы
// хранили один флаг «точку на Числах уже видели», то после того как админ снимет
// «Новинка» с Месяца и через время повесит её на что-то другое в этом же разделе,
// точка бы больше никогда не появилась. А так — сравниваем дату подтверждения
// конкретной фичи с датой, когда бэкенд последний раз проставил ей «Новинка»
// (badge.newSince), и если подтверждение старше — точка показывается заново.
//
// localStorage (а не sessionStorage) выбран специально: sessionStorage обнулился
// бы почти при каждом открытии Telegram Mini App, и точка выскакивала бы заново
// каждый раз, а не один раз, как требуется.

const STORAGE_KEY = 'liora_seen_new_features'

// Какие фичи (ключи FeatureBadgesResponse) относятся к какой вкладке навигации
const TAB_FEATURES: Partial<Record<string, (keyof FeatureBadgesResponse)[]>> = {
  numerology: ['numerologyWeek', 'numerologyMonth', 'numerologyYear', 'compatibilityUnlock'],
  astro: ['dream'],
}

type SeenMap = Partial<Record<keyof FeatureBadgesResponse, string>> // фича -> ISO-дата подтверждения

// Бампается при каждом acknowledgeTab, чтобы computed-обёртки над hasUnseenNew
// пересчитывались сразу после клика (сам localStorage не реактивен).
const seenVersion = ref(0)

function readSeenMap(): SeenMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeSeenMap(map: SeenMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — не критично, просто
    // точка будет показываться каждый раз заново для этого пользователя.
  }
  seenVersion.value++
}

export function useNewFeatureDots() {
  const { featureBadges } = useFeatureBadges()

  const hasUnseenNew = (tab: string): boolean => {
    seenVersion.value // touch — реактивная зависимость от локального состояния "просмотрено"

    const keys = TAB_FEATURES[tab]
    if (!keys) return false

    const seen = readSeenMap()
    return keys.some((key) => {
      const badge = featureBadges.value[key]
      if (!badge?.isNew) return false

      const seenAt = seen[key]
      if (!seenAt) return true
      if (!badge.newSince) return false
      return new Date(seenAt).getTime() < new Date(badge.newSince).getTime()
    })
  }

  // Вызывается при клике по вкладке — запоминаем все её текущие «Новинки» как просмотренные
  const acknowledgeTab = (tab: string) => {
    const keys = TAB_FEATURES[tab]
    if (!keys) return

    const seen = readSeenMap()
    const now = new Date().toISOString()
    let changed = false
    keys.forEach((key) => {
      if (featureBadges.value[key]?.isNew) {
        seen[key] = now
        changed = true
      }
    })
    if (changed) writeSeenMap(seen)
  }

  return { hasUnseenNew, acknowledgeTab }
}

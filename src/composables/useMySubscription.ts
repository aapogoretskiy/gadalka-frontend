import { ref } from 'vue'
import { api, type FeatureType, type MySubscriptionResponse } from '@/utils/api'

// Синглтон — активная подписка едина для всего приложения.
// Используется для гейтов платных экранов (доступ по квоте при нулевом балансе)
// и блока «Моя подписка» в профиле.
const mySubscription = ref<MySubscriptionResponse | null>(null)
let loadedOnce = false

export function useMySubscription() {
  // Подтягивает активную подписку. 404 (подписки нет) — нормальный случай.
  const refreshSubscription = async () => {
    try {
      const res = await api.getMySubscription()
      mySubscription.value = res.data
    } catch {
      mySubscription.value = null
    }
  }

  // Ленивая первая загрузка — вызывать в onMounted платных экранов
  const ensureLoaded = async () => {
    if (loadedOnce) return
    loadedOnce = true
    await refreshSubscription()
  }

  /** Остаток квоты подписки по фиче (0 — нет подписки или квоты) */
  const quotaRemaining = (feature: FeatureType): number =>
    mySubscription.value?.quotas.find(q => q.featureType === feature)?.remaining ?? 0

  return { mySubscription, refreshSubscription, ensureLoaded, quotaRemaining }
}

import { ref } from 'vue'
import { api, type FeatureType, type MySubscriptionResponse } from '@/utils/api'
import { useToast } from '@/composables/useToast'

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

  /**
   * Обновление подписки ПОСЛЕ успешного списания квоты.
   * Если после обновления активной подписки больше нет — значит, только что
   * списанная квота была последней и бэк завершил подписку досрочно
   * (EXHAUSTED, см. SubscriptionQuotaService.completeIfFullyExhausted).
   * Сообщаем об этом пользователю тостом.
   */
  const refreshAfterQuotaSpend = async () => {
    await refreshSubscription()
    if (mySubscription.value === null) {
      const { addToast } = useToast()
      addToast('Подписка использована полностью — можно оформить новую ✨', 'info')
    }
  }

  return { mySubscription, refreshSubscription, refreshAfterQuotaSpend, ensureLoaded, quotaRemaining }
}

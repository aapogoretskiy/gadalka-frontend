import { ref } from 'vue'
import {
  api,
  type FeatureType,
  type SpendMode,
  type SpendOptionsResponse,
  type SubscriptionPlan,
} from '@/utils/api'

/**
 * Глобальная модалка выбора способа списания (знаки vs квота подписки).
 * Компонент SpendConfirmModal смонтирован в App.vue, экраны общаются с ним
 * через resolveSpendMode() — promise разрешается выбором пользователя.
 *
 * Сценарии (утверждены в v1):
 *  - только знаки доступны  → модалка НЕ показывается, сразу CREDITS (старое поведение)
 *  - есть квота             → модалка подтверждения «Списать 1 квоту?» (защита от случайного тапа)
 *  - есть квота И знаки     → модалка выбора «квота / знаки»
 *  - нет ни того ни другого → модалка «Не хватает знаков» + подписки с квотой на эту фичу
 *
 * v2: экраны с двумя кнопками оплаты (PaywallActions) знают выбор пользователя ДО
 * вызова и передают его вторым аргументом — тогда модалка выбора не показывается,
 * иначе пользователь выбирал бы способ оплаты дважды подряд.
 */

type ModalKind = 'choice' | 'quota-confirm' | 'insufficient' | null

const visible = ref(false)
const kind = ref<ModalKind>(null)
const feature = ref<FeatureType | null>(null)
const options = ref<SpendOptionsResponse | null>(null)
const plansWithQuota = ref<SubscriptionPlan[]>([])

let resolver: ((mode: SpendMode | null) => void) | null = null

export function useSpendConfirm() {
  /**
   * Определяет способ оплаты фичи, при необходимости показывая модалку.
   *
   * @param f         фича, за которую платим
   * @param preferred способ оплаты, который пользователь уже выбрал явно —
   *                  нажав одну из двух кнопок в PaywallActions. Если передан
   *                  и всё ещё выполним, модалку выбора не показываем.
   *                  Без него поведение полностью прежнее (FortuneScreen, DreamScreen).
   * @returns выбранный SpendMode или null (пользователь отменил / средств нет)
   */
  async function resolveSpendMode(f: FeatureType, preferred?: SpendMode): Promise<SpendMode | null> {
    let opts: SpendOptionsResponse
    try {
      opts = (await api.getSpendOptions(f)).data
    } catch {
      // Эндпоинт недоступен — не блокируем пользователя, старое поведение (знаки)
      return 'CREDITS'
    }

    const quotaUsable = opts.hasQuota && opts.quotaRemaining > 0

    // ── Явный выбор пользователя ────────────────────────────────────────────
    // Проверяем, что выбранный способ всё ещё доступен: между рендером кнопок и
    // тапом баланс/квота могли измениться (например, списание в другом окне).
    // Если способ стал невыполним — молча падаем в общую логику ниже, которая
    // покажет корректную модалку.
    if (preferred === 'CREDITS' && opts.canSpendCredits) return 'CREDITS'
    if (preferred === 'QUOTA' && quotaUsable) {
      // Безлимитную квоту подтверждать нечем — терять нечего
      if (opts.quotaUnlimited) return 'QUOTA'
      // Обычная квота: подтверждение оставляем — списание необратимо
      feature.value = f
      options.value = opts
      kind.value = 'quota-confirm'
      visible.value = true
      return new Promise<SpendMode | null>((resolve) => {
        resolver = resolve
      })
    }

    // Безлимитная квота (Superb) — списываем молча, без модалки: терять нечего.
    // Если скрытый дневной лимит исчерпан (quotaUsable = false) — обычная логика ниже.
    if (quotaUsable && opts.quotaUnlimited) return 'QUOTA'

    // Только знаки — без модалки (модалка подтверждения знаков отложена в v2)
    if (!quotaUsable && opts.canSpendCredits) return 'CREDITS'

    feature.value = f
    options.value = opts

    if (quotaUsable) {
      kind.value = opts.canSpendCredits ? 'choice' : 'quota-confirm'
    } else {
      // Не хватает ни знаков, ни квоты — обогащённая модалка с подписками
      kind.value = 'insufficient'
      plansWithQuota.value = []
      api.getSubscriptionPlans()
        .then(r => {
          plansWithQuota.value = r.data.filter(p => p.quotas.some(q => q.featureType === f))
        })
        .catch(() => { /* блок подписок просто не покажется */ })
    }

    visible.value = true
    return new Promise<SpendMode | null>((resolve) => {
      resolver = resolve
    })
  }

  /** Закрыть модалку с результатом (вызывается из SpendConfirmModal) */
  function choose(mode: SpendMode | null) {
    visible.value = false
    kind.value = null
    resolver?.(mode)
    resolver = null
  }

  return { visible, kind, feature, options, plansWithQuota, resolveSpendMode, choose }
}

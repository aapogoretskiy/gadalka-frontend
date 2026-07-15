<template>
  <Transition name="sheet">
    <div v-if="visible" class="sheet-overlay" @click.self="choose(null)">
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>

        <!-- ══ Выбор: квота или знаки ══ -->
        <template v-if="kind === 'choice'">
          <div class="sheet-emoji-lg">{{ emoji }}</div>
          <div class="sheet-title serif">Чем оплатить?</div>
          <div class="sheet-desc">{{ label }}</div>

          <div class="options-col">
            <button class="option-btn primary haptic" @click="choose('QUOTA')">
              <span class="option-title">Списать 1 квоту подписки</span>
              <span class="option-sub">осталось {{ options?.quotaRemaining }} из {{ options?.quotaTotal }}{{ periodSuffix }}</span>
            </button>
            <button class="option-btn secondary haptic" @click="choose('CREDITS')">
              <span class="option-title">Списать {{ options?.creditCost }} {{ znakiWord(options?.creditCost ?? 0) }}</span>
              <span class="option-sub">на балансе {{ options?.balance }} {{ znakiWord(options?.balance ?? 0) }}</span>
            </button>
            <button class="cancel-link haptic" @click="choose(null)">Отмена</button>
          </div>
        </template>

        <!-- ══ Подтверждение списания квоты (знаков не хватает) ══ -->
        <template v-else-if="kind === 'quota-confirm'">
          <div class="sheet-emoji-lg">{{ emoji }}</div>
          <div class="sheet-title serif">Списать 1 квоту?</div>
          <div class="sheet-desc">
            {{ label }} · останется {{ Math.max((options?.quotaRemaining ?? 1) - 1, 0) }} из {{ options?.quotaTotal }}{{ periodSuffix }}
          </div>

          <div class="options-col">
            <button class="option-btn primary haptic" @click="choose('QUOTA')">
              <span class="option-title">Да, списать квоту</span>
            </button>
            <button class="cancel-link haptic" @click="choose(null)">Отмена</button>
          </div>
        </template>

        <!-- ══ Не хватает ни знаков, ни квоты ══ -->
        <template v-else-if="kind === 'insufficient'">
          <div class="sheet-emoji-lg">🌙</div>
          <div class="sheet-title serif">Не хватает знаков</div>
          <div class="sheet-desc">
            {{ label }} стоит {{ options?.creditCost }} {{ znakiWord(options?.creditCost ?? 0) }},
            на балансе — {{ options?.balance }}
          </div>

          <div class="options-col">
            <button class="option-btn primary haptic" @click="goToPayment('credits')">
              <span class="option-title">Купить знаки</span>
            </button>

            <!-- Подписки с квотой на эту фичу (только когда фича открыта пользователю) -->
            <template v-if="subscriptionsAvailable && plansWithQuota.length > 0">
              <div class="plans-hint">Или эта функция есть в подписках:</div>
              <button
                v-for="plan in plansWithQuota"
                :key="plan.id"
                class="option-btn secondary haptic"
                @click="goToPayment('subscriptions')"
              >
                <span class="option-title">{{ plan.name }} — {{ plan.priceRub }} ₽</span>
                <span class="option-sub">{{ planQuotaSummary(plan) }}</span>
              </button>
            </template>

            <button class="cancel-link haptic" @click="choose(null)">Позже</button>
          </div>
        </template>

      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { SubscriptionPlan } from '@/utils/api'
import { useSpendConfirm } from '@/composables/useSpendConfirm'
import { useBalance } from '@/composables/useBalance'
import { featureLabel, featureEmoji, quotaPeriodLabel } from '@/utils/featureLabels'

const navigate = inject<(r: string) => void>('navigate')

const { visible, kind, feature, options, plansWithQuota, choose } = useSpendConfirm()
const { subscriptionsAvailable } = useBalance()

const label = computed(() => (feature.value ? featureLabel(feature.value) : ''))
const emoji = computed(() => (feature.value ? featureEmoji(feature.value) : '✨'))
// « в день» для DAILY-квот, пусто для PER_PERIOD (там «из N» самодостаточно)
const periodSuffix = computed(() =>
  options.value?.quotaPeriod === 'DAILY' ? ' в день' : ''
)

function goToPayment(_tab: 'credits' | 'subscriptions') {
  choose(null)
  navigate?.('payment')
}

// Квота именно на текущую фичу — первой строкой в подписи плана
function planQuotaSummary(plan: SubscriptionPlan): string {
  const q = plan.quotas.find(q => q.featureType === feature.value)
  if (!q) return `${plan.durationDays} дней`
  return `${q.quotaCount} ${quotaPeriodLabel(q.quotaPeriod)} · ${plan.durationDays} дней`
}

function znakiWord(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return 'знак'
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return 'знака'
  return 'знаков'
}
</script>

<style scoped>
.sheet-overlay {
  position: fixed; inset: 0; z-index: 110;
  background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.bottom-sheet {
  width: 100%; max-height: 85vh;
  background: #15062a;
  border-radius: 24px 24px 0 0;
  padding: 12px 24px calc(24px + var(--tg-safe-area-inset-bottom, 0px));
  display: flex; flex-direction: column; align-items: center;
  overflow-y: auto;
  box-shadow: 0 -10px 40px rgba(0,0,0,.4);
}
.sheet-handle {
  width: 40px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.2);
  margin-bottom: 18px;
}
.sheet-emoji-lg { font-size: 36px; margin-bottom: 10px; }
.sheet-title { font-size: 20px; text-align: center; margin-bottom: 6px; }
.sheet-desc {
  font-size: 13px; line-height: 1.55; color: rgba(255,255,255,.6);
  text-align: center; margin-bottom: 18px;
}

.options-col { width: 100%; display: flex; flex-direction: column; gap: 10px; }

.option-btn {
  width: 100%; padding: 14px 16px; border-radius: 16px;
  border: none; cursor: pointer;
  font-family: 'Manrope', sans-serif;
  display: flex; flex-direction: column; align-items: center; gap: 3px;
}
.option-btn.primary {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  box-shadow: 0 8px 24px rgba(182,84,255,.4);
}
.option-btn.secondary {
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.12);
  color: #fff;
}
.option-title { font-size: 15px; font-weight: 600; }
.option-sub { font-size: 12px; opacity: .65; }

.plans-hint {
  font-size: 12px; color: rgba(255,255,255,.5);
  text-align: center; margin-top: 6px;
}

.cancel-link {
  background: none; border: none; padding: 10px;
  font-family: 'Manrope', sans-serif; font-size: 14px;
  color: rgba(255,255,255,.5); cursor: pointer;
}

.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
.sheet-enter-active,
.sheet-leave-active { transition: opacity 0.3s ease; }
.sheet-enter-active .bottom-sheet,
.sheet-leave-active .bottom-sheet { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.sheet-enter-from .bottom-sheet { transform: translateY(100%); }
.sheet-leave-to   .bottom-sheet { transform: translateY(100%); }
</style>

<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Разбор на год</div>
        <div style="width:36px"></div>
      </div>

      <!-- ══ Загрузка ════════════════════════════════════════════════ -->
      <template v-if="yearLoading">
        <div class="loader-wrap">
          <div class="ai-orb">
            <div class="orb-core"></div>
            <div class="orb-ring r1"></div>
            <div class="orb-ring r2"></div>
          </div>
          <h2 class="serif loader-title">{{ loadingMessages[msgIdx] }}</h2>
          <p class="loader-sub">Раскладываем год на 12 месяцев...</p>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" :style="`width:${progress}%`"></div>
          </div>
        </div>
      </template>

      <!-- ══ Результат ═══════════════════════════════════════════════ -->
      <template v-else-if="yearResult">

        <!-- Баннер «оплата прошла» — только сразу после покупки в этой сессии -->
        <div v-if="justPurchased" class="success-banner glass">
          <span class="success-icon">✅</span>
          <span>Оплата прошла. Разбор на год открыт — доступен в истории.</span>
        </div>

        <!-- Код года -->
        <div class="num-hero gradient-card">
          <div class="num-label">Код года</div>
          <div class="num-mega">{{ yearResult.yearNumber }}</div>
          <div class="num-short serif">«{{ yearResult.yearTitle }}»</div>
        </div>

        <!-- 4 ключевых периода -->
        <div class="section-header">
          <div class="section-title serif">Ключевые периоды года</div>
        </div>
        <div class="period-preview-grid">
          <div
            v-for="kp in yearResult.keyPeriods" :key="kp.badge"
            class="period-preview-card glass haptic"
            @click="openMonth(kp.calendarMonth)"
          >
            <div class="pp-badge" :class="periodBadgeClass(kp.badge)">{{ kp.badge }}</div>
            <div class="pp-month">{{ kp.monthName }}</div>
            <div class="pp-number serif">{{ kp.monthNumber }}</div>
            <div class="pp-title">{{ kp.monthNumberTitle }}</div>
            <div class="pp-desc">{{ kp.description }}</div>
          </div>
        </div>

        <!-- 12 месяцев -->
        <div class="section-header">
          <div class="section-title serif">Все 12 месяцев</div>
        </div>
        <div class="month-preview-grid">
          <div
            v-for="mp in yearResult.monthPreviews" :key="mp.calendarMonth"
            class="month-preview-card glass haptic"
            @click="openMonth(mp.calendarMonth)"
          >
            <div class="mp-name">{{ mp.monthName }}</div>
            <div class="mp-number serif">{{ mp.monthNumber }}</div>
            <div class="mp-resonance" :class="resonanceClass(mp.resonanceLabel)">{{ mp.resonanceLabel }}</div>
          </div>
        </div>

        <!-- Главная тема -->
        <div class="detail-card glass">
          <h4 class="serif detail-title">☀️ Главная тема года</h4>
          <p class="detail-body">{{ yearResult.mainTheme }}</p>
        </div>

        <!-- Сферы жизни -->
        <div class="section-header">
          <div class="section-title serif">Сферы жизни в этом году</div>
        </div>
        <div class="life-areas glass">
          <div v-for="a in lifeAreaRows" :key="a.key" class="life-area-row">
            <div class="la-icon">{{ a.icon }}</div>
            <div class="la-body">
              <div class="la-label">{{ a.label }}</div>
              <div class="la-bar-wrap"><div class="la-bar" :style="{ width: (a.data.score / 5 * 100) + '%' }"></div></div>
            </div>
            <div class="la-score">{{ a.data.score }}/5</div>
          </div>
        </div>

        <div v-for="a in lifeAreaRows" :key="'detail-' + a.key" class="detail-card glass">
          <h4 class="serif detail-title">{{ a.icon }} {{ a.label }}</h4>
          <p class="detail-body">{{ a.data.text }}</p>
        </div>

        <!-- Чего избегать -->
        <div class="detail-card glass detail-card--warn">
          <h4 class="serif detail-title">⚠️ Чего избегать</h4>
          <p class="detail-body">{{ yearResult.whatToAvoid }}</p>
        </div>

        <!-- Совет года -->
        <div class="affirmation-card gradient-card">
          <div class="aff-label">🔮 Совет года</div>
          <div class="aff-text serif">{{ yearResult.advice }}</div>
        </div>

        <!-- Фидбэк на разбор -->
        <ActionFeedbackWidget
          v-if="yearResult.id"
          action-type="NUMEROLOGY_YEAR"
          :action-id="yearResult.id"
        />
      </template>

      <!-- ══ Тихая проверка при открытии экрана ═════════════════════════ -->
      <div v-else-if="checkingExisting" class="loader-wrap loader-wrap--silent">
        <div class="loading-spinner-sm"></div>
      </div>

      <!-- ══ Пейволл ═════════════════════════════════════════════════ -->
      <div v-else class="week-paywall glass">
        <div class="paywall-lock">⭐</div>
        <div class="paywall-title serif">Разбор на год</div>
        <div class="paywall-sub">Код года, сферы жизни, ключевые периоды и все 12 месяцев с резонансом</div>

        <div v-if="yearErrorMsg" class="week-error">{{ yearErrorMsg }}</div>

        <button v-if="canAffordYear" class="action-btn haptic" @click="showPurchaseModal = true">
          ⭐ Открыть за {{ YEAR_COST }} знаков
        </button>
        <button v-else class="action-btn action-btn--buy haptic" @click="navigate?.('payment')">
          Купить знаки →
        </button>
      </div>

    </div>

    <PeriodPurchaseModal
      :open="showPurchaseModal"
      title="Разбор на год"
      icon="⭐"
      description="Годовой персональный разбор с ключевыми периодами и разбивкой по месяцам"
      :features="[
        'Код года и главная тема',
        '4 ключевых периода — Старт, Пауза, Пик, Итоги',
        'Резонанс всех 12 месяцев года',
        'Каждый месяц открывается бесплатно по клику',
        'Сохранится в истории навсегда',
      ]"
      :cost="YEAR_COST"
      :loading="yearLoading"
      @confirm="confirmPurchase"
      @close="showPurchaseModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { api, type NumerologyYearResponse } from '@/utils/api'
import { useBalance } from '@/composables/useBalance'
import { useFeatureCosts } from '@/composables/useFeatureCosts'
import { useSpendConfirm } from '@/composables/useSpendConfirm'
import { useMySubscription } from '@/composables/useMySubscription'
import { hapticFeedback } from '@/utils/telegram'
import ActionFeedbackWidget from '@/components/ui/ActionFeedbackWidget.vue'
import PeriodPurchaseModal from '@/components/ui/PeriodPurchaseModal.vue'

const navigate = inject<(r: string, params?: Record<string, any>) => void>('navigate')

// Стоимость берётся с бэка (настраивается в админке). Бэк: FeatureCostService.getNumerologyYearCost
const { featureCosts, loadFeatureCosts } = useFeatureCosts()
const YEAR_COST = computed(() => featureCosts.value.numerologyYear)

const { balance, refreshBalance } = useBalance()
const { resolveSpendMode } = useSpendConfirm()
const { ensureLoaded: ensureSubscriptionLoaded, refreshSubscription, quotaRemaining } = useMySubscription()
// Покупка доступна: хватает знаков ИЛИ есть квота подписки на годовой разбор
const canAffordYear = computed(() =>
  (balance.value ?? 0) >= YEAR_COST.value || quotaRemaining('NUMEROLOGY_YEAR') > 0
)

const yearResult   = ref<NumerologyYearResponse | null>(null)
const yearLoading  = ref(false)
const yearErrorMsg = ref('')
const showPurchaseModal = ref(false)
// true только если разбор был куплен в текущей сессии (не при обычном повторном открытии)
const justPurchased = ref(false)

// ── Тихая проверка при открытии экрана (см. аналогичную логику в MonthSpreadScreen) ──
const checkingExisting = ref(true)

onMounted(async () => {
  loadFeatureCosts()
  ensureSubscriptionLoaded()
  try {
    const res = await api.getNumerologyYearCurrent()
    yearResult.value = res.data
  } catch {
    // 404 — разбора на этот год ещё нет, остаёмся на пейволле
  } finally {
    checkingExisting.value = false
  }
})

// ── Лоадер годового расчёта — самый долгий из всех уровней матрёшки (~12с) ─────
const MIN_LOADER_MS = 12000

const loadingMessages = [
  'Считаем персональный код года...',
  'Раскладываем год на 12 месяцев...',
  'Ищем резонанс каждого месяца...',
  'Определяем ключевые периоды — Старт, Пауза, Пик, Итоги...',
  'Сопоставляем со сферами жизни...',
  'Вычисляем самые сильные месяцы...',
  'Анализируем отношения и карьеру...',
  'Считаем финансовые окна года...',
  'Проверяем совместимость с числом жизни...',
  'Собираем ключевые периоды...',
  'Формируем разбор года...',
]
const msgIdx   = ref(0)
const progress = ref(0)

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function confirmPurchase() {
  showPurchaseModal.value = false
  // Выбор способа оплаты: знаки или квота подписки (модалка при необходимости)
  const spendMode = await resolveSpendMode('NUMEROLOGY_YEAR')
  if (!spendMode) return
  getYearlyAnalysis(spendMode)
}

async function getYearlyAnalysis(spendMode: 'CREDITS' | 'QUOTA' = 'CREDITS') {
  if (yearLoading.value) return
  yearLoading.value = true
  yearErrorMsg.value = ''
  msgIdx.value = 0
  progress.value = 0

  const msgInterval = setInterval(() => {
    msgIdx.value = (msgIdx.value + 1) % loadingMessages.length
    progress.value = Math.min(progress.value + 8, 96)
  }, 700)

  try {
    const [res] = await Promise.all([
      api.getNumerologyYear(spendMode),
      delay(MIN_LOADER_MS),
    ])
    progress.value = 100
    yearResult.value = res.data
    justPurchased.value = true
    await refreshBalance()
    if (spendMode === 'QUOTA') await refreshSubscription()
    hapticFeedback.success()
  } catch (err: any) {
    if (err.response?.status === 402) {
      yearErrorMsg.value = 'Недостаточно знаков для этого разбора.'
      await refreshBalance()
    } else if (err.response?.status === 422) {
      yearErrorMsg.value = 'Укажите дату рождения в профиле, чтобы рассчитать разбор.'
    } else {
      yearErrorMsg.value = 'Не удалось получить разбор. Попробуйте ещё раз.'
    }
  } finally {
    clearInterval(msgInterval)
    yearLoading.value = false
  }
}

// Переход на конкретный месяц года — открывается бесплатно по клику (см. NumerologyYearService.openIncludedMonth)
function openMonth(calendarMonth: number) {
  if (!yearResult.value) return
  const year = parseInt(yearResult.value.yearStart.split('-')[0], 10)
  const mm = String(calendarMonth).padStart(2, '0')
  navigate?.('numerology-month', { monthStart: `${year}-${mm}-01` })
}

// ── Сферы жизни: собираем в массив для v-for, с иконками и подписями ────────
const lifeAreaRows = computed(() => {
  if (!yearResult.value) return []
  const areas = yearResult.value.lifeAreas
  return [
    { key: 'relationships', icon: '💗', label: 'Отношения', data: areas.relationships },
    { key: 'career',        icon: '🚀', label: 'Карьера',   data: areas.career },
    { key: 'finance',       icon: '💰', label: 'Финансы',   data: areas.finance },
    { key: 'health',        icon: '🌿', label: 'Здоровье',  data: areas.health },
  ]
})

function resonanceClass(label: string): string {
  if (label === 'Благоприятный') return 'res-good'
  if (label === 'Нейтральный') return 'res-neutral'
  return 'res-warn'
}

function periodBadgeClass(badge: string): string {
  if (badge === 'Старт') return 'badge-start'
  if (badge === 'Пауза') return 'badge-pause'
  if (badge === 'Пик') return 'badge-peak'
  return 'badge-finale'
}
</script>

<style scoped>
.screen-wrap { min-height: var(--tg-viewport-stable-height, 100vh); padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px)); overflow-y: auto; }
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
.header-title { font-size:18px; text-align:center; }

/* Loader */
.loader-wrap {
  min-height: 70vh; display: flex; flex-direction: column;
  align-items: center; justify-content: center; text-align: center; padding: 40px 0;
}
.ai-orb { position: relative; width: 100px; height: 100px; }
.orb-core {
  position: absolute; inset: 20px; border-radius: 50%;
  background: radial-gradient(circle, #b654ff, #e94aa8);
  box-shadow: 0 0 40px rgba(182,84,255,0.6);
}
.orb-ring {
  position: absolute; border-radius: 50%;
  border: 1px solid rgba(182,84,255,0.35);
  animation: orb-ring-pulse 2.5s ease-out infinite;
}
.orb-ring.r1 { inset: 10px; animation-delay: 0s; }
.orb-ring.r2 { inset: 0; animation-delay: 0.8s; }
@keyframes orb-ring-pulse {
  0%   { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0;   transform: scale(1.6); }
}
.loader-title { font-size: 22px; margin: 24px 0 8px; }
.loader-sub   { color: rgba(255,255,255,.55); font-size: 13px; margin-bottom: 28px; }
.progress-bar-wrap {
  width: 200px; height: 4px; border-radius: 4px;
  background: rgba(255,255,255,.1); overflow: hidden;
}
.progress-bar-fill {
  height: 100%; border-radius: 4px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  transition: width .4s ease;
}

/* Тихая проверка */
.loader-wrap--silent { min-height: 40vh; padding: 20px 0; }
.loading-spinner-sm {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #ffc857;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Success banner */
.success-banner {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 16px; margin-bottom: 14px;
  border: 1px solid rgba(74,222,128,.35);
  background: rgba(74,222,128,.1);
  font-size: 13px; color: #4ade80;
}
.success-icon { flex-shrink: 0; }

/* Number hero */
.num-hero { padding: 28px 22px; text-align: center; margin-bottom: 14px; }
.num-mega {
  font-family: 'Cormorant Garamond', serif;
  font-size: 80px; font-weight: 500; line-height: 1;
  background: linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  letter-spacing: -.05em; position: relative;
}
.num-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: .12em;
  color: rgba(255,255,255,.6); font-weight: 600; margin-bottom: 4px; position: relative;
}
.num-short { font-size: 20px; margin-top: 10px; position: relative; font-style: italic; }

/* Section */
.section-header { margin-bottom: 12px; padding-top: 8px; }
.section-title  { font-size: 18px; }

/* 4 ключевых периода */
.period-preview-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  margin-bottom: 12px;
}
.period-preview-card {
  padding: 14px; text-align: center; cursor: pointer; transition: transform .15s;
}
.pp-badge {
  display: inline-block; font-size: 9px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .04em; padding: 3px 8px; border-radius: 6px; margin-bottom: 8px;
}
.badge-start  { background: rgba(112,224,168,.18); color: #70e0a8; }
.badge-pause  { background: rgba(255,200,87,.18);  color: #ffc857; }
.badge-peak   { background: rgba(182,84,255,.18);  color: #c084fc; }
.badge-finale { background: rgba(233,74,108,.18);  color: #e94a6c; }
.pp-month  { font-size: 11px; color: rgba(255,255,255,.5); margin-bottom: 4px; }
.pp-number { font-size: 28px; font-weight: 600; color: #ffc857; }
.pp-title  { font-size: 11px; color: rgba(255,255,255,.7); margin-top: 2px; }
.pp-desc   { font-size: 10.5px; line-height: 1.4; color: rgba(255,255,255,.5); margin-top: 8px; text-align: left; }

/* 12 месяцев */
.month-preview-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
  margin-bottom: 18px;
}
.month-preview-card {
  padding: 10px 6px; text-align: center; cursor: pointer; transition: transform .15s;
}
.mp-name { font-size: 10px; color: rgba(255,255,255,.55); margin-bottom: 4px; text-transform: uppercase; letter-spacing: .03em; }
.mp-number { font-size: 20px; font-weight: 600; color: #ffc857; }
.mp-resonance {
  display: inline-block; margin-top: 4px; font-size: 7.5px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .02em; padding: 2px 6px; border-radius: 6px;
}
.res-good    { background: rgba(112,224,168,.18); color: #70e0a8; }
.res-neutral { background: rgba(255,200,87,.18);  color: #ffc857; }
.res-warn    { background: rgba(233,74,108,.18);  color: #e94a6c; }

/* Detail cards */
.detail-card { padding: 18px 20px; margin-bottom: 10px; }
.detail-title { font-size: 17px; margin-bottom: 7px; color: #ffc857; }
.detail-body  { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.75); }
.detail-card--warn .detail-title { color: #e94aa8; }
.detail-card--warn { border-color: rgba(233,74,168,0.25); }

/* Сферы жизни */
.life-areas { padding: 16px 18px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 14px; }
.life-area-row { display: flex; align-items: center; gap: 12px; }
.la-icon { font-size: 18px; flex-shrink: 0; width: 22px; text-align: center; }
.la-body { flex: 1; }
.la-label { font-size: 12px; color: rgba(255,255,255,.7); margin-bottom: 5px; }
.la-bar-wrap { height: 5px; background: rgba(255,255,255,.08); border-radius: 3px; overflow: hidden; }
.la-bar { height: 100%; border-radius: 3px; background: linear-gradient(90deg, #b654ff, #e94aa8); }
.la-score { font-size: 12px; font-weight: 700; color: #ffc857; flex-shrink: 0; width: 28px; text-align: right; }

/* Affirmation / advice */
.affirmation-card { padding: 20px; margin-bottom: 20px; }
.aff-label { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#ffc857; font-weight:600; margin-bottom:8px; }
.aff-text  { font-size:16px; line-height:1.5; color:rgba(255,255,255,.9); }

/* Button */
.action-btn {
  width:100%; padding:15px; border-radius:16px;
  background:linear-gradient(135deg,#b654ff,#e94aa8);
  color:#fff; font-size:15px; font-weight:600;
  font-family:'Manrope',sans-serif; border:none; cursor:pointer;
  box-shadow:0 8px 24px rgba(182,84,255,.4);
  display:flex; align-items:center; justify-content:center; gap:10px;
}
.action-btn--buy {
  background: linear-gradient(135deg, rgba(255,200,87,0.2), rgba(233,74,168,0.15));
  border: 1px solid rgba(255,200,87,0.4);
  color: #ffc857;
  box-shadow: none;
}

/* Пейволл */
.week-paywall {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 24px; text-align: center; gap: 6px;
}
.paywall-lock  { font-size: 32px; margin-bottom: 4px; }
.paywall-title { font-size: 20px; margin-bottom: 2px; }
.paywall-sub   { font-size: 13px; color: rgba(255,255,255,.55); line-height: 1.5; margin-bottom: 16px; }
.week-error    { font-size: 12px; color: #ff8a8a; margin-bottom: 10px; }
</style>

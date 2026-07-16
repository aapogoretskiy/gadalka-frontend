<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Разбор на месяц</div>
        <div style="width:36px"></div>
      </div>

      <!-- ══ Загрузка ════════════════════════════════════════════════ -->
      <template v-if="monthLoading">
        <div class="loader-wrap">
          <LioraLoader :phrases="loadingMessages" subtitle="Раскладываем месяц на недели и дни..." :progress="progress" />
        </div>
      </template>

      <!-- ══ Результат ═══════════════════════════════════════════════ -->
      <template v-else-if="monthResult">

        <!-- Баннер «оплата прошла» — только сразу после покупки в этой сессии -->
        <div v-if="justPurchased" class="success-banner glass">
          <span class="success-icon">✅</span>
          <span>Оплата прошла. Прогноз открыт — доступен в истории.</span>
        </div>

        <!-- Код месяца -->
        <div class="num-hero gradient-card">
          <div class="num-label">Код месяца</div>
          <div class="num-mega">{{ monthResult.monthNumber }}</div>
          <div class="num-short serif">«{{ monthResult.monthNumberTitle }}»</div>
        </div>

        <!-- 4 недели месяца -->
        <div class="section-header">
          <div class="section-title serif">Выберите неделю для детального разбора</div>
        </div>
        <div class="week-preview-grid">
          <div
            v-for="wp in monthResult.weekPreviews" :key="wp.weekIndex"
            class="week-preview-card glass haptic"
            @click="openWeek(wp)"
          >
            <div class="wp-label">НЕДЕЛЯ {{ wp.weekIndex }}</div>
            <div class="wp-dates">{{ shortDate(wp.startDate) }}–{{ shortDate(wp.endDate) }}</div>
            <div class="wp-number serif">{{ wp.weekNumber }}</div>
            <div class="wp-title">{{ wp.weekNumberTitle }}</div>
            <div class="wp-resonance" :class="resonanceClass(wp.resonanceLabel)">{{ wp.resonanceLabel }}</div>
          </div>
        </div>

        <!-- Главная тема -->
        <div class="detail-card glass">
          <h4 class="serif detail-title">☀️ Главная тема месяца</h4>
          <p class="detail-body">{{ monthResult.mainTheme }}</p>
        </div>

        <!-- Сферы жизни -->
        <div class="section-header">
          <div class="section-title serif">Сферы жизни в этом месяце</div>
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

        <!-- Ключевые даты -->
        <div class="section-header">
          <div class="section-title serif">Ключевые даты {{ keyDatesMonthGenitive }}</div>
        </div>
        <div class="key-dates glass">
          <div v-for="kd in monthResult.keyDates" :key="kd.date" class="key-date-row">
            <div class="kd-date">
              <div class="kd-day">{{ dayOfMonth(kd.date) }}</div>
              <div class="kd-mon">{{ shortMonth(kd.date) }}</div>
            </div>
            <div class="kd-badge" :class="badgeClass(kd.badge)">{{ kd.badge }}</div>
            <div class="kd-desc">{{ kd.description }}</div>
          </div>
        </div>

        <!-- Чего избегать -->
        <div class="detail-card glass detail-card--warn">
          <h4 class="serif detail-title">⚠️ Чего избегать</h4>
          <p class="detail-body">{{ monthResult.whatToAvoid }}</p>
        </div>

        <!-- Совет месяца -->
        <div class="affirmation-card gradient-card">
          <div class="aff-label">🔮 Совет месяца</div>
          <div class="aff-text serif">{{ monthResult.advice }}</div>
        </div>

        <!-- Фидбэк на разбор -->
        <ActionFeedbackWidget
          v-if="monthResult.id"
          action-type="NUMEROLOGY_MONTH"
          :action-id="monthResult.id"
        />
      </template>

      <!-- ══ Тихая проверка при открытии экрана ═════════════════════════ -->
      <div v-else-if="checkingExisting" class="loader-wrap loader-wrap--silent">
        <div class="loading-spinner-sm"></div>
      </div>

      <!-- ══ Месяц из года не нашёлся (крайний случай) — без пейволла и кнопки покупки ══ -->
      <div v-else-if="fixedMonthStart" class="week-paywall glass">
        <div class="paywall-lock">⚠️</div>
        <div class="paywall-title serif">Не удалось открыть месяц</div>
        <div class="paywall-sub">{{ monthErrorMsg }}</div>
        <button class="action-btn haptic" @click="navigate?.('numerology-year')">К разбору на год</button>
      </div>

      <!-- ══ Пейволл ═════════════════════════════════════════════════ -->
      <div v-else class="week-paywall glass">
        <div class="paywall-lock">🌙</div>
        <div class="paywall-title serif">Разбор на месяц</div>
        <div class="paywall-sub">Код месяца, сферы жизни, ключевые даты и детальный разбор всех 4 недель</div>

        <div v-if="monthErrorMsg" class="week-error">{{ monthErrorMsg }}</div>

        <button v-if="canAffordMonth" class="action-btn haptic" @click="showPurchaseModal = true">
          🌙 Открыть за {{ MONTH_COST }} знаков
        </button>
        <button v-else class="action-btn action-btn--buy haptic" @click="navigate?.('payment')">
          Купить знаки →
        </button>
      </div>

    </div>

    <PeriodPurchaseModal
      :open="showPurchaseModal"
      title="Разбор на месяц"
      icon="🌙"
      description="30-дневный персональный разбор с ключевыми датами и разбивкой по неделям"
      :features="[
        '30-дневный персональный календарь',
        'Ключевые даты и циклы месяца',
        'Сферы жизни: отношения, карьера, финансы, здоровье',
        '4 недели включены бесплатно — открываются отдельно',
        'Сохранится в истории навсегда',
      ]"
      :cost="MONTH_COST"
      :loading="monthLoading"
      @confirm="confirmPurchase"
      @close="showPurchaseModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { api, type NumerologyMonthResponse, type NumerologyMonthWeekPreviewDto } from '@/utils/api'
import { useBalance } from '@/composables/useBalance'
import { useFeatureCosts } from '@/composables/useFeatureCosts'
import { useSpendConfirm } from '@/composables/useSpendConfirm'
import { useMySubscription } from '@/composables/useMySubscription'
import { hapticFeedback } from '@/utils/telegram'
import ActionFeedbackWidget from '@/components/ui/ActionFeedbackWidget.vue'
import LioraLoader from '@/components/ui/LioraLoader.vue'
import PeriodPurchaseModal from '@/components/ui/PeriodPurchaseModal.vue'

const navigate = inject<(r: string, params?: Record<string, any>) => void>('navigate')
// Если экран открыт из годового разбора — сюда приходит { monthStart: 'YYYY-MM-01' } конкретного
// месяца. Такой месяц уже создан бесплатно по клику (см. NumerologyYearService.openIncludedMonth),
// поэтому здесь мы просто запрашиваем его напрямую по дате — без пейволла и без лоадера «сложного расчёта».
const routeParams = inject<{ value: Record<string, any> | null }>('routeParams')
const fixedMonthStart = routeParams?.value?.monthStart as string | undefined

// Стоимость берётся с бэка (настраивается в админке). Бэк: FeatureCostService.getNumerologyMonthCost
const { featureCosts, loadFeatureCosts } = useFeatureCosts()
const MONTH_COST = computed(() => featureCosts.value.numerologyMonth)

const { balance, refreshBalance } = useBalance()
const { resolveSpendMode } = useSpendConfirm()
const { ensureLoaded: ensureSubscriptionLoaded, refreshAfterQuotaSpend, quotaRemaining } = useMySubscription()
// Покупка доступна: хватает знаков ИЛИ есть квота подписки на месячный разбор
const canAffordMonth = computed(() =>
  (balance.value ?? 0) >= MONTH_COST.value || quotaRemaining('NUMEROLOGY_MONTH') > 0
)

const monthResult   = ref<NumerologyMonthResponse | null>(null)
const monthLoading  = ref(false)
const monthErrorMsg = ref('')
const showPurchaseModal = ref(false)
// true только если разбор был куплен в текущей сессии (не при обычном повторном открытии)
const justPurchased = ref(false)

// ── Тихая проверка при открытии экрана (см. аналогичную логику в WeekSpreadScreen) ──
const checkingExisting = ref(true)

onMounted(async () => {
  loadFeatureCosts()
  ensureSubscriptionLoaded()

  if (fixedMonthStart) {
    // Переход из годового разбора на конкретный месяц — он уже существует и бесплатен
    try {
      const res = await api.getNumerologyMonthByDate(fixedMonthStart)
      monthResult.value = res.data
    } catch {
      monthErrorMsg.value = 'Не удалось загрузить этот месяц. Попробуйте открыть его из разбора на год ещё раз.'
    } finally {
      checkingExisting.value = false
    }
    return
  }

  try {
    const res = await api.getNumerologyMonthCurrent()
    monthResult.value = res.data
  } catch {
    // 404 — разбора на этот месяц ещё нет, остаёмся на пейволле
  } finally {
    checkingExisting.value = false
  }
})

// ── Лоадер месячного расчёта — заметно дольше недельного (~7с, 10 фраз),
// чтобы ощущался как более «глубокий» расчёт ──────────────────────────────────
const MIN_LOADER_MS = 7000

const loadingMessages = [
  'Считаем персональный код месяца...',
  'Раскладываем месяц на 4 недели...',
  'Ищем резонанс каждого дня...',
  'Сопоставляем со сферами жизни...',
  'Вычисляем пиковые даты...',
  'Анализируем отношения и карьеру...',
  'Считаем финансовые окна месяца...',
  'Проверяем совместимость с числом жизни...',
  'Собираем ключевые даты...',
  'Формируем разбор месяца...',
]
const progress = ref(0)

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function confirmPurchase() {
  showPurchaseModal.value = false
  // Выбор способа оплаты: знаки или квота подписки (модалка при необходимости)
  const spendMode = await resolveSpendMode('NUMEROLOGY_MONTH')
  if (!spendMode) return
  getMonthlyAnalysis(spendMode)
}

async function getMonthlyAnalysis(spendMode: 'CREDITS' | 'QUOTA' = 'CREDITS') {
  if (monthLoading.value) return
  monthLoading.value = true
  monthErrorMsg.value = ''
  progress.value = 0

  const msgInterval = setInterval(() => {
    progress.value = Math.min(progress.value + 10, 96)
  }, 700)

  try {
    const [res] = await Promise.all([
      api.getNumerologyMonth(spendMode),
      delay(MIN_LOADER_MS),
    ])
    progress.value = 100
    monthResult.value = res.data
    justPurchased.value = true
    await refreshBalance()
    if (spendMode === 'QUOTA') await refreshAfterQuotaSpend()
    hapticFeedback.success()
  } catch (err: any) {
    if (err.response?.status === 402) {
      monthErrorMsg.value = 'Недостаточно знаков для этого разбора.'
      await refreshBalance()
    } else if (err.response?.status === 422) {
      monthErrorMsg.value = 'Укажите дату рождения в профиле, чтобы рассчитать разбор.'
    } else {
      monthErrorMsg.value = 'Не удалось получить разбор. Попробуйте ещё раз.'
    }
  } finally {
    clearInterval(msgInterval)
    monthLoading.value = false
  }
}

function openWeek(wp: NumerologyMonthWeekPreviewDto) {
  navigate?.('numerology-week', { weekStart: wp.startDate })
}

// ── Сферы жизни: собираем в массив для v-for, с иконками и подписями ────────
const lifeAreaRows = computed(() => {
  if (!monthResult.value) return []
  const areas = monthResult.value.lifeAreas
  return [
    { key: 'relationships', icon: '💗', label: 'Отношения', data: areas.relationships },
    { key: 'career',        icon: '🚀', label: 'Карьера',   data: areas.career },
    { key: 'finance',       icon: '💰', label: 'Финансы',   data: areas.finance },
    { key: 'health',        icon: '🌿', label: 'Здоровье',  data: areas.health },
  ]
})

// Короткая дата вида "ДД.ММ" из ISO-строки YYYY-MM-DD
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

function dayOfMonth(iso: string): string {
  return iso.split('-')[2]
}

const MONTHS_SHORT_RU = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
function shortMonth(iso: string): string {
  const m = parseInt(iso.split('-')[1], 10)
  return MONTHS_SHORT_RU[m - 1]
}

const MONTHS_GENITIVE_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']
const keyDatesMonthGenitive = computed(() => {
  if (!monthResult.value) return ''
  const m = parseInt(monthResult.value.monthStart.split('-')[1], 10)
  return MONTHS_GENITIVE_RU[m - 1]
})

function resonanceClass(label: string): string {
  if (label === 'Благоприятный') return 'res-good'
  if (label === 'Нейтральный') return 'res-neutral'
  return 'res-warn'
}

function badgeClass(badge: string): string {
  if (badge === 'Пик') return 'badge-peak'
  if (badge === 'Осторожно') return 'badge-caution'
  if (badge === 'Решения') return 'badge-decision'
  return 'badge-meeting'
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
/* Лоадер: маскот, фразы и прогресс — в общем компоненте LioraLoader */

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

/* 4 недели */
.week-preview-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 10px;
  margin-bottom: 18px;
}
.week-preview-card {
  padding: 14px; text-align: center; cursor: pointer; transition: transform .15s;
}
.wp-label { font-size: 9px; letter-spacing: .08em; color: rgba(255,255,255,.4); font-weight: 700; margin-bottom: 4px; }
.wp-dates { font-size: 10px; color: rgba(255,255,255,.4); margin-bottom: 6px; }
.wp-number {
  font-size: 30px; font-weight: 600; color: #ffc857;
}
.wp-title { font-size: 12px; color: rgba(255,255,255,.75); margin: 2px 0 8px; }
.wp-resonance {
  display: inline-block; font-size: 8px; font-weight: 700; text-transform: uppercase;
  letter-spacing: .02em; padding: 3px 8px; border-radius: 6px;
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

/* Ключевые даты */
.key-dates { padding: 6px 16px; margin-bottom: 10px; }
.key-date-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 0; border-bottom: 1px solid rgba(255,255,255,.06);
}
.key-date-row:last-child { border-bottom: none; }
.kd-date { flex-shrink: 0; width: 34px; text-align: center; }
.kd-day { font-size: 18px; font-weight: 700; font-family: 'Cormorant Garamond', serif; color: #F5ECFF; }
.kd-mon { font-size: 9px; text-transform: uppercase; color: rgba(255,255,255,.4); }
.kd-badge {
  /* Фиксированная ширина под самый длинный бейдж («ОСТОРОЖНО») — иначе описание
     справа стартует в разных местах в зависимости от длины слова в бейдже. */
  flex-shrink: 0; width: 92px; box-sizing: border-box; text-align: center;
  font-size: 9px; font-weight: 700; text-transform: uppercase;
  padding: 3px 4px; border-radius: 6px; white-space: nowrap;
}
.badge-peak     { background: rgba(112,224,168,.18); color: #70e0a8; }
.badge-caution  { background: rgba(233,74,108,.18);  color: #e94a6c; }
.badge-decision { background: rgba(182,84,255,.18);  color: #c084fc; }
.badge-meeting  { background: rgba(255,200,87,.18);  color: #ffc857; }
.kd-desc { flex: 1; font-size: 12px; line-height: 1.4; color: rgba(255,255,255,.7); }

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

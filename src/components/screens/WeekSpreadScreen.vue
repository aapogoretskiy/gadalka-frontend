<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Расклад на неделю</div>
        <div style="width:36px"></div>
      </div>

      <!-- ══ Загрузка ════════════════════════════════════════════════ -->
      <template v-if="weekLoading">
        <div class="loader-wrap">
          <div class="ai-orb">
            <div class="orb-core"></div>
            <div class="orb-ring r1"></div>
            <div class="orb-ring r2"></div>
          </div>
          <h2 class="serif loader-title">{{ loadingMessages[msgIdx] }}</h2>
          <p class="loader-sub">Читаем числовые коды недели...</p>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" :style="`width:${progress}%`"></div>
          </div>
        </div>
      </template>

      <!-- ══ Результат ═══════════════════════════════════════════════ -->
      <template v-else-if="weekResult">

        <!-- Число недели -->
        <div class="num-hero gradient-card">
          <div class="num-mega">{{ weekResult.weekNumber }}</div>
          <div class="num-label">Число недели</div>
          <div class="num-short serif">{{ weekResult.weekNumberTitle }}</div>
        </div>
        <div class="detail-card glass">
          <h4 class="serif detail-title">⚡ Энергия недели</h4>
          <p class="detail-body">{{ weekResult.weekDescription }}</p>
        </div>

        <!-- Главная тема -->
        <div v-if="weekResult.mainTheme" class="detail-card glass">
          <h4 class="serif detail-title">Главная тема</h4>
          <p class="detail-body">{{ weekResult.mainTheme }}</p>
        </div>

        <!-- Три пиковых дня -->
        <div v-if="weekResult.peakDays?.length" class="detail-card glass">
          <h4 class="serif detail-title">☀️ Три пиковых дня</h4>
          <div v-for="pd in weekResult.peakDays" :key="pd.date" class="peak-day-row">
            <p class="peak-day-head"><b>{{ longDate(pd.date) }}, {{ ruDowFull(pd.dayOfWeek) }}</b> — {{ pd.label }}.</p>
            <p class="peak-day-advice">{{ pd.advice }}</p>
          </div>
        </div>

        <!-- Что усилить -->
        <div v-if="weekResult.whatToStrengthen" class="detail-card glass">
          <h4 class="serif detail-title">✅ Что усилить</h4>
          <p class="detail-body">{{ weekResult.whatToStrengthen }}</p>
        </div>

        <!-- 7 дней -->
        <div class="week-days">
          <div v-for="d in weekResult.days" :key="d.date" class="week-day-card glass">
            <div class="week-day-dow">{{ d.dayOfWeek }}</div>
            <div class="week-day-date">{{ shortDate(d.date) }}</div>
            <div class="week-day-code">{{ d.dayCode }}</div>
            <div class="week-day-title">{{ d.dayCodeTitle }}</div>
            <div class="week-day-resonance" :class="resonanceClass(d.resonanceLabel)">{{ d.resonanceLabel }}</div>
          </div>
        </div>

        <div class="detail-card glass">
          <h4 class="serif detail-title">🌟 Лучший день</h4>
          <p class="detail-body">{{ shortDate(weekResult.bestDay.date) }} ({{ weekResult.bestDay.dayOfWeek }}) — {{ weekResult.bestDay.dayCodeTitle }}</p>
        </div>
        <div class="detail-card glass">
          <h4 class="serif detail-title">⚠️ Будьте внимательнее</h4>
          <p class="detail-body">{{ shortDate(weekResult.challengingDay.date) }} ({{ weekResult.challengingDay.dayOfWeek }}) — {{ weekResult.challengingDay.dayCodeTitle }}</p>
        </div>

        <!-- Чего избегать (на уровне недели) -->
        <div v-if="weekResult.whatToAvoid" class="detail-card glass detail-card--warn">
          <h4 class="serif detail-title">⚠️ Чего избегать</h4>
          <p class="detail-body">{{ weekResult.whatToAvoid }}</p>
        </div>

        <!-- Отношения / Финансы -->
        <div v-if="weekResult.relationships" class="detail-card glass">
          <h4 class="serif detail-title">💗 Отношения</h4>
          <p class="detail-body">{{ weekResult.relationships }}</p>
        </div>
        <div v-if="weekResult.finance" class="detail-card glass">
          <h4 class="serif detail-title">💰 Финансы</h4>
          <p class="detail-body">{{ weekResult.finance }}</p>
        </div>

        <div class="affirmation-card gradient-card">
          <div class="aff-label">✦ Аффирмация недели</div>
          <div class="aff-text serif">"{{ weekResult.weeklyAffirmation }}"</div>
        </div>

        <!-- Фидбэк на расклад -->
        <ActionFeedbackWidget
          v-if="weekResult.id"
          action-type="NUMEROLOGY_WEEK"
          :action-id="weekResult.id"
        />
      </template>

      <!-- ══ Тихая проверка при открытии экрана ═════════════════════════ -->
      <div v-else-if="checkingExisting" class="loader-wrap loader-wrap--silent">
        <div class="loading-spinner-sm"></div>
      </div>

      <!-- ══ Пейволл ═════════════════════════════════════════════════ -->
      <div v-else class="week-paywall glass">
        <div class="paywall-lock">🔒</div>
        <div class="paywall-title serif">Расклад на неделю</div>
        <div class="paywall-sub">7 дней вперёд, число недели, лучший и сложный день, аффирмация недели</div>

        <div v-if="weekErrorMsg" class="week-error">{{ weekErrorMsg }}</div>

        <button v-if="canAffordWeek" class="action-btn haptic" @click="getWeeklyAnalysis">
          🔮 Открыть за {{ WEEK_COST }} знака
        </button>
        <button v-else class="action-btn action-btn--buy haptic" @click="navigate?.('payment')">
          Купить знаки →
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { api, type NumerologyWeekResponse } from '@/utils/api'
import { useBalance } from '@/composables/useBalance'
import { hapticFeedback } from '@/utils/telegram'
import ActionFeedbackWidget from '@/components/ui/ActionFeedbackWidget.vue'

const navigate = inject<(r: string) => void>('navigate')

// Стоимость синхронизирована с бэкендом: NumerologyWeekService.WEEK_COST (= стоимость расклада «3 карты»)
const WEEK_COST = 3

const { balance, refreshBalance } = useBalance()
const canAffordWeek = computed(() => (balance.value ?? 0) >= WEEK_COST)

const weekResult   = ref<NumerologyWeekResponse | null>(null)
const weekLoading  = ref(false)
const weekErrorMsg = ref('')

// ── Тихая проверка при открытии экрана ──────────────────────────────────────
// Если расклад на эту неделю уже куплен — бэкенд (NumerologyWeekService.getWeek)
// вернёт сохранённый результат бесплатно. Показываем его сразу, без лоадера
// «сложного расчёта» — это не новая покупка, а просто открытие уже готового расклада.
// Пейволл показываем только если запрос НЕ удался (расклада ещё нет — 402/422/любая ошибка).
const checkingExisting = ref(true)

onMounted(async () => {
  try {
    const res = await api.getNumerologyWeekCurrent()
    weekResult.value = res.data
  } catch {
    // 404 — расклада на эту неделю ещё нет, остаёмся на пейволле. Это нормальный случай.
  } finally {
    checkingExisting.value = false
  }
})

// ── Искусственная задержка лоадера ──────────────────────────────────────────
// Расчёт на бэкенде алгоритмический и почти мгновенный — но мы хотим, чтобы
// пользователь почувствовал «сложный расчёт», поэтому держим лоадер минимум
// MIN_LOADER_MS даже если ответ от API пришёл раньше.
const MIN_LOADER_MS = 2700

const loadingMessages = [
  'Считаем числовые коды дней...',
  'Сопоставляем с фазами Луны...',
  'Ищем резонансы недели...',
  'Формируем расклад недели...',
]
const msgIdx   = ref(0)
const progress = ref(0)

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function getWeeklyAnalysis() {
  if (weekLoading.value) return
  weekLoading.value = true
  weekErrorMsg.value = ''
  msgIdx.value = 0
  progress.value = 0

  const msgInterval = setInterval(() => {
    msgIdx.value = (msgIdx.value + 1) % loadingMessages.length
    progress.value = Math.min(progress.value + 22, 92)
  }, 650)

  try {
    const [res] = await Promise.all([
      api.getNumerologyWeek(),
      delay(MIN_LOADER_MS),
    ])
    progress.value = 100
    weekResult.value = res.data
    await refreshBalance()
    hapticFeedback.success()
  } catch (err: any) {
    if (err.response?.status === 402) {
      weekErrorMsg.value = 'Недостаточно знаков для этого расклада.'
      await refreshBalance()
    } else if (err.response?.status === 422) {
      weekErrorMsg.value = 'Укажите дату рождения в профиле, чтобы рассчитать расклад.'
    } else {
      weekErrorMsg.value = 'Не удалось получить расклад. Попробуйте ещё раз.'
    }
  } finally {
    clearInterval(msgInterval)
    weekLoading.value = false
  }
}

// Короткая дата вида "ДД.ММ" из ISO-строки YYYY-MM-DD
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
}

const MONTHS_RU = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

// Дата вида "23 апреля" из ISO-строки YYYY-MM-DD
function longDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${parseInt(d, 10)} ${MONTHS_RU[parseInt(m, 10) - 1]}`
}

const DOW_FULL: Record<string, string> = {
  'Пн': 'понедельник', 'Вт': 'вторник', 'Ср': 'среда', 'Чт': 'четверг',
  'Пт': 'пятница', 'Сб': 'субботу', 'Вс': 'воскресенье',
}

function ruDowFull(short: string): string {
  return DOW_FULL[short] ?? short
}

function resonanceClass(label: string): string {
  if (label === 'Благоприятный') return 'res-good'
  if (label === 'Нейтральный') return 'res-neutral'
  return 'res-warn'
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
.loader-title { font-size: 24px; margin: 24px 0 8px; }
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

/* Number hero */
.num-hero { padding: 28px 22px; text-align: center; margin-bottom: 14px; }
.num-mega {
  font-family: 'Cormorant Garamond', serif;
  font-size: 96px; font-weight: 500; line-height: 1;
  background: linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  letter-spacing: -.05em; position: relative;
}
.num-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: .12em;
  color: rgba(255,255,255,.6); font-weight: 600; margin-top: 4px; position: relative;
}
.num-short { font-size: 22px; margin-top: 14px; position: relative; font-style: italic; }

/* Detail cards */
.detail-card { padding: 18px 20px; margin-bottom: 10px; }
.detail-title { font-size: 17px; margin-bottom: 7px; color: #ffc857; }
.detail-body  { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.75); }

/* Карточка-предупреждение ("Чего избегать") — лёгкий розовый акцент вместо стандартного золотого */
.detail-card--warn .detail-title { color: #e94aa8; }
.detail-card--warn { border-color: rgba(233,74,168,0.25); }

/* Три пиковых дня */
.peak-day-row { margin-bottom: 12px; }
.peak-day-row:last-child { margin-bottom: 0; }
.peak-day-head {
  font-size: 13px; line-height: 1.5; color: rgba(255,255,255,.85); margin-bottom: 3px;
}
.peak-day-advice {
  font-size: 13px; line-height: 1.5; color: rgba(255,255,255,.65);
}

/* Тихая проверка существующего расклада при открытии экрана — компактный лоадер без текста */
.loader-wrap--silent {
  min-height: 40vh; padding: 20px 0;
}
.loading-spinner-sm {
  width: 36px; height: 36px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,0.15);
  border-top-color: #ffc857;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Affirmation */
.affirmation-card { padding: 20px; margin-bottom: 20px; }
.aff-label { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#ffc857; font-weight:600; margin-bottom:8px; }
.aff-text  { font-size:18px; line-height:1.4; font-style:italic; color:rgba(255,255,255,.9); }

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

/* Дни недели — 2 ряда (4+3), карточки одинаковой высоты независимо от длины текста */
.week-days {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(78px, 1fr));
  gap: 8px;
  margin-bottom: 14px;
}
.week-day-card {
  padding: 14px 6px;
  text-align: center;
  border-radius: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.week-day-dow   { font-size: 11px; color: rgba(255,255,255,.5); text-transform: uppercase; font-weight: 600; }
.week-day-date  { font-size: 10px; color: rgba(255,255,255,.4); margin-bottom: 6px; }
.week-day-code  { font-size: 24px; font-weight: 600; font-family: 'Cormorant Garamond', serif; color: #ffc857; }
.week-day-title {
  font-size: 9.5px; color: rgba(255,255,255,.6); line-height: 1.25;
  margin: 4px 0 6px; min-height: 24px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
  overflow: hidden;
}
.week-day-resonance {
  font-size: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: .02em;
  padding: 3px 6px; border-radius: 6px;
}
.res-good    { background: rgba(112,224,168,.18); color: #70e0a8; }
.res-neutral { background: rgba(255,200,87,.18);  color: #ffc857; }
.res-warn    { background: rgba(233,74,108,.18);  color: #e94a6c; }
</style>

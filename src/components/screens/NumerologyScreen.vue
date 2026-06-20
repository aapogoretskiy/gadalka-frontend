<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Нумерология</div>
        <div style="width:36px"></div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">Считаем ваше число дня…</div>
      </div>

      <!-- Error: no birth date -->
      <div v-else-if="noBirthDate" class="error-card glass">
        <div class="error-icon">🔢</div>
        <div class="error-title serif">Нужна дата рождения</div>
        <div class="error-body">Укажите дату рождения в профиле — без неё личный код дня не рассчитать.</div>
        <button class="action-btn" @click="navigate('profile')">Заполнить профиль</button>
      </div>

      <!-- Content -->
      <template v-else-if="data">

        <!-- Number hero -->
        <div class="num-hero gradient-card">
          <div class="num-mega">{{ data.dayCode }}</div>
          <div class="num-label">Код дня</div>
          <div class="num-short serif">{{ data.dayCodeTitle }}</div>
        </div>

        <!-- Day strip -->
        <div class="day-strip glass">
          <div class="day-strip-item">
            <div class="strip-icon">🌙</div>
            <div class="strip-label">Луна</div>
            <div class="strip-val">{{ data.moonPhase }}</div>
          </div>
          <div class="strip-divider"></div>
          <div class="day-strip-item">
            <div class="strip-icon">✨</div>
            <div class="strip-label">Знак</div>
            <div class="strip-val">{{ data.zodiacSign }}</div>
          </div>
          <div class="strip-divider"></div>
          <div class="day-strip-item">
            <div class="strip-icon">⏰</div>
            <div class="strip-label">Лучшее время</div>
            <div class="strip-val">{{ data.bestTime }}</div>
          </div>
        </div>

        <!-- Detail cards -->
        <div class="detail-card glass">
          <h4 class="serif detail-title">⚡ Энергия дня</h4>
          <p class="detail-body">{{ data.energyOfDay }}</p>
        </div>
        <div class="detail-card glass">
          <h4 class="serif detail-title">✅ Что делать</h4>
          <p class="detail-body">{{ data.whatToDo }}</p>
        </div>
        <div class="detail-card glass">
          <h4 class="serif detail-title">⚠️ Чего избегать</h4>
          <p class="detail-body">{{ data.whatToAvoid }}</p>
        </div>
        <div class="detail-card glass">
          <h4 class="serif detail-title">🌟 Астро-событие</h4>
          <p class="detail-body">{{ data.astroEvent }}</p>
        </div>

        <!-- Affirmation -->
        <div class="affirmation-card gradient-card">
          <div class="aff-label">✦ Аффирмация дня</div>
          <div class="aff-text serif">"{{ data.affirmation }}"</div>
        </div>

        <!-- Deep analysis section -->
        <div class="section-header">
          <div class="section-title serif">А теперь глубже</div>
        </div>

        <div class="period-grid">
          <div
            v-for="p in periods" :key="p.label"
            class="period-card haptic"
            :class="{ selected: selectedPeriod === p.label }"
            @click="selectedPeriod = p.label"
          >
            <div v-if="p.popular" class="period-badge">ХИТ</div>
            <div class="period-icon">{{ p.icon }}</div>
            <div class="period-title serif">{{ p.label }}</div>
            <div class="period-desc">{{ p.desc }}</div>
          </div>
        </div>

        <!-- Неделя: платный расклад -->
        <template v-if="selectedPeriod === 'Неделя'">

          <template v-if="weekResult">
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

            <div class="affirmation-card gradient-card">
              <div class="aff-label">✦ Аффирмация недели</div>
              <div class="aff-text serif">"{{ weekResult.weeklyAffirmation }}"</div>
            </div>
          </template>

          <!-- Пейволл -->
          <div v-else class="week-paywall glass">
            <div class="paywall-lock">🔒</div>
            <div class="paywall-title serif">Расклад на неделю</div>
            <div class="paywall-sub">7 дней вперёд, число недели, лучший и сложный день, аффирмация недели</div>

            <div v-if="weekErrorMsg" class="week-error">{{ weekErrorMsg }}</div>

            <button v-if="weekLoading" class="action-btn" disabled>
              <span class="loading-spinner"></span>
            </button>
            <button v-else-if="canAffordWeek" class="action-btn haptic" @click="getWeeklyAnalysis">
              🔮 Открыть за {{ WEEK_COST }} знака
            </button>
            <button v-else class="action-btn action-btn--buy haptic" @click="navigate('payment')">
              Купить знаки →
            </button>
          </div>

        </template>

        <!-- Месяц / Год: пока недоступно -->
        <button v-else class="action-btn action-btn--disabled" disabled>
          <span>Получить глубокий анализ</span>
          <ComingSoonBadge />
        </button>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'
import { api, type NumerologyTodayResponse, type NumerologyWeekResponse } from '@/utils/api'
import { useBalance } from '@/composables/useBalance'
import { hapticFeedback } from '@/utils/telegram'

const navigate = inject<(r: string) => void>('navigate')

const loading     = ref(true)
const noBirthDate = ref(false)
const data        = ref<NumerologyTodayResponse | null>(null)

onMounted(async () => {
  try {
    const res = await api.getNumerologyToday()
    data.value = res.data
  } catch (err: any) {
    if (err.response?.status === 422) {
      noBirthDate.value = true
    }
  } finally {
    loading.value = false
  }
})

const selectedPeriod = ref('Месяц')
const periods = [
  { label: 'Неделя', icon: '🌱', desc: 'Прогноз на 7 дней', popular: false },
  { label: 'Месяц',  icon: '🌙', desc: 'Детальный анализ',  popular: false },
  { label: 'Год',    icon: '⭐', desc: 'Стратегия судьбы', popular: false },
]

// ── Недельный расклад (платно) ──────────────────────────────────────────────
// Стоимость синхронизирована с бэкендом: NumerologyWeekService.WEEK_COST (= стоимость расклада «3 карты»)
const WEEK_COST = 3

const { balance, refreshBalance } = useBalance()
const canAffordWeek = computed(() => (balance.value ?? 0) >= WEEK_COST)

const weekResult   = ref<NumerologyWeekResponse | null>(null)
const weekLoading  = ref(false)
const weekErrorMsg = ref('')

async function getWeeklyAnalysis() {
  if (weekLoading.value) return
  weekLoading.value = true
  weekErrorMsg.value = ''
  try {
    const res = await api.getNumerologyWeek()
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
    weekLoading.value = false
  }
}

// Короткая дата вида "ДД.ММ" из ISO-строки YYYY-MM-DD
function shortDate(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}.${m}`
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

/* Loading */
.loading-state { display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 60px 20px; gap: 16px; }
.loading-spinner {
  width: 40px; height: 40px; border-radius: 50%;
  border: 3px solid rgba(255,255,255,.1);
  border-top-color: #ffc857;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.loading-text { font-size: 14px; color: rgba(255,255,255,.5); }

/* Error */
.error-card { padding: 32px 24px; text-align: center; margin-bottom: 16px; }
.error-icon  { font-size: 40px; margin-bottom: 12px; }
.error-title { font-size: 20px; margin-bottom: 8px; }
.error-body  { font-size: 14px; color: rgba(255,255,255,.65); line-height: 1.6; margin-bottom: 20px; }

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

/* Day strip */
.day-strip {
  display: flex; align-items: center; justify-content: space-around;
  padding: 14px; margin-bottom: 12px;
}
.day-strip-item { flex: 1; text-align: center; }
.strip-icon  { font-size: 20px; margin-bottom: 4px; }
.strip-label { font-size: 10px; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing:.06em; font-weight:600; }
.strip-val   { font-size: 12px; font-weight: 500; margin-top: 2px; }
.strip-divider { width: 1px; height: 36px; background: rgba(255,255,255,.08); }

/* Detail cards */
.detail-card { padding: 18px 20px; margin-bottom: 10px; }
.detail-title { font-size: 17px; margin-bottom: 7px; color: #ffc857; }
.detail-body  { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.75); }

/* Affirmation */
.affirmation-card { padding: 20px; margin-bottom: 20px; }
.aff-label { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#ffc857; font-weight:600; margin-bottom:8px; }
.aff-text  { font-size:18px; line-height:1.4; font-style:italic; color:rgba(255,255,255,.9); }

/* Section */
.section-header { display:flex; justify-content:space-between; margin-bottom:12px; padding-top:8px; }
.section-title  { font-size:20px; }

/* Period grid */
.period-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px; }
.period-card {
  padding:14px 8px; text-align:center; cursor:pointer;
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
  border-radius:14px; transition:all .2s; position:relative; overflow:hidden;
}
.period-card.selected {
  background: linear-gradient(135deg, rgba(255,200,87,.2), rgba(233,74,168,.1));
  border-color: rgba(255,200,87,.4);
}
.period-badge {
  position:absolute; top:5px; right:5px;
  background:#ffc857; color:#1a0529; font-size:7px; font-weight:700;
  padding:1px 5px; border-radius:4px; letter-spacing:.04em; text-transform:uppercase;
}
.period-icon  { font-size:20px; margin-bottom:4px; }
.period-title { font-size:14px; margin-bottom:2px; }
.period-desc  { font-size:9.5px; color:rgba(255,255,255,.5); margin-bottom:6px; line-height:1.3; }

/* Button */
.action-btn {
  width:100%; padding:15px; border-radius:16px;
  background:linear-gradient(135deg,#b654ff,#e94aa8);
  color:#fff; font-size:15px; font-weight:600;
  font-family:'Manrope',sans-serif; border:none; cursor:pointer;
  box-shadow:0 8px 24px rgba(182,84,255,.4);
  display:flex; align-items:center; justify-content:center; gap:10px;
}
.action-btn--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}
.action-btn--buy {
  background: linear-gradient(135deg, rgba(255,200,87,0.2), rgba(233,74,168,0.15));
  border: 1px solid rgba(255,200,87,0.4);
  color: #ffc857;
  box-shadow: none;
}

/* Недельный пейволл */
.week-paywall {
  display: flex; flex-direction: column; align-items: center;
  padding: 32px 24px; text-align: center; gap: 6px;
}
.paywall-lock  { font-size: 32px; margin-bottom: 4px; }
.paywall-title { font-size: 20px; margin-bottom: 2px; }
.paywall-sub   { font-size: 13px; color: rgba(255,255,255,.55); line-height: 1.5; margin-bottom: 16px; }
.week-error    { font-size: 12px; color: #ff8a8a; margin-bottom: 10px; }

/* Дни недели */
.week-days {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px;
  margin-bottom: 14px;
}
.week-day-card {
  padding: 10px 4px; text-align: center; border-radius: 12px;
}
.week-day-dow   { font-size: 10px; color: rgba(255,255,255,.5); text-transform: uppercase; font-weight: 600; }
.week-day-date  { font-size: 9px; color: rgba(255,255,255,.4); margin-bottom: 4px; }
.week-day-code  { font-size: 20px; font-weight: 600; font-family: 'Cormorant Garamond', serif; color: #ffc857; }
.week-day-title { font-size: 8.5px; color: rgba(255,255,255,.6); line-height: 1.2; min-height: 20px; margin: 2px 0 4px; }
.week-day-resonance {
  font-size: 7.5px; font-weight: 600; text-transform: uppercase; letter-spacing: .02em;
  padding: 2px 4px; border-radius: 6px;
}
.res-good    { background: rgba(112,224,168,.18); color: #70e0a8; }
.res-neutral { background: rgba(255,200,87,.18);  color: #ffc857; }
.res-warn    { background: rgba(233,74,108,.18);  color: #e94a6c; }
</style>

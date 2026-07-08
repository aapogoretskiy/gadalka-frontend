<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Портрет личности</div>
        <div style="width:36px"></div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">Составляем ваш портрет…</div>
      </div>

      <!-- Error: no birth date -->
      <div v-else-if="noBirthDate" class="error-card glass">
        <div class="error-icon">🔢</div>
        <div class="error-title serif">Нужна дата рождения</div>
        <div class="error-body">Укажите дату рождения в профиле — без неё портрет не составить.</div>
        <button class="action-btn" @click="navigate?.('profile')">Заполнить профиль</button>
      </div>

      <!-- Content -->
      <template v-else-if="data">

        <div class="page-subtitle">ВАШ НУМЕРОЛОГИЧЕСКИЙ ПОРТРЕТ</div>
        <div class="page-title serif">Кто вы<br>по числам</div>

        <!-- Число жизни -->
        <div class="life-card gradient-card">
          <div class="life-badge">ЧИСЛО ЖИЗНИ</div>
          <div class="life-number serif">{{ toRoman(data.lifePathNumber) }}</div>
          <div class="life-archetype serif">{{ data.lifePathArchetype }}</div>
          <div class="life-desc">{{ data.lifePathDescription }}</div>
          <button class="expand-btn haptic" @click="expanded = !expanded">
            {{ expanded ? 'Свернуть ↑' : 'Узнать подробнее ↓' }}
          </button>

          <Transition name="expand">
            <div v-if="expanded" class="life-details">
              <div class="detail-block">
                <div class="detail-icon">💪</div>
                <div class="detail-head">Сильные стороны</div>
                <div class="detail-text">{{ data.lifePathStrengths }}</div>
              </div>
              <div class="detail-block">
                <div class="detail-icon">⚠️</div>
                <div class="detail-head">Точки роста</div>
                <div class="detail-text">{{ data.lifePathGrowthPoints }}</div>
              </div>
              <div class="detail-block">
                <div class="detail-icon">🎯</div>
                <div class="detail-head">В чём ваше призвание</div>
                <div class="detail-text">{{ data.lifePathCalling }}</div>
              </div>
              <div class="detail-block">
                <div class="detail-icon">✨</div>
                <div class="detail-head">Известные «{{ data.lifePathNumber }}»</div>
                <div class="detail-text">{{ data.lifePathFamousPeople }}</div>
              </div>
            </div>
          </Transition>
        </div>

        <!-- Другие числа -->
        <div class="section-title serif">Другие ваши числа</div>

        <!-- Подсказка об имени -->
        <div class="name-hint glass">
          <div class="name-hint-text">
            <span v-if="data.nameSource === 'telegram'">
              Числа рассчитаны по имени из Telegram
              <strong>«{{ data.nameUsed }}»</strong>.
              Введите полное имя для точного результата.
            </span>
            <span v-else>
              Числа рассчитаны по имени <strong>«{{ data.nameUsed }}»</strong>.
            </span>
          </div>
          <button class="name-edit-btn haptic" @click="nameInputOpen = !nameInputOpen">
            {{ data.nameSource === 'telegram' ? 'Ввести имя' : 'Изменить' }}
          </button>
        </div>

        <!-- Поле ввода имени -->
        <Transition name="expand">
          <div v-if="nameInputOpen" class="name-input-block glass">
            <input
              v-model="nameInput"
              class="name-input"
              type="text"
              placeholder="Введите ваше полное имя"
              maxlength="50"
            />
            <button class="action-btn" :disabled="savingName || !nameInput.trim()" @click="saveName">
              {{ savingName ? 'Сохраняем…' : 'Рассчитать' }}
            </button>
          </div>
        </Transition>

        <!-- Карточки других чисел -->
        <div class="other-numbers">
          <div class="other-card glass">
            <div class="other-num-box">{{ data.soulNumber }}</div>
            <div class="other-body">
              <div class="other-label">ЧИСЛО ДУШИ</div>
              <div class="other-archetype">{{ data.soulArchetype }}</div>
              <div class="other-desc">{{ data.soulDescription }}</div>
            </div>
          </div>
          <div class="other-card glass">
            <div class="other-num-box">{{ data.nameNumber }}</div>
            <div class="other-body">
              <div class="other-label">ЧИСЛО ИМЕНИ</div>
              <div class="other-archetype">{{ data.nameArchetype }}</div>
              <div class="other-desc">{{ data.nameDescription }}</div>
            </div>
          </div>
          <div class="other-card glass">
            <div class="other-num-box">{{ data.birthdayNumber }}</div>
            <div class="other-body">
              <div class="other-label">ЧИСЛО ДНЯ РОЖДЕНИЯ</div>
              <div class="other-archetype">{{ data.birthdayArchetype }}</div>
              <div class="other-desc">{{ data.birthdayDescription }}</div>
            </div>
          </div>
        </div>

        <!-- Совместимость -->
        <div class="section-title serif" style="margin-top:24px">Кто вам подходит по числам</div>
        <div class="compat-hint">
          Базовая совместимость вашего числа жизни ({{ data.lifePathNumber }}) с другими типами.
          Реальный процент с конкретным человеком зависит ещё от его чисел и имён.
        </div>

        <div class="compat-list">
          <div
            v-for="item in data.compatibility" :key="item.number"
            class="compat-row glass"
          >
            <div class="compat-num">{{ item.number }}</div>
            <div class="compat-body">
              <div class="compat-arch">{{ item.archetype }}</div>
              <div class="compat-bar-wrap">
                <div class="compat-bar" :style="{ width: item.compatibility + '%', background: barColor(item.compatibility) }"></div>
              </div>
            </div>
            <div class="compat-pct" :style="{ color: barColor(item.compatibility) }">{{ item.compatibility }}%</div>
          </div>
        </div>

        <!-- CTA — проверить с конкретным человеком -->
        <div class="compat-cta glass haptic" @click="navigate?.('compatibility')">
          <div class="compat-cta-icon">🔮</div>
          <div class="compat-cta-body">
            <div class="compat-cta-title">Проверить с конкретным человеком</div>
            <div class="compat-cta-sub">Полная совместимость по дате рождения и нумерологии</div>
          </div>
          <div class="compat-cta-arrow">›</div>
        </div>

        <!-- Персональный прогноз: точка входа для День/Неделя/Месяц/Год.
             «Числа» теперь открываются на портрете, а расклады по периодам —
             ниже по скроллу (см. фичу «перестановка экранов вкладки Числа»). -->
        <div class="periods-divider"><span>Текущие числа</span></div>

        <div class="section-title serif periods-title">Персональный прогноз</div>
        <div class="periods-subtitle">От дня до года — выберите период, который хотите разобрать.</div>

        <div class="period-grid period-grid--4">
          <div class="period-card haptic" @click="navigate?.('numerology-day')">
            <div class="period-free-badge">+ Бесплатно</div>
            <div class="period-icon">☀️</div>
            <div class="period-title serif">День</div>
            <div class="period-desc">Число дня сейчас</div>
          </div>
          <div
            class="period-card haptic"
            :class="{ 'period-card--new': weekBadge.isNew || weekBadge.isHot }"
            @click="navigate?.('numerology-week')"
          >
            <div
              v-if="weekOpened || weekBadge.isNew || weekBadge.isHot"
              class="period-badge"
              :class="{ 'period-badge--opened': weekOpened }"
            >{{ weekOpened ? 'Открыто' : (weekBadge.isNew ? 'Новинка' : 'Хит') }}</div>
            <div class="period-icon">🌱</div>
            <div class="period-title serif">Неделя</div>
            <div class="period-desc">Прогноз на 7 дней</div>
            <div v-if="!weekOpened" class="period-price">{{ weekCost }} знака</div>
          </div>
          <div
            class="period-card haptic"
            :class="{ 'period-card--new': monthBadge.isNew || monthBadge.isHot }"
            @click="navigate?.('numerology-month')"
          >
            <div
              v-if="monthOpened || monthBadge.isNew || monthBadge.isHot"
              class="period-badge"
              :class="{ 'period-badge--opened': monthOpened }"
            >{{ monthOpened ? 'Открыто' : (monthBadge.isNew ? 'Новинка' : 'Хит') }}</div>
            <div class="period-icon">🌙</div>
            <div class="period-title serif">Месяц</div>
            <div class="period-desc">Детальный анализ</div>
            <div v-if="!monthOpened" class="period-price">{{ monthCost }} знаков</div>
          </div>
          <div
            class="period-card haptic"
            :class="{ 'period-card--new': yearBadge.isNew || yearBadge.isHot }"
            @click="navigate?.('numerology-year')"
          >
            <div
              v-if="yearOpened || yearBadge.isNew || yearBadge.isHot"
              class="period-badge"
              :class="{ 'period-badge--opened': yearOpened }"
            >{{ yearOpened ? 'Открыто' : (yearBadge.isNew ? 'Новинка' : 'Хит') }}</div>
            <div class="period-icon">⭐</div>
            <div class="period-title serif">Год</div>
            <div class="period-desc">365 дней + код года</div>
            <div v-if="!yearOpened" class="period-price">{{ yearCost }} знаков</div>
          </div>
        </div>

      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted } from 'vue'
import { api, type NumerologyPortraitResponse } from '@/utils/api'
import { useFeatureCosts } from '@/composables/useFeatureCosts'
import { useFeatureBadges } from '@/composables/useFeatureBadges'

const navigate = inject<(r: string) => void>('navigate')

const loading      = ref(true)
const noBirthDate  = ref(false)
const data         = ref<NumerologyPortraitResponse | null>(null)
const expanded     = ref(false)
const nameInputOpen = ref(false)
const nameInput    = ref('')
const savingName   = ref(false)

// Цены раскладов подтягиваются с бэкенда (админ может их менять) —
// см. useFeatureCosts.ts, тот же паттерн что и в WeekSpreadScreen/MonthSpreadScreen.
const { featureCosts, loadFeatureCosts } = useFeatureCosts()
const weekCost = computed(() => featureCosts.value.numerologyWeek)
const monthCost = computed(() => featureCosts.value.numerologyMonth)
const yearCost = computed(() => featureCosts.value.numerologyYear)

// Отметки «Новинка»/«Хит» — настраиваются админом на той же вкладке «Цены»,
// см. useFeatureBadges.ts. Раньше «Хит» на карточке «Неделя» был захардкожен —
// теперь это тоже управляется отсюда.
const { featureBadges, loadFeatureBadges } = useFeatureBadges()
const weekBadge  = computed(() => featureBadges.value.numerologyWeek)
const monthBadge = computed(() => featureBadges.value.numerologyMonth)
const yearBadge  = computed(() => featureBadges.value.numerologyYear)

// Уже открытые в этом периоде расклады — тихая проверка (без создания и без списания знаков),
// чтобы на карточке показать «Открыто» вместо цены/бейджа «Хит».
const weekOpened  = ref(false)
const monthOpened = ref(false)
const yearOpened  = ref(false)

onMounted(async () => {
  loadFeatureCosts()
  loadFeatureBadges()
  api.getNumerologyWeekCurrent().then(() => { weekOpened.value = true }).catch(() => {})
  api.getNumerologyMonthCurrent().then(() => { monthOpened.value = true }).catch(() => {})
  api.getNumerologyYearCurrent().then(() => { yearOpened.value = true }).catch(() => {})
  try {
    const res = await api.getNumerologyPortrait()
    data.value = res.data
  } catch (err: any) {
    if (err.response?.status === 422) {
      noBirthDate.value = true
    }
  } finally {
    loading.value = false
  }
})

async function saveName() {
  if (!nameInput.value.trim() || savingName.value) return
  savingName.value = true
  try {
    await api.saveNumerologyName(nameInput.value.trim())
    // Перезагружаем данные портрета с новым именем
    const res = await api.getNumerologyPortrait()
    data.value = res.data
    nameInputOpen.value = false
    nameInput.value = ''
  } catch {
    // ошибку покажет глобальный обработчик
  } finally {
    savingName.value = false
  }
}

// Конвертация числа в римское (1–33, мастер-числа как есть)
function toRoman(n: number): string {
  if (n === 11) return 'XI'
  if (n === 22) return 'XXII'
  if (n === 33) return 'XXXIII'
  const map: [number, string][] = [[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]
  let result = ''
  let num = n
  for (const [val, sym] of map) {
    while (num >= val) { result += sym; num -= val }
  }
  return result
}

function barColor(pct: number): string {
  if (pct >= 75) return '#4ade80'
  if (pct >= 50) return '#ffc857'
  return '#f87171'
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

/* Page header */
.page-subtitle {
  font-size: 10px; text-transform: uppercase; letter-spacing: .14em;
  color: #ffc857; font-weight: 700; text-align: center; margin-bottom: 8px;
}
.page-title {
  font-size: 32px; line-height: 1.15; text-align: center;
  margin-bottom: 24px;
}

/* Life card */
.life-card { padding: 24px 22px; margin-bottom: 24px; text-align: center; }
.life-badge {
  font-size: 9px; text-transform: uppercase; letter-spacing: .14em;
  color: #ffc857; font-weight: 700; margin-bottom: 12px;
}
.life-number {
  font-size: 72px; font-weight: 500; line-height: 1;
  background: linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  margin-bottom: 8px;
}
.life-archetype { font-size: 26px; margin-bottom: 12px; }
.life-desc {
  font-size: 14px; line-height: 1.6; color: rgba(255,255,255,.7);
  margin-bottom: 16px;
}
.expand-btn {
  background: none; border: 1px solid rgba(255,200,87,.4);
  color: #ffc857; font-size: 13px; font-weight: 600;
  padding: 8px 20px; border-radius: 20px; cursor: pointer;
  font-family: 'Manrope', sans-serif;
}

/* Details (expanded) */
.life-details {
  margin-top: 20px; padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,.08);
  display: flex; flex-direction: column; gap: 16px; text-align: left;
}
.detail-block {}
.detail-icon { font-size: 18px; margin-bottom: 4px; }
.detail-head {
  font-size: 13px; font-weight: 700; color: #ffc857; margin-bottom: 4px;
}
.detail-text { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.75); }

/* Section title */
.section-title { font-size: 22px; margin-bottom: 14px; }

/* Name hint */
.name-hint {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; margin-bottom: 12px;
}
.name-hint-text { flex: 1; font-size: 12px; color: rgba(255,255,255,.6); line-height: 1.5; }
.name-hint-text strong { color: rgba(255,255,255,.85); }
.name-edit-btn {
  flex-shrink: 0; background: none; border: 1px solid rgba(182,84,255,.5);
  color: #b654ff; font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 12px; cursor: pointer;
  font-family: 'Manrope', sans-serif; white-space: nowrap;
}

/* Name input block */
.name-input-block {
  padding: 16px; margin-bottom: 14px;
  display: flex; flex-direction: column; gap: 12px;
}
.name-input {
  width: 100%; padding: 12px 14px; box-sizing: border-box;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
  border-radius: 12px; color: #F5ECFF; font-size: 15px;
  font-family: 'Manrope', sans-serif; outline: none;
}
.name-input:focus { border-color: rgba(182,84,255,.5); }
.name-input::placeholder { color: rgba(255,255,255,.35); }

/* Other numbers */
.other-numbers { display: flex; flex-direction: column; gap: 10px; margin-bottom: 8px; }
.other-card {
  display: flex; align-items: center; gap: 16px;
  padding: 16px 18px;
}
.other-num-box {
  width: 44px; height: 44px; flex-shrink: 0;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(182,84,255,.25), rgba(233,74,168,.15));
  border: 1px solid rgba(182,84,255,.35);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 22px; font-weight: 600; color: #c084fc;
}
.other-body { flex: 1; }
.other-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: .1em;
  color: rgba(255,255,255,.45); font-weight: 600; margin-bottom: 2px;
}
.other-archetype { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.other-desc { font-size: 12px; color: rgba(255,255,255,.55); line-height: 1.4; }

/* Compatibility */
.compat-hint {
  font-size: 12px; color: rgba(255,255,255,.5); line-height: 1.55;
  margin-bottom: 14px;
}
.compat-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.compat-row {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
}
.compat-num {
  width: 32px; height: 32px; flex-shrink: 0;
  border-radius: 8px;
  background: rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px; font-weight: 600; color: rgba(255,255,255,.8);
}
.compat-body { flex: 1; }
.compat-arch { font-size: 13px; font-weight: 600; margin-bottom: 5px; }
.compat-bar-wrap {
  height: 4px; background: rgba(255,255,255,.08); border-radius: 2px; overflow: hidden;
}
.compat-bar {
  height: 100%; border-radius: 2px;
  transition: width .4s ease;
}
.compat-pct { font-size: 13px; font-weight: 700; flex-shrink: 0; width: 38px; text-align: right; }

/* CTA */
.compat-cta {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; cursor: pointer; margin-top: 4px;
}
.compat-cta-icon { font-size: 28px; flex-shrink: 0; }
.compat-cta-body { flex: 1; }
.compat-cta-title { font-size: 14px; font-weight: 600; color: #F5ECFF; margin-bottom: 2px; }
.compat-cta-sub { font-size: 11px; color: rgba(255,255,255,.45); }
.compat-cta-arrow { font-size: 24px; color: rgba(255,255,255,.3); }

/* Персональный прогноз (карточки День/Неделя/Месяц/Год) */
.periods-divider {
  display: flex; align-items: center; text-align: center;
  margin: 32px 0 18px; gap: 12px;
}
.periods-divider::before, .periods-divider::after {
  content: ''; flex: 1; height: 1px;
  background: rgba(255,255,255,.1);
}
.periods-divider span {
  font-size: 11px; font-style: italic; color: rgba(255,255,255,.4);
  font-family: 'Cormorant Garamond', serif;
  white-space: nowrap;
}
.periods-title { margin-bottom: 6px; }
.periods-subtitle { font-size: 13px; color: rgba(255,255,255,.5); line-height: 1.5; margin-bottom: 16px; }

.period-grid {
  display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px;
}
.period-card {
  padding:14px 8px; text-align:center; cursor:pointer;
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
  border-radius:14px; transition:all .2s; position:relative; overflow:hidden;
}
.period-card--new {
  border-color: rgba(182,84,255,.55);
  box-shadow: 0 0 0 1px rgba(182,84,255,.35), 0 0 18px rgba(182,84,255,.35);
}
.period-badge {
  position:absolute; top:5px; right:5px;
  background:#ffc857; color:#1a0529; font-size:7px; font-weight:700;
  padding:1px 5px; border-radius:4px; letter-spacing:.04em; text-transform:uppercase;
}
.period-icon  { font-size:20px; margin-bottom:4px; }
.period-title { font-size:14px; margin-bottom:2px; }
.period-desc  { font-size:9.5px; color:rgba(255,255,255,.5); margin-bottom:6px; line-height:1.3; }

.period-grid--4 { grid-template-columns: repeat(4, 1fr); gap: 6px; }
.period-grid--4 .period-card { padding: 12px 6px; }
.period-grid--4 .period-title { font-size: 12px; }
.period-grid--4 .period-desc { font-size: 8.5px; }

.period-card--disabled { opacity: .55; cursor: default; }

.period-free-badge {
  position: absolute; top: 5px; right: 5px;
  background: rgba(74,222,128,.18); color: #4ade80;
  font-size: 7px; font-weight: 700;
  padding: 1px 5px; border-radius: 4px; letter-spacing: .03em; text-transform: uppercase;
}
.period-price {
  font-size: 10px; font-weight: 700; color: #ffc857;
  margin-top: 2px;
}
.period-badge--opened {
  background: rgba(74,222,128,.18); color: #4ade80;
}

/* Transitions */
.expand-enter-active, .expand-leave-active { transition: opacity .25s ease, transform .25s ease; }
.expand-enter-from, .expand-leave-to { opacity: 0; transform: translateY(-8px); }

/* Action button */
.action-btn {
  width:100%; padding:14px; border-radius:14px;
  background:linear-gradient(135deg,#b654ff,#e94aa8);
  color:#fff; font-size:14px; font-weight:600;
  font-family:'Manrope',sans-serif; border:none; cursor:pointer;
  box-shadow:0 8px 24px rgba(182,84,255,.4);
}
.action-btn:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
</style>

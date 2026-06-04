<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Совместимость</div>
        <div style="width:36px"></div>
      </div>

      <!-- Hero orbs illustration -->
      <div class="compat-hero">
        <div class="orb-left">{{ initials.a || '?' }}</div>
        <div class="heart-center">💕</div>
        <div class="orb-right">{{ initials.b || '?' }}</div>
      </div>

      <!-- Form -->
      <div v-if="!result" class="form-section">

        <!-- Tip banner (dismissible) -->
        <div v-if="!tipDismissed" class="tip-banner glass">
          <div class="tip-banner-header">
            <span class="tip-banner-title">💡 Совет для точного результата</span>
            <button class="tip-close haptic" @click="dismissTip">✕</button>
          </div>
          <div class="tip-banner-body">
            Совместимость рассчитывается по нумерологическим значениям имён и дат рождения.<br>
            <strong>Рекомендуем вводить полное имя</strong> (например, «Александр», а не «Саша»).
          </div>
        </div>

        <!-- Person 1 -->
        <div class="person-block glass">
          <div class="person-block-header">
            <span class="person-label">Первый человек</span>
            <button
              v-if="canFillFromProfile"
              class="fill-btn haptic"
              @click="fillFromProfile"
            >
              Рассчитать для себя
            </button>
          </div>
          <div class="input-group">
            <label class="input-label">Имя <span class="req">*</span></label>
            <input
              v-model="name1"
              type="text"
              placeholder="Например: Анна"
              class="compat-input"
              @input="result = null"
            />
          </div>
          <div class="input-group">
            <label class="input-label">Дата рождения <span class="req">*</span></label>
            <div class="compat-input date-wrapper">
              <span v-if="!birthDate1" class="date-placeholder">Например: 15.06.1990</span>
              <span v-else class="date-value">{{ displayDate(birthDate1) }}</span>
              <input
                ref="dateInput1"
                v-model="birthDate1"
                type="date"
                class="date-native"
                @change="result = null"
              />
            </div>
          </div>
        </div>

        <!-- Person 2 -->
        <div class="person-block glass">
          <div class="person-block-header">
            <span class="person-label">Второй человек</span>
          </div>
          <div class="input-group">
            <label class="input-label">Имя <span class="req">*</span></label>
            <input
              v-model="name2"
              type="text"
              placeholder="Например: Иван"
              class="compat-input"
              @input="result = null"
            />
          </div>
          <div class="input-group">
            <label class="input-label">Дата рождения <span class="req">*</span></label>
            <div class="compat-input date-wrapper">
              <span v-if="!birthDate2" class="date-placeholder">Например: 20.03.1988</span>
              <span v-else class="date-value">{{ displayDate(birthDate2) }}</span>
              <input
                ref="dateInput2"
                v-model="birthDate2"
                type="date"
                class="date-native"
                @change="result = null"
              />
            </div>
          </div>
        </div>

        <button
          class="calc-btn haptic"
          :disabled="!isValid || isLoading"
          @click="calculate"
        >
          <span v-if="isLoading" class="loading-spinner"></span>
          <span v-else>Рассчитать совместимость →</span>
        </button>

        <div v-if="errorMsg" class="error-card glass">
          {{ errorMsg }}
        </div>

        <div class="tip-mini">💡 Используйте полные имена для точного расчёта</div>
      </div>

      <!-- Result -->
      <div v-if="result" class="result-section">
        <!-- Score ring -->
        <div class="score-ring-wrap">
          <svg class="score-svg" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="10"/>
            <circle
              cx="60" cy="60" r="50" fill="none"
              stroke="url(#scoreGrad)"
              stroke-width="10"
              stroke-linecap="round"
              stroke-dasharray="314"
              :stroke-dashoffset="314 - (314 * result.compatibilityScore / 100)"
              transform="rotate(-90 60 60)"
              style="transition: stroke-dashoffset 1s ease"
            />
            <defs>
              <linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stop-color="#ffc857"/>
                <stop offset="100%" stop-color="#e94aa8"/>
              </linearGradient>
            </defs>
          </svg>
          <div class="score-inner">
            <div class="score-pct">{{ result.compatibilityScore }}%</div>
            <div class="score-sub">совместимость</div>
          </div>
        </div>

        <div class="result-title serif">{{ result.label }}</div>

        <div class="name-row">
          <div class="name-chip">{{ name1 }}</div>
          <div class="name-sep">💕</div>
          <div class="name-chip">{{ name2 }}</div>
        </div>

        <!-- PAYWALL: interpretation + categories -->
        <div class="paywall-wrap" :class="{ locked: !isPremiumUnlocked }">
          <!-- Реальный контент — показываем только если разблокировано -->
          <div v-if="isPremiumUnlocked" class="paywall-content">
            <div class="result-desc glass">
              <p>{{ result.interpretation }}</p>
            </div>
            <div v-if="result.categories?.length" class="aspects glass">
              <div class="aspect-row" v-for="cat in result.categories" :key="cat.name">
                <div class="aspect-label">{{ cat.name }}</div>
                <div class="aspect-bar-wrap">
                  <div class="aspect-bar" :style="{ width: cat.score + '%' }"></div>
                </div>
                <div class="aspect-pct">{{ cat.score }}%</div>
              </div>
            </div>
          </div>

          <!-- Фейковый preview — всегда под блюром пока не разблокировано -->
          <div v-else class="paywall-content">
            <div class="result-desc glass">
              <p>Глубокий анализ показывает сильную эмоциональную связь и взаимное притяжение. Ваши числа рождения создают гармоничный союз с потенциалом долгосрочных отношений...</p>
            </div>
            <div class="aspects glass">
              <div class="aspect-row" v-for="fake in fakeCategories" :key="fake.name">
                <div class="aspect-label">{{ fake.name }}</div>
                <div class="aspect-bar-wrap">
                  <div class="aspect-bar" :style="{ width: fake.score + '%' }"></div>
                </div>
                <div class="aspect-pct">{{ fake.score }}%</div>
              </div>
            </div>
          </div>

          <div v-if="!isPremiumUnlocked" class="paywall-overlay">
            <div class="paywall-lock">🔒</div>
            <div class="paywall-title serif">Полный анализ</div>
            <div class="paywall-sub">Интерпретация и разбор по 5 категориям</div>

            <!-- Есть гадания — можно открыть -->
            <button v-if="hasCredits || isDev" class="paywall-btn haptic" @click="unlockPremium">
              🔮 Открыть за 2 знака
            </button>

            <!-- Нет гаданий — ведём на пополнение -->
            <button v-else class="paywall-btn paywall-btn--buy haptic" @click="navigate('payment')">
              Купить гадания →
            </button>

            <div v-if="isDev" class="paywall-dev-hint">DEV: кнопка эмулирует списание</div>
          </div>
        </div>

        <div class="result-actions" style="margin-top: 8px">
          <button class="action-btn secondary haptic" @click="reset">
            Новый расчёт
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { api, type CompatibilityResponse } from '@/utils/api'
import { useUser } from '@/composables/useUser'
import { useDevMode } from '@/composables/useDevMode'
import { useBalance } from '@/composables/useBalance'
import { useToast } from '@/composables/useToast'
import { hapticFeedback } from '@/utils/telegram'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'

const navigate = inject<(r: string) => void>('navigate')
const { telegramUser, profile } = useUser()
const { isDev } = useDevMode()
const { hasCredits, refreshBalance } = useBalance()
const { addToast } = useToast()
const tipDismissed = ref(localStorage.getItem('compatTipDismissed') === 'true')

const fakeCategories = [
  { name: 'Любовь',      score: 78 },
  { name: 'Доверие',     score: 85 },
  { name: 'Общение',     score: 72 },
  { name: 'Ценности',    score: 90 },
  { name: 'Перспектива', score: 68 },
]
function dismissTip() {
  tipDismissed.value = true
  localStorage.setItem('compatTipDismissed', 'true')
}

const name1 = ref('')
const birthDate1 = ref('')
const name2 = ref('')
const birthDate2 = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const result = ref<CompatibilityResponse | null>(null)
const paidUnlocked = ref(false)
const isPremiumUnlocked = computed(() => isDev.value || paidUnlocked.value)

const isValid = computed(() =>
  name1.value.trim().length >= 2 &&
  birthDate1.value.length > 0 &&
  name2.value.trim().length >= 2 &&
  birthDate2.value.length > 0
)

const initials = computed(() => ({
  a: name1.value.charAt(0).toUpperCase(),
  b: name2.value.charAt(0).toUpperCase(),
}))

const canFillFromProfile = computed(() =>
  !!(telegramUser.value?.first_name && profile.value?.birthDate)
)

function fillFromProfile() {
  name1.value = telegramUser.value?.first_name || ''
  birthDate1.value = profile.value?.birthDate || ''
  result.value = null
}

async function calculate() {
  if (!isValid.value || isLoading.value) return
  isLoading.value = true
  errorMsg.value = ''
  try {
    const response = await api.getCompatibility({
      persons: [
        { name: name1.value.trim(), birthDate: birthDate1.value },
        { name: name2.value.trim(), birthDate: birthDate2.value },
      ],
    })
    result.value = response.data
    // Если расклад уже был разблокирован ранее — показываем полный анализ сразу
    paidUnlocked.value = response.data.unlocked
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Не удалось рассчитать совместимость. Попробуйте ещё раз.'
  } finally {
    isLoading.value = false
  }
}

async function unlockPremium() {
  if (isDev.value) {
    paidUnlocked.value = true
    return
  }
  try {
    const res = await api.unlockCompatibility(result.value!.id)
    result.value = res.data
    paidUnlocked.value = true
    await refreshBalance()
    hapticFeedback.success()
  } catch {
    addToast('Не удалось списать знак. Попробуйте ещё раз.')
  }
}

// Форматируем ISO-дату (YYYY-MM-DD) в читаемый вид ДД.ММ.ГГГГ
function displayDate(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}.${m}.${y}`
}

function reset() {
  result.value = null
  name1.value = ''
  birthDate1.value = ''
  name2.value = ''
  birthDate2.value = ''
  errorMsg.value = ''
  paidUnlocked.value = false
}
</script>

<style scoped>
.screen-wrap { min-height: var(--tg-viewport-stable-height, 100vh); padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px)); overflow-y: auto; }
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
.header-title { font-size:18px; text-align:center; }

/* Hero orbs */
.compat-hero {
  display: flex; align-items: center; justify-content: center;
  gap: 0; margin-bottom: 28px; position: relative;
}
.orb-left, .orb-right {
  width: 72px; height: 72px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 28px; font-weight: 700; color: #fff;
  border: 2px solid rgba(255,200,87,.3);
}
.orb-left  { background: linear-gradient(135deg, #b654ff, #6a2eb8); box-shadow: 0 0 30px rgba(182,84,255,.4); }
.orb-right { background: linear-gradient(135deg, #e94aa8, #b654ff); box-shadow: 0 0 30px rgba(233,74,168,.4); }
.heart-center { font-size: 26px; z-index: 2; margin: 0 -12px; }

/* Form */
.form-section { display: flex; flex-direction: column; gap: 14px; }

.person-block { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
.person-block-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.person-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.5); min-width: 0; }

.fill-btn {
  padding: 6px 12px; border-radius: 20px;
  background: linear-gradient(135deg, rgba(182,84,255,.25), rgba(233,74,168,.25));
  border: 1px solid rgba(182,84,255,.4);
  color: #d89fff; font-size: 11px; font-weight: 600;
  font-family: 'Manrope', sans-serif; cursor: pointer;
  white-space: nowrap; flex-shrink: 0;
}

.input-group { display: flex; flex-direction: column; gap: 7px; width: 100%; min-width: 0; }
.input-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.6); }
.req { color: #e94aa8; }
.compat-input {
  width: 100%; min-width: 0; max-width: 100%; padding: 14px 16px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px; color: #F5ECFF; font-size: 15px;
  font-family: 'Manrope', sans-serif; outline: none;
  transition: border-color .2s; box-sizing: border-box;
  -webkit-text-fill-color: #F5ECFF;
}
.compat-input:focus { border-color: rgba(182,84,255,.5); }
.compat-input::placeholder { color: rgba(255,255,255,.35); -webkit-text-fill-color: rgba(255,255,255,.35); }
/* Обёртка для date-picker — выглядит как обычное поле */
.date-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  min-height: 50px;
}
.date-placeholder {
  color: rgba(255,255,255,.35);
  -webkit-text-fill-color: rgba(255,255,255,.35);
  font-size: 15px;
  pointer-events: none;
}
.date-value {
  color: #F5ECFF;
  font-size: 15px;
  pointer-events: none;
}
/* Прозрачный нативный input поверх — открывает системный пикер */
.date-native {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
  border: none;
  background: transparent;
  -webkit-appearance: none;
}

.calc-btn {
  width: 100%; padding: 15px; border-radius: 16px; margin-top: 4px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; font-size: 15px; font-weight: 600;
  font-family: 'Manrope', sans-serif; border: none; cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,.4);
  transition: opacity .2s; display: flex; align-items: center; justify-content: center; gap: 8px;
}
.calc-btn:disabled { opacity: 0.4; cursor: not-allowed; }

.loading-spinner {
  width: 18px; height: 18px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  animation: spin .7s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.error-card {
  padding: 14px 16px;
  font-size: 13px; color: #ff8a8a; line-height: 1.5;
  border: 1px solid rgba(255,80,80,.2);
}

.tip-banner { padding: 14px 16px; }
.tip-banner-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.tip-banner-title { font-size: 13px; font-weight: 700; color: #ffc857; }
.tip-close {
  width: 22px; height: 22px; border-radius: 50%;
  background: rgba(255,200,87,0.12); border: none;
  color: rgba(255,200,87,0.6); font-size: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.tip-banner-body { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.65); }
.tip-mini { font-size: 11px; color: rgba(255,255,255,.3); text-align: center; padding: 4px 0 2px; }

/* Result */
.result-section { display: flex; flex-direction: column; align-items: center; gap: 18px; }

.score-ring-wrap { position: relative; width: 160px; height: 160px; }
.score-svg { width: 100%; height: 100%; }
.score-inner {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}
.score-pct { font-family: 'Cormorant Garamond', serif; font-size: 42px; font-weight: 600; line-height: 1; color: #ffc857; }
.score-sub { font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.5); font-weight: 600; margin-top: 4px; }

.result-title { font-size: 24px; text-align: center; }

.name-row { display: flex; align-items: center; gap: 10px; }
.name-chip {
  padding: 6px 14px; border-radius: 100px;
  background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.12);
  font-size: 14px; font-weight: 600; color: #F5ECFF;
}
.name-sep { font-size: 18px; }

.result-desc {
  width: 100%; padding: 16px 18px;
  font-size: 14px; line-height: 1.65; color: rgba(255,255,255,.75); text-align: center;
}

.aspects { width: 100%; padding: 18px 20px; display: flex; flex-direction: column; gap: 14px; }
.aspect-row { display: flex; align-items: center; gap: 10px; }
.aspect-label { font-size: 12px; width: 100px; flex-shrink: 0; color: rgba(255,255,255,.7); }
.aspect-bar-wrap {
  flex: 1; height: 6px; border-radius: 3px;
  background: rgba(255,255,255,.08); overflow: hidden;
}
.aspect-bar {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  transition: width 1s ease;
}
.aspect-pct { font-size: 11px; font-weight: 600; color: #ffc857; width: 32px; text-align: right; flex-shrink: 0; }

.result-actions { display: flex; gap: 10px; width: 100%; }
.action-btn {
  flex: 1; padding: 14px; border-radius: 14px;
  font-size: 14px; font-weight: 600; font-family: 'Manrope', sans-serif; border: none; cursor: pointer;
}
.action-btn.primary {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; box-shadow: 0 6px 20px rgba(182,84,255,.35);
}
.action-btn.primary:disabled { opacity: .6; cursor: not-allowed; }
.action-btn.secondary {
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.12); color: #F5ECFF;
}

/* Paywall */
.paywall-wrap { position: relative; width: 100%; display: flex; flex-direction: column; gap: 18px; }
.paywall-wrap.locked .paywall-content {
  filter: blur(7px);
  pointer-events: none;
  user-select: none;
}
.paywall-content { display: flex; flex-direction: column; gap: 18px; width: 100%; }
.paywall-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(10,5,20,0.55);
  backdrop-filter: blur(2px);
  border-radius: 18px;
  padding: 24px 20px;
}
.paywall-lock { font-size: 32px; margin-bottom: 4px; }
.paywall-title { font-size: 20px; color: #F5ECFF; text-align: center; }
.paywall-sub {
  font-size: 13px;
  color: rgba(255,255,255,.55);
  text-align: center;
  line-height: 1.5;
  margin-bottom: 8px;
}
.paywall-btn {
  padding: 13px 28px;
  border-radius: 14px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: 'Manrope', sans-serif;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,.45);
}
.paywall-btn--buy {
  background: linear-gradient(135deg, rgba(255,200,87,0.2), rgba(233,74,168,0.15));
  border: 1px solid rgba(255,200,87,0.4) !important;
  color: #ffc857;
  box-shadow: none;
}
.paywall-dev-hint {
  font-size: 10px;
  color: rgba(112,224,168,.7);
  margin-top: 4px;
  letter-spacing: .04em;
}
</style>

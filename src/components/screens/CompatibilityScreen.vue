<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <button class="back-btn haptic" @click="navigate('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
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
            <input
              v-model="birthDate1"
              type="date"
              class="compat-input date-input"
              @input="result = null"
            />
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
            <input
              v-model="birthDate2"
              type="date"
              class="compat-input date-input"
              @input="result = null"
            />
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

        <!-- Tips -->
        <div class="tip-card glass">
          <div class="tip-title">💡 Как работает?</div>
          <div class="tip-body">Совместимость рассчитывается по нумерологическим значениям имён и дат рождения. Используйте полные официальные имена для точного результата (например, «Александр», а не «Саша»).</div>
        </div>
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
          <div class="paywall-content">
            <div class="result-desc glass">
              <p>{{ result.interpretation }}</p>
            </div>
            <div v-if="result.categories.length" class="aspects glass">
              <div class="aspect-row" v-for="cat in result.categories" :key="cat.name">
                <div class="aspect-label">{{ cat.name }}</div>
                <div class="aspect-bar-wrap">
                  <div class="aspect-bar" :style="{ width: cat.score + '%' }"></div>
                </div>
                <div class="aspect-pct">{{ cat.score }}%</div>
              </div>
            </div>
          </div>

          <div v-if="!isPremiumUnlocked" class="paywall-overlay">
            <div class="paywall-lock">🔒</div>
            <div class="paywall-title serif">Полный анализ</div>
            <div class="paywall-sub">Интерпретация и разбор по категориям</div>
            <button class="paywall-btn haptic" @click="unlockPremium">
              Открыть за 99 ₽
            </button>
            <div v-if="isDev" class="paywall-dev-hint">DEV: кнопка эмулирует оплату</div>
          </div>
        </div>

        <div class="result-actions">
          <button
            v-if="result.id"
            class="action-btn primary haptic"
            :disabled="isSaving || savedToDiary"
            @click="saveToDiary"
          >
            {{ savedToDiary ? '✓ Сохранено' : isSaving ? 'Сохраняем...' : 'В дневник' }}
          </button>
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
import { hapticFeedback } from '@/utils/telegram'

const navigate = inject<(r: string) => void>('navigate')
const { telegramUser, profile } = useUser()
const { isDev } = useDevMode()

const name1 = ref('')
const birthDate1 = ref('')
const name2 = ref('')
const birthDate2 = ref('')
const isLoading = ref(false)
const errorMsg = ref('')
const result = ref<CompatibilityResponse | null>(null)
const isSaving = ref(false)
const savedToDiary = ref(false)
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
  } catch (err: any) {
    errorMsg.value = err.response?.data?.message || 'Не удалось рассчитать совместимость. Попробуйте ещё раз.'
  } finally {
    isLoading.value = false
  }
}

function unlockPremium() {
  // TODO: интегрировать платёж (Telegram Stars / эквайринг)
  paidUnlocked.value = true
}

async function saveToDiary() {
  if (!result.value?.id || isSaving.value || savedToDiary.value) return
  isSaving.value = true
  try {
    await api.saveDiaryEntry({ featureType: 'COMPATIBILITY', referenceId: result.value.id })
    hapticFeedback.success()
    savedToDiary.value = true
  } catch {
    hapticFeedback.error?.()
  } finally {
    isSaving.value = false
  }
}

function reset() {
  result.value = null
  name1.value = ''
  birthDate1.value = ''
  name2.value = ''
  birthDate2.value = ''
  errorMsg.value = ''
  savedToDiary.value = false
  paidUnlocked.value = false
}
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 90px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
.back-btn {
  width:36px; height:36px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1);
  display:flex; align-items:center; justify-content:center; cursor:pointer; color:#F5ECFF;
}
.header-title { font-size:18px; }

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

.person-block { padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; }
.person-block-header { display: flex; align-items: center; justify-content: space-between; }
.person-label { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: rgba(255,255,255,.5); }

.fill-btn {
  padding: 6px 12px; border-radius: 20px;
  background: linear-gradient(135deg, rgba(182,84,255,.25), rgba(233,74,168,.25));
  border: 1px solid rgba(182,84,255,.4);
  color: #d89fff; font-size: 11px; font-weight: 600;
  font-family: 'Manrope', sans-serif; cursor: pointer;
  white-space: nowrap;
}

.input-group { display: flex; flex-direction: column; gap: 7px; }
.input-label { font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,.6); }
.req { color: #e94aa8; }
.compat-input {
  width: 100%; padding: 14px 16px;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px; color: #F5ECFF; font-size: 15px;
  font-family: 'Manrope', sans-serif; outline: none;
  transition: border-color .2s; box-sizing: border-box;
}
.compat-input:focus { border-color: rgba(182,84,255,.5); }
.compat-input::placeholder { color: rgba(255,255,255,.35); }
.date-input::-webkit-calendar-picker-indicator { filter: invert(1) opacity(0.5); cursor: pointer; }

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

.tip-card { padding: 18px; margin-top: 6px; }
.tip-title { font-size: 13px; font-weight: 600; color: #ffc857; margin-bottom: 8px; }
.tip-body  { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.65); }

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
.paywall-dev-hint {
  font-size: 10px;
  color: rgba(112,224,168,.7);
  margin-top: 4px;
  letter-spacing: .04em;
}
</style>

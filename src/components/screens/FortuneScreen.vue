<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- Step 1: Вопрос -->
      <template v-if="step === 1">
        <div class="header-bar">
          <button class="back-btn haptic" @click="navigate('home')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="header-title serif">Оракул</div>
          <div style="width:36px"></div>
        </div>

        <div class="step-indicator">
          <div class="step-item done"></div>
          <div class="step-item"></div>
          <div class="step-item"></div>
        </div>

        <div class="social-proof">🔮 12 847 человек получили ответ сегодня</div>

        <div class="question-area glass">
          <textarea
            v-model="question"
            maxlength="300"
            placeholder="Задайте свой вопрос..."
            @input="charCount = question.length"
          ></textarea>
          <div class="char-count">{{ charCount }}/300</div>
        </div>

        <div class="category-chips scrollbar-hide" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:4px;margin-bottom:20px">
          <button
            v-for="c in categories" :key="c.value"
            class="chip haptic"
            :class="{ selected: selectedCategory === c.value }"
            @click="selectedCategory = selectedCategory === c.value ? '' : c.value"
          >{{ c.emoji }} {{ c.label }}</button>
        </div>

        <button class="fortune-btn haptic" :disabled="question.length < 10" @click="step = 2">
          Далее →
        </button>
      </template>

      <!-- Step 2: Выбор расклада -->
      <template v-if="step === 2">
        <div class="header-bar">
          <button class="back-btn haptic" @click="step = 1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="header-title serif">Выберите расклад</div>
          <div style="width:36px"></div>
        </div>

        <div class="step-indicator">
          <div class="step-item done"></div>
          <div class="step-item done"></div>
          <div class="step-item"></div>
        </div>

        <div class="spread-options">
          <div
            v-for="s in spreads" :key="s.count"
            class="spread-card"
            :class="{ selected: selectedSpread === s.count, 'spread-card--locked': s.count !== 3 || (s.count === 3 && fortuneUsed && !isDev), haptic: s.count === 3 && (!fortuneUsed || isDev) }"
            @click="handleSpreadSelect(s.count)"
          >
            <div class="spread-icon-wrap">
              <div v-for="i in s.count" :key="i" class="mini-card-spread"
                :style="`left:${(i-1)*Math.min(10,36/Math.max(s.count-1,1))}px;transform:rotate(${(i-Math.ceil(s.count/2))*(s.count>5?5:8)}deg)`"></div>
            </div>
            <div class="spread-info">
              <div class="spread-title serif">{{ s.count }} {{ s.count === 1 ? 'карта' : s.count < 5 ? 'карты' : 'карт' }}</div>
              <div class="spread-desc">{{ s.desc }}</div>
            </div>
            <div class="spread-right">
              <ComingSoonBadge v-if="s.count !== 3" />
              <template v-if="s.count === 3">
                <div v-if="!fortuneUsed || isDev" class="spread-price" style="color:#70e0a8">
                  <span style="text-decoration:line-through;color:rgba(255,200,87,0.55);font-size:11px;margin-right:3px">199 ₽</span>Бесплатно
                </div>
                <div v-else class="spread-price" style="color:#ffc857">199 ₽</div>
              </template>
              <div v-else class="spread-price" style="color:#ffc857">
                {{ s.count === 5 ? '299 ₽' : '499 ₽' }}
              </div>
            </div>
          </div>
        </div>

        <button class="fortune-btn haptic" style="margin-top:20px" :disabled="fortuneUsed && !isDev" @click="startFortune">
          Перейти к раскладу →
        </button>
      </template>

      <!-- Step 3: Загрузка -->
      <template v-if="step === 3">
        <div style="min-height:80vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px 0">
          <div class="ai-orb">
            <div class="orb-core"></div>
            <div class="orb-ring r1"></div>
            <div class="orb-ring r2"></div>
          </div>
          <h2 class="serif" style="font-size:26px;margin:24px 0 8px">{{ loadingMessages[msgIdx] }}</h2>
          <p style="color:rgba(255,255,255,.55);font-size:13px;margin-bottom:28px">Читаем знаки Вселенной...</p>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" :style="`width:${progress}%`"></div>
          </div>
        </div>
      </template>

      <!-- Step 4: Результат -->
      <template v-if="step === 4 && result">
        <div class="header-bar">
          <button class="back-btn haptic" @click="navigate('home')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <div class="header-title serif">Ваш расклад</div>
          <div style="width:36px"></div>
        </div>

        <!-- Success banner -->
        <div class="success-banner">
          <div class="success-icon">✓</div>
          <div class="success-text">Расклад готов · <strong>{{ result.username }}</strong></div>
        </div>

        <!-- Question display -->
        <div class="question-pill">
          <span class="question-pill-icon">💬</span>
          <span>"{{ question }}"</span>
        </div>

        <!-- Cards row -->
        <div class="result-cards" :class="`cards-${result.cards.length}`">
          <div v-for="(card, i) in result.cards" :key="card.id" class="result-card-wrap">
            <div
              class="result-card haptic"
              :class="{ flipped: flipped.has(i) }"
              @click="flipCard(i)"
            >
              <div class="res-face res-back">
                <div class="res-back-border">
                  <svg viewBox="0 0 40 56" fill="none" opacity="0.8">
                    <rect x="2" y="2" width="36" height="52" rx="3" stroke="#ffc857" stroke-width="0.8"/>
                    <circle cx="20" cy="28" r="10" stroke="#ffc857" stroke-width="0.8"/>
                  </svg>
                </div>
              </div>
              <div class="res-face res-front">
                <div class="res-emoji">{{ posIcon(card.cardPosition) }}</div>
                <div class="res-name serif">{{ card.name }}</div>
              </div>
            </div>
            <div class="position-label" :class="`pos-label--${card.cardPosition.toLowerCase()}`">
              {{ posLabel(card.cardPosition) }}
            </div>
          </div>
        </div>

        <!-- Hint if cards not flipped yet -->
        <div v-if="flipped.size === 0" class="flip-hint">
          Нажмите на карту, чтобы открыть её
        </div>

        <!-- Per-card sections -->
        <div
          v-for="(card, i) in result.cards"
          :key="`section-${i}`"
          class="card-section"
          :class="`card-section--${card.cardPosition.toLowerCase()}`"
        >
          <!-- Position header -->
          <div class="cs-pos-row">
            <span class="cs-pos-icon">{{ posIcon(card.cardPosition) }}</span>
            <span class="cs-pos-label">{{ posLabel(card.cardPosition) }}</span>
            <span class="cs-pos-line"></span>
          </div>

          <!-- Card name -->
          <div class="cs-name serif">{{ card.name }}</div>

          <!-- Individual interpretation -->
          <div v-if="card.interpretation" class="cs-interpretation">{{ card.interpretation }}</div>

          <!-- Collapsible meaning -->
          <button class="cs-meaning-toggle haptic" @click="toggleAccordion(i)">
            <span>Значение карты</span>
            <span class="cs-toggle-icon" :class="{ open: openAccordions.has(i) }">›</span>
          </button>
          <div v-if="openAccordions.has(i)" class="cs-meaning-body">
            {{ card.meaning }}
          </div>
        </div>

        <!-- General interpretation -->
        <div class="summary-block">
          <div class="summary-label">✦ Общий вывод</div>
          <div class="summary-body">{{ result.interpretation }}</div>
        </div>

        <!-- Save to diary -->
        <button
          v-if="result.id"
          class="fortune-btn haptic"
          style="margin-bottom:10px"
          :disabled="isSaving || savedToDiary"
          @click="saveToDiary"
        >
          {{ savedToDiary ? '✓ Сохранено в дневник' : isSaving ? 'Сохраняем...' : 'Добавить в дневник' }}
        </button>

        <!-- Actions -->
        <div class="actions-row">
          <button class="fortune-btn haptic" @click="resetFortune">Новый вопрос</button>
          <button class="fortune-btn-sec haptic" @click="navigate('profile')">В профиль</button>
        </div>
      </template>

      <!-- Error -->
      <div v-if="error" class="error-msg">{{ error }}</div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, inject } from 'vue'
import { api } from '@/utils/api'
import type { FortuneResponse } from '@/utils/api'
import { hapticFeedback } from '@/utils/telegram'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'
import { useDevMode } from '@/composables/useDevMode'
import { useFortuneState } from '@/composables/useFortuneState'
import { useToast } from '@/composables/useToast'

const navigate = inject<(r: string) => void>('navigate')
const { isDev } = useDevMode()
const { fortuneUsed, markFortuneUsed } = useFortuneState()
const { addToast } = useToast()

const step = ref(1)
const question = ref('')
const charCount = ref(0)
const selectedCategory = ref('')
const selectedSpread = ref(3)
const isLoading = ref(false)
const error = ref('')
const result = ref<FortuneResponse | null>(null)
const flipped = ref(new Set<number>())
const openAccordions = ref(new Set<number>())
const msgIdx = ref(0)
const progress = ref(0)
const isSaving = ref(false)
const savedToDiary = ref(false)

const categories = [
  { value: 'love',   label: 'Любовь',   emoji: '💕' },
  { value: 'money',  label: 'Деньги',   emoji: '💰' },
  { value: 'work',   label: 'Работа',   emoji: '💼' },
  { value: 'life',   label: 'Ситуация', emoji: '🎯' },
  { value: 'health', label: 'Здоровье', emoji: '🌿' },
]

const spreads = [
  { count: 3, desc: 'Прошлое · Настоящее · Будущее' },
  { count: 5, desc: 'Детальный анализ ситуации' },
  { count: 7, desc: 'Полный расклад судьбы' },
]

const loadingMessages = [
  'Соединяемся с энергиями...',
  'Перемешиваем карты...',
  'Читаем знаки...',
  'Формируем ответ...',
]

const flipCard = (i: number) => { flipped.value = new Set([...flipped.value, i]) }
const toggleAccordion = (i: number) => {
  const s = new Set(openAccordions.value)
  s.has(i) ? s.delete(i) : s.add(i)
  openAccordions.value = s
}
const posLabel = (p: string) => ({ PAST: 'Прошлое', PRESENT: 'Настоящее', FUTURE: 'Будущее' }[p] ?? p)
const posIcon  = (p: string) => ({ PAST: '🌑', PRESENT: '🌕', FUTURE: '⭐' }[p] ?? '🔮')

const startFortune = async () => {
  step.value = 3
  error.value = ''
  progress.value = 0
  msgIdx.value = 0

  // Animate progress
  const interval = setInterval(() => {
    msgIdx.value = (msgIdx.value + 1) % loadingMessages.length
    progress.value = Math.min(progress.value + 25, 90)
  }, 900)

  try {
    const res = await api.getFortune(question.value, selectedCategory.value || undefined)
    result.value = res.data
    markFortuneUsed()
    progress.value = 100
    setTimeout(() => { step.value = 4 }, 400)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось получить расклад. Попробуйте снова.'
    step.value = 2
  } finally {
    clearInterval(interval)
  }
}

const saveToDiary = async () => {
  if (!result.value?.id || isSaving.value || savedToDiary.value) return
  isSaving.value = true
  try {
    await api.saveDiaryEntry({ featureType: 'THREE_CARD', referenceId: result.value.id })
    hapticFeedback.success()
    savedToDiary.value = true
  } catch {
    hapticFeedback.error?.()
  } finally {
    isSaving.value = false
  }
}

function handleSpreadSelect(count: number) {
  if (count !== 3) return
  if (fortuneUsed.value && !isDev.value) {
    addToast('Оплата скоро будет доступна 🔮', 'info')
    return
  }
  selectedSpread.value = count
}

const resetFortune = () => {
  step.value = 1
  question.value = ''
  charCount.value = 0
  result.value = null
  flipped.value = new Set()
  openAccordions.value = new Set()
  savedToDiary.value = false
}
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 100px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.back-btn {
  width: 36px; height: 36px;
  border-radius: 12px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: #F5ECFF;
}
.header-title { font-size: 18px; }

.step-indicator {
  display: flex; gap: 6px; margin-bottom: 18px;
}
.step-item {
  flex: 1; height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px; overflow: hidden; position: relative;
}
.step-item.done::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  animation: fill-bar 0.5s ease;
}

.social-proof {
  font-size: 12px;
  color: rgba(255,255,255,0.5);
  text-align: center;
  margin-bottom: 16px;
}

/* Question textarea */
.question-area {
  padding: 16px;
  margin-bottom: 14px;
}
.question-area textarea {
  width: 100%; min-height: 110px;
  background: transparent;
  border: none; outline: none;
  color: #F5ECFF;
  font-family: 'Manrope', sans-serif;
  font-size: 15px; line-height: 1.5;
  resize: none;
}
.question-area textarea::placeholder { color: rgba(255,255,255,0.4); }
.char-count { font-size: 11px; color: rgba(255,255,255,0.4); text-align: right; margin-top: 6px; }

/* Spread */
.spread-options { display: flex; flex-direction: column; gap: 10px; }
.spread-card {
  padding: 16px 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  display: flex; align-items: center; gap: 14px;
  cursor: pointer; transition: all 0.2s;
  position: relative;
}
.spread-card.selected {
  background: linear-gradient(135deg, rgba(182,84,255,0.2), rgba(233,74,168,0.1));
  border-color: rgba(182,84,255,0.5);
}
.spread-icon-wrap {
  width: 54px; height: 44px;
  position: relative; flex-shrink: 0;
  overflow: hidden;
}
.mini-card-spread {
  position: absolute;
  width: 18px; height: 28px;
  top: 8px;
  background: linear-gradient(135deg, #3a1b6e, #1a0b2e);
  border-radius: 3px;
  border: 0.5px solid rgba(255,200,87,0.4);
}
.spread-info { flex: 1; }
.spread-title { font-size: 17px; margin-bottom: 2px; }
.spread-desc  { font-size: 12px; color: rgba(255,255,255,.55); }
.spread-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
.spread-price { font-size: 14px; font-weight: 700; }
.spread-card--locked { opacity: 0.6; cursor: default; }

/* Fortune button */
.fortune-btn {
  width: 100%; padding: 16px; border-radius: 16px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; font-size: 15px; font-weight: 600;
  font-family: 'Manrope', sans-serif; border: none; cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,0.4);
}
.fortune-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.fortune-btn-sec {
  width: 100%; padding: 14px; border-radius: 16px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #F5ECFF; font-size: 15px; font-weight: 600;
  font-family: 'Manrope', sans-serif; cursor: pointer;
}

/* AI Loader */
.ai-orb { position: relative; width: 100px; height: 100px; }
.orb-core {
  position: absolute; inset: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, #b654ff, #e94aa8);
  box-shadow: 0 0 40px rgba(182,84,255,0.6);
}
.orb-ring {
  position: absolute; border-radius: 50%;
  border: 1px solid rgba(182,84,255,0.4);
  animation: center-ring 2.5s ease-out infinite;
}
.orb-ring.r1 { inset: 10px; animation-delay: 0s; }
.orb-ring.r2 { inset: 0; animation-delay: 0.8s; }

.progress-bar-wrap {
  width: 200px; height: 3px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px; overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  border-radius: 3px;
  transition: width 0.4s ease;
}

/* Result cards */
.result-cards {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 0 0 10px;
  flex-wrap: wrap;
}
.result-card-wrap { display: flex; flex-direction: column; align-items: center; gap: 6px; }
.result-card {
  width: 90px; height: 135px;
  border-radius: 12px; overflow: hidden;
  position: relative; cursor: pointer;
  box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,200,87,0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

/* 7-card spread: smaller cards so they fit in 2 rows without icon/text overlap */
.cards-7 { gap: 6px 8px; margin-bottom: 16px; }
.cards-7 .result-card { width: 78px; height: 116px; }
.cards-7 .res-emoji { font-size: 22px; }
.cards-7 .res-name  { font-size: 8px; }
.cards-7 .position-label { font-size: 8px; }
.result-card:active { transform: scale(0.96); }
.res-face {
  position: absolute; inset: 0; border-radius: 12px; opacity: 0;
  transition: opacity 0.45s ease;
}
.result-card:not(.flipped) .res-back  { opacity: 1; }
.result-card.flipped      .res-front { opacity: 1; }
.res-back {
  background: linear-gradient(135deg, #3a1b6e, #1a0b2e);
  display: flex; align-items: center; justify-content: center;
}
.res-back-border {
  position: absolute; inset: 5px;
  border: 1px solid rgba(255,200,87,0.4); border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
}
.res-back-border svg { width: 55%; }
.res-front {
  background: linear-gradient(160deg, #4a1d7e, #2a0e4e, #1a0529);
  display: flex; flex-direction: column;
  align-items: center; justify-content: space-around;
  padding: 10px 4px;
  border: 1px solid rgba(255,200,87,0.3);
}
.res-emoji { font-size: 28px; }
.res-name  { font-size: 9px; text-align: center; color: rgba(255,255,255,.9); line-height: 1.2; padding: 0 3px; }

.position-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: .1em;
  font-weight: 700; text-align: center;
}
.pos-label--past    { color: #b39ddb; }
.pos-label--present { color: #ffc857; }
.pos-label--future  { color: #70e0a8; }

/* Flip hint */
.flip-hint {
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,.35);
  margin-bottom: 18px;
  letter-spacing: .02em;
}

/* Question pill */
.question-pill {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.09);
  border-radius: 14px;
  margin-bottom: 18px;
  font-size: 13px;
  color: rgba(255,255,255,.75);
  line-height: 1.5;
}
.question-pill-icon { font-size: 15px; flex-shrink: 0; margin-top: 1px; }

/* Per-card sections */
.card-section {
  border-radius: 18px;
  padding: 18px 16px 14px;
  margin-bottom: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-left-width: 3px;
}
.card-section--past    { border-left-color: #b39ddb; }
.card-section--present { border-left-color: #ffc857; }
.card-section--future  { border-left-color: #70e0a8; }

.cs-pos-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 10px;
}
.cs-pos-icon { font-size: 14px; line-height: 1; }
.cs-pos-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .12em;
}
.card-section--past    .cs-pos-label { color: #b39ddb; }
.card-section--present .cs-pos-label { color: #ffc857; }
.card-section--future  .cs-pos-label { color: #70e0a8; }

.cs-pos-line {
  flex: 1;
  height: 1px;
  background: rgba(255,255,255,0.06);
}

.cs-name {
  font-size: 20px;
  color: #F5ECFF;
  margin-bottom: 10px;
  line-height: 1.2;
}

.cs-interpretation {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255,255,255,.8);
  margin-bottom: 14px;
}

.cs-meaning-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 12px;
  border-radius: 10px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  color: rgba(255,255,255,.55);
  font-size: 12px;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
}
.cs-toggle-icon {
  display: inline-block;
  transition: transform 0.25s ease;
  font-size: 16px;
  line-height: 1;
  transform: rotate(90deg);
}
.cs-toggle-icon.open { transform: rotate(270deg); }

.cs-meaning-body {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,.6);
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,.07);
}

/* General summary */
.summary-block {
  border-radius: 18px;
  padding: 18px 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(182,84,255,0.08), rgba(233,74,168,0.04));
  border: 1px solid rgba(182,84,255,0.2);
}
.summary-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: #b654ff;
  font-weight: 700;
  margin-bottom: 10px;
}
.summary-body {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255,255,255,.8);
}

/* Actions */
.actions-row {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.actions-row .fortune-btn     { flex: 2; }
.actions-row .fortune-btn-sec { flex: 1; }

.success-banner {
  padding: 10px 14px;
  background: linear-gradient(135deg, rgba(112,224,168,0.15), rgba(71,184,150,0.08));
  border: 1px solid rgba(112,224,168,0.3);
  border-radius: 12px;
  display: flex; align-items: center; gap: 10px;
  margin-bottom: 14px;
}
.success-icon {
  width: 24px; height: 24px; border-radius: 50%;
  background: linear-gradient(135deg, #70e0a8, #47b896);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #0a3a2a; font-weight: 700; flex-shrink: 0;
}
.success-text { font-size: 13px; color: rgba(255,255,255,.8); }
.success-text strong { color: #70e0a8; }

.error-msg { color: #ff6b6b; font-size: 13px; text-align: center; margin-top: 16px; }
</style>

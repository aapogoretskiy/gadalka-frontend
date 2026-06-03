<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- ══ Step 1: Вопрос ══════════════════════════════════════════════ -->
      <template v-if="step === 1">
        <div class="header-bar">
          <div style="width:36px"></div>
          <div class="header-title serif">Оракул</div>
          <div style="width:36px"></div>
        </div>

        <div class="step-indicator">
          <div class="step-item current"></div>
          <div class="step-item"></div>
          <div class="step-item"></div>
        </div>

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

      <!-- ══ Step 2: Выбор расклада ══════════════════════════════════════ -->
      <template v-if="step === 2">
        <div class="header-bar">
          <div style="width:36px"></div>
          <div class="header-title serif">Выберите расклад</div>
          <div style="width:36px"></div>
        </div>

        <div class="step-indicator">
          <div class="step-item done"></div>
          <div class="step-item current"></div>
          <div class="step-item"></div>
        </div>

        <div class="spread-options">
          <div
            v-for="s in spreads" :key="s.type"
            class="spread-card haptic"
            :class="{ selected: selectedSpread === s.type, 'spread-card--locked': !isDev && (balance ?? 0) < s.cost }"
            @click="handleSpreadSelect(s.type, s.cost)"
          >
            <div class="spread-icon-wrap">
              <div v-for="i in s.cardCount" :key="i" class="mini-card-spread"
                :style="`left:${(i-1)*Math.min(10,36/Math.max(s.cardCount-1,1))}px;transform:rotate(${(i-Math.ceil(s.cardCount/2))*(s.cardCount>5?5:8)}deg)`"></div>
            </div>
            <div class="spread-info">
              <div class="spread-title serif">{{ s.name }}</div>
              <div class="spread-desc">{{ s.desc }}</div>
            </div>
            <div class="spread-right">
              <template v-if="isDev || (balance ?? 0) >= s.cost">
                <div class="spread-price" style="color:#70e0a8">
                  {{ s.cost }} {{ s.cost === 1 ? 'знак' : s.cost < 5 ? 'знака' : 'знаков' }}
                </div>
              </template>
              <template v-else>
                <div class="spread-price" style="color:#ffc857">Купить →</div>
              </template>
            </div>
          </div>
        </div>

        <div v-if="!hasCredits && !isDev" class="no-credits-block">
          <p>У вас закончились гадания</p>
          <button class="fortune-btn haptic" style="margin-top:12px" @click="navigate('payment')">
            🔮 Пополнить баланс
          </button>
        </div>

        <button v-else class="fortune-btn haptic" style="margin-top:20px" @click="startFortune">
          Перейти к раскладу →
        </button>
      </template>

      <!-- ══ Step 3: Загрузка ════════════════════════════════════════════ -->
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

      <!-- ══ Step 4: Анимация веера + расклад карт ══════════════════════ -->
      <template v-if="step === 4 && result">
        <div class="header-bar">
          <div style="width:36px"></div>
          <div class="header-title serif">Ваш расклад</div>
          <div style="width:36px"></div>
        </div>

        <div class="question-pill">
          <span class="question-pill-icon">💬</span>
          <span>"{{ question }}"</span>
        </div>

        <!-- Плавный переход между веером и раскладом -->
        <transition name="phase-fade" mode="out-in">

          <!-- ── Фаза веера ───────────────────────────────────────────── -->
          <div v-if="dealPhase === 'fan'" key="fan" class="fan-wrap">
            <div class="fan-stage">
              <div
                v-for="i in FAN_CARD_COUNT"
                :key="i"
                class="fan-card-item"
                :style="fanStyle(i - 1, FAN_CARD_COUNT)"
              >
                <div class="fan-card-body" :style="{ animationDelay: `${(i - 1) * 110}ms` }">
                  <div class="fan-card-face">
                    <svg viewBox="0 0 40 56" fill="none" opacity="0.75">
                      <rect x="2" y="2" width="36" height="52" rx="3" stroke="#ffc857" stroke-width="0.8"/>
                      <circle cx="20" cy="28" r="10" stroke="#ffc857" stroke-width="0.8"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <p class="fan-hint">✦ Карты перемешиваются...</p>
          </div>

          <!-- ── Фаза расклада ──────────────────────────────────────── -->
          <div v-else key="spread" class="spread-phase">

            <!-- Success banner -->
            <div class="success-banner">
              <div class="success-icon">✓</div>
              <div class="success-text">Расклад готов · <strong>{{ result.username }}</strong></div>
            </div>

            <!-- ─── THREE CARD ──────────────────────────────────────── -->
            <div v-if="result.spreadType === 'THREE_CARD'" class="result-cards cards-3">
              <div
                v-for="(card, i) in result.cards" :key="card.id"
                class="result-card-wrap"
                :class="{ 'card-visible': visibleCards.has(i), 'card-tappable': flipped.has(i) }"
                @click="handleCardTap(card, i)"
              >
                <div class="result-card" :class="{ flipped: flipped.has(i) }">
                  <div class="res-face res-back"><div class="res-back-border"><svg viewBox="0 0 40 56" fill="none" opacity="0.8"><rect x="2" y="2" width="36" height="52" rx="3" stroke="#ffc857" stroke-width="0.8"/><circle cx="20" cy="28" r="10" stroke="#ffc857" stroke-width="0.8"/></svg></div></div>
                  <div class="res-face res-front"><img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" class="res-image" /><template v-else><div class="res-emoji">{{ posIcon(card.cardPosition) }}</div><div class="res-name serif">{{ card.name }}</div></template></div>
                </div>
                <div class="position-label" :class="`pos-label--${card.cardPosition.toLowerCase()}`">{{ posLabel(card.cardPosition) }}</div>
              </div>
            </div>

            <!-- ─── HORSESHOE ───────────────────────────────────────── -->
            <div v-else-if="result.spreadType === 'HORSESHOE'" class="hs-spread">
              <div
                v-for="(card, i) in result.cards" :key="card.id"
                class="hs-slot"
                :class="{ 'card-visible': visibleCards.has(i), 'card-tappable': flipped.has(i) }"
                :style="`left:${HORSESHOE_POS[i].x}px;top:${HORSESHOE_POS[i].y}px`"
                @click="handleCardTap(card, i)"
              >
                <div class="result-card hs-card" :class="{ flipped: flipped.has(i) }">
                  <div class="res-face res-back"><div class="res-back-border"><svg viewBox="0 0 40 56" fill="none" opacity="0.8"><rect x="2" y="2" width="36" height="52" rx="3" stroke="#ffc857" stroke-width="0.8"/><circle cx="20" cy="28" r="10" stroke="#ffc857" stroke-width="0.8"/></svg></div></div>
                  <div class="res-face res-front"><img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" class="res-image" /><template v-else><div class="res-emoji">{{ posIcon(card.cardPosition) }}</div><div class="res-name serif">{{ card.name }}</div></template></div>
                </div>
                <div class="hs-label" :class="`pos-label--${card.cardPosition.toLowerCase()}`">{{ posLabel(card.cardPosition) }}</div>
              </div>
            </div>

            <!-- ─── CELTIC CROSS ────────────────────────────────────── -->
            <!-- Карта 1 ("Что мешает") теперь НЕ перекрывает карту 0,  -->
            <!-- а располагается отдельно ниже центра                    -->
            <div v-else-if="result.spreadType === 'CELTIC_CROSS'" class="cc-spread">
              <!-- Крест (карты 1–6) -->
              <div class="cc-cross">
                <div
                  v-for="(card, i) in result.cards.slice(0, 6)" :key="card.id"
                  class="cc-slot"
                  :class="{ 'card-visible': visibleCards.has(i), 'card-tappable': flipped.has(i) }"
                  :style="`left:${CELTIC_CROSS_POS[i].x}px;top:${CELTIC_CROSS_POS[i].y}px`"
                  @click="handleCardTap(card, i)"
                >
                  <div class="result-card cc-card" :class="{ flipped: flipped.has(i) }">
                    <div class="res-face res-back"><div class="res-back-border"><svg viewBox="0 0 40 56" fill="none" opacity="0.8"><rect x="2" y="2" width="36" height="52" rx="3" stroke="#ffc857" stroke-width="0.8"/><circle cx="20" cy="28" r="10" stroke="#ffc857" stroke-width="0.8"/></svg></div></div>
                    <div class="res-face res-front"><img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" class="res-image" /><template v-else><div class="res-emoji">{{ posIcon(card.cardPosition) }}</div><div class="res-name serif">{{ card.name }}</div></template></div>
                  </div>
                  <div class="cc-label" :class="`pos-label--${card.cardPosition.toLowerCase()}`">{{ posLabel(card.cardPosition) }}</div>
                </div>
              </div>
              <!-- Посох (карты 7–10) -->
              <div class="cc-staff">
                <div
                  v-for="(card, i) in result.cards.slice(6)" :key="card.id"
                  class="cc-staff-slot"
                  :class="{ 'card-visible': visibleCards.has(i + 6), 'card-tappable': flipped.has(i + 6) }"
                  @click="handleCardTap(card, i + 6)"
                >
                  <div class="result-card cc-card" :class="{ flipped: flipped.has(i + 6) }">
                    <div class="res-face res-back"><div class="res-back-border"><svg viewBox="0 0 40 56" fill="none" opacity="0.8"><rect x="2" y="2" width="36" height="52" rx="3" stroke="#ffc857" stroke-width="0.8"/><circle cx="20" cy="28" r="10" stroke="#ffc857" stroke-width="0.8"/></svg></div></div>
                    <div class="res-face res-front"><img v-if="card.imageUrl" :src="card.imageUrl" :alt="card.name" class="res-image" /><template v-else><div class="res-emoji">{{ posIcon(card.cardPosition) }}</div><div class="res-name serif">{{ card.name }}</div></template></div>
                  </div>
                  <div class="cc-label" :class="`pos-label--${card.cardPosition.toLowerCase()}`">{{ posLabel(card.cardPosition) }}</div>
                </div>
              </div>
            </div>

            <!-- Кнопка пояснения — появляется после переворота всех карт -->
            <transition name="btn-rise">
              <div v-if="dealPhase === 'done'" class="explain-btn-wrap">
                <button class="explain-btn haptic" @click="step = 5">
                  ✦ Получить пояснение
                </button>
              </div>
            </transition>

          </div>
        </transition>
      </template>

      <!-- ══ Step 5: Пояснения к раскладу ═══════════════════════════════ -->
      <template v-if="step === 5 && result">
        <div class="header-bar">
          <div style="width:36px"></div>
          <div class="header-title serif">Пояснение</div>
          <div style="width:36px"></div>
        </div>

        <!-- Question display -->
        <div class="question-pill">
          <span class="question-pill-icon">💬</span>
          <span>"{{ question }}"</span>
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

        <!-- Actions -->
        <div class="actions-row">
          <button class="fortune-btn haptic" @click="resetFortune">Новый вопрос</button>
          <button class="fortune-btn-sec haptic" @click="navigate('profile')">В профиль</button>
        </div>
      </template>

      <!-- Error -->
      <div v-if="error" class="error-msg">{{ error }}</div>

    </div>

    <!-- ══ Модал детали карты: Teleport внутри root-div,
         чтобы компонент оставался single-root и Transition в App.vue работал корректно ════════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-fade">
        <div v-if="selectedCard" class="card-modal-overlay" @click="closeCardModal">
          <div class="card-modal-content" @click.stop>
          <div class="card-modal-image-wrap">
            <img
              v-if="selectedCard.imageUrl"
              :src="selectedCard.imageUrl"
              :alt="selectedCard.name"
              class="card-modal-image"
            />
            <div v-else class="card-modal-placeholder">
              <span class="card-modal-placeholder-emoji">{{ posIcon(selectedCard.cardPosition) }}</span>
            </div>
          </div>
          <div class="card-modal-position" :class="`pos-label--${selectedCard.cardPosition.toLowerCase()}`">
            {{ posLabel(selectedCard.cardPosition) }}
          </div>
          <div class="card-modal-name serif">{{ selectedCard.name }}</div>
          <button class="card-modal-close haptic" @click="closeCardModal">✕</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, inject, watch } from 'vue'
import { api } from '@/utils/api'
import type { FortuneResponse, SpreadType } from '@/utils/api'
import { hapticFeedback } from '@/utils/telegram'
import { useDevMode } from '@/composables/useDevMode'
import { useBalance } from '@/composables/useBalance'
import { useToast } from '@/composables/useToast'

const navigate = inject<(r: string) => void>('navigate')
const setBackOverride = inject<(fn: (() => void) | null) => void>('setBackOverride')
const { isDev } = useDevMode()
const { balance, hasCredits, refreshBalance } = useBalance()
const { addToast } = useToast()

// ── Модал детали карты ───────────────────────────────────────────────────────
const selectedCard = ref<{ imageUrl: string | null; name: string; cardPosition: string } | null>(null)
const openCardModal = (card: { imageUrl: string | null; name: string; cardPosition: string }) => {
  selectedCard.value = card
  hapticFeedback('light')
}
const closeCardModal = () => { selectedCard.value = null }

const handleCardTap = (card: { imageUrl: string | null; name: string; cardPosition: string }, index: number) => {
  if (!flipped.value.has(index)) return
  openCardModal(card)
}

// ── Основное состояние ───────────────────────────────────────────────────────
const step             = ref(1)
const question         = ref('')
const charCount        = ref(0)
const selectedCategory = ref('')
const selectedSpread   = ref<SpreadType>('THREE_CARD')
const error            = ref('')
const result           = ref<FortuneResponse | null>(null)
const flipped          = ref(new Set<number>())
const openAccordions   = ref(new Set<number>())
const msgIdx           = ref(0)
const progress         = ref(0)

// ── Анимация ─────────────────────────────────────────────────────────────────
const FAN_CARD_COUNT = 7
const dealPhase      = ref<'fan' | 'placing' | 'flipping' | 'done'>('fan')
const visibleCards   = ref(new Set<number>())
const animationDone  = ref(false)

// ── Данные ───────────────────────────────────────────────────────────────────
const categories = [
  { value: 'love',   label: 'Любовь',   emoji: '💕' },
  { value: 'money',  label: 'Деньги',   emoji: '💰' },
  { value: 'work',   label: 'Работа',   emoji: '💼' },
  { value: 'life',   label: 'Ситуация', emoji: '🎯' },
  { value: 'health', label: 'Здоровье', emoji: '🌿' },
]

const spreads: { type: SpreadType; name: string; cardCount: number; desc: string; cost: number }[] = [
  { type: 'THREE_CARD',   name: 'Три карты',      cardCount: 3,  desc: 'Прошлое · Настоящее · Будущее', cost: 1 },
  { type: 'HORSESHOE',    name: 'Подкова',         cardCount: 7,  desc: 'Углублённый анализ ситуации',   cost: 2 },
  { type: 'CELTIC_CROSS', name: 'Кельтский крест', cardCount: 10, desc: 'Полный расклад судьбы',         cost: 3 },
]

// Подкова: контейнер 350×278px, карта 50×75px
// Шаг 50px (карта 50px → нулевой горизонтальный зазор, как и раньше)
// y-дуга заметно глубже: нижние карты на y=172, верхняя на y=28
const HORSESHOE_POS = [
  { x: 0,   y: 172 }, // 1: Прошлое      (левый низ)
  { x: 50,  y: 92  }, // 2: Настоящее    (левый средний)
  { x: 100, y: 44  }, // 3: Скрытые      (левый верх)
  { x: 150, y: 28  }, // 4: Препятствия  (вершина)
  { x: 200, y: 44  }, // 5: Внешние      (правый верх)
  { x: 250, y: 92  }, // 6: Совет        (правый средний)
  { x: 300, y: 172 }, // 7: Итог         (правый низ)
]

// Кельтский крест: контейнер 290×520px, карта 68×102px
// Зазор между картами ~28px — достаточно для двустрочных подписей
// Карта 1 ("Что мешает") по-прежнему отдельно ниже центра
const CELTIC_CROSS_POS = [
  { x: 111, y: 130 }, // 0: Суть вопроса       (центр)
  { x: 111, y: 260 }, // 1: Что мешает         (ниже центра, зазор 28px)
  { x: 111, y: 390 }, // 2: Основа             (снизу, зазор 28px)
  { x: 28,  y: 130 }, // 3: Прошлое            (слева)
  { x: 111, y: 0   }, // 4: Возможное будущее  (вверху, зазор 28px до центра)
  { x: 194, y: 130 }, // 5: Ближайшее будущее  (справа)
]

const positionLabels: Record<string, string> = {
  // Три карты
  PAST:                   'Прошлое',
  PRESENT:                'Настоящее',
  FUTURE:                 'Будущее',
  // Подкова
  HORSESHOE_PAST:         'Прошлое',
  HORSESHOE_PRESENT:      'Настоящее',
  HORSESHOE_HIDDEN:       'Скрытые влияния',
  HORSESHOE_OBSTACLES:    'Препятствия',
  HORSESHOE_EXTERNAL:     'Внешние влияния',
  HORSESHOE_ADVICE:       'Совет',
  HORSESHOE_OUTCOME:      'Итог',
  // Кельтский крест
  CELTIC_HEART:           'Суть вопроса',
  CELTIC_CROSS:           'Что мешает',
  CELTIC_FOUNDATION:      'Основа',
  CELTIC_PAST:            'Прошлое',
  CELTIC_POSSIBLE_FUTURE: 'Возможное будущее',
  CELTIC_NEAR_FUTURE:     'Ближайшее будущее',
  CELTIC_SELF:            'Ваша позиция',
  CELTIC_EXTERNAL:        'Внешние влияния',
  CELTIC_HOPES_FEARS:     'Надежды и страхи',
  CELTIC_OUTCOME:         'Итог',
}

const positionIcons: Record<string, string> = {
  PAST:                   '🌑',
  PRESENT:                '🌕',
  FUTURE:                 '⭐',
  HORSESHOE_PAST:         '🌑',
  HORSESHOE_PRESENT:      '🌕',
  HORSESHOE_HIDDEN:       '🔮',
  HORSESHOE_OBSTACLES:    '⛰️',
  HORSESHOE_EXTERNAL:     '🌊',
  HORSESHOE_ADVICE:       '🕊️',
  HORSESHOE_OUTCOME:      '✨',
  CELTIC_HEART:           '💫',
  CELTIC_CROSS:           '⚡',
  CELTIC_FOUNDATION:      '🏛️',
  CELTIC_PAST:            '🌑',
  CELTIC_POSSIBLE_FUTURE: '🌠',
  CELTIC_NEAR_FUTURE:     '⭐',
  CELTIC_SELF:            '🪞',
  CELTIC_EXTERNAL:        '🌊',
  CELTIC_HOPES_FEARS:     '🌓',
  CELTIC_OUTCOME:         '✨',
}

const loadingMessages = [
  'Соединяемся с энергиями...',
  'Перемешиваем карты...',
  'Читаем знаки...',
  'Формируем ответ...',
]

// ── Стиль карты в веере ──────────────────────────────────────────────────────
// Каждая карта поворачивается вокруг нижней точки (transform-origin: 50% 100%)
const fanStyle = (index: number, total: number): Record<string, string> => {
  const spreadDeg = Math.min(82, total * 14)
  const startAngle = -spreadDeg / 2
  const angleStep = total > 1 ? spreadDeg / (total - 1) : 0
  const angle = startAngle + angleStep * index
  return {
    transform: `rotate(${angle}deg)`,
    zIndex: String(index + 1),
  }
}

// ── Анимация раскладки ───────────────────────────────────────────────────────
const startAnimation = async () => {
  if (animationDone.value || !result.value) return
  dealPhase.value = 'fan'
  const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms))

  // Показываем веер 1.8 секунды
  await delay(1800)

  // Карты появляются на позициях по одной
  dealPhase.value = 'placing'
  const cardCount = result.value.cards.length
  for (let i = 0; i < cardCount; i++) {
    await delay(i === 0 ? 200 : 380)
    visibleCards.value = new Set([...visibleCards.value, i])
  }

  // Пауза перед переворотом
  await delay(380)
  dealPhase.value = 'flipping'

  // Карты переворачиваются по одной
  for (let i = 0; i < cardCount; i++) {
    await delay(i === 0 ? 200 : 480)
    flipped.value = new Set([...flipped.value, i])
  }

  // Появляется кнопка «Получить пояснение»
  await delay(600)
  dealPhase.value = 'done'
  animationDone.value = true
}

// ── Back-кнопка Telegram ─────────────────────────────────────────────────────
watch(step, (s) => {
  // Закрываем модал при любом переходе между шагами
  closeCardModal()

  if (s === 2) {
    setBackOverride?.(() => { step.value = 1 })
  } else if (s === 4) {
    // Назад со step 4 — сбросить всё и вернуться на шаг 1
    setBackOverride?.(() => { resetFortune() })
    // Запускаем анимацию только один раз
    if (result.value && !animationDone.value) {
      startAnimation()
    }
  } else if (s === 5) {
    // Назад со step 5 — вернуться к раскладу (без повтора анимации)
    setBackOverride?.(() => { step.value = 4 })
  } else {
    setBackOverride?.(null)
  }
})

// ── Функции ──────────────────────────────────────────────────────────────────
const toggleAccordion = (i: number) => {
  const s = new Set(openAccordions.value)
  s.has(i) ? s.delete(i) : s.add(i)
  openAccordions.value = s
}

const posLabel = (p: string) => positionLabels[p] ?? p
const posIcon  = (p: string) => positionIcons[p] ?? '🔮'

const startFortune = async () => {
  step.value = 3
  error.value = ''
  progress.value = 0
  msgIdx.value = 0

  const interval = setInterval(() => {
    msgIdx.value = (msgIdx.value + 1) % loadingMessages.length
    progress.value = Math.min(progress.value + 25, 90)
  }, 900)

  try {
    const res = await api.getFortune(question.value, selectedCategory.value || undefined, selectedSpread.value)
    result.value = res.data
    await refreshBalance()
    progress.value = 100
    // step → 4 запускает watcher, который вызовет startAnimation()
    setTimeout(() => { step.value = 4 }, 400)
  } catch (e: any) {
    error.value = e.response?.data?.message || 'Не удалось получить расклад. Попробуйте снова.'
    step.value = 2
  } finally {
    clearInterval(interval)
  }
}

function handleSpreadSelect(type: SpreadType, cost: number) {
  if (!isDev.value && (balance.value ?? 0) < cost) {
    navigate?.('payment')
    return
  }
  selectedSpread.value = type
}

const resetFortune = () => {
  step.value        = 1
  question.value    = ''
  charCount.value   = 0
  selectedSpread.value = 'THREE_CARD'
  result.value      = null
  flipped.value     = new Set()
  openAccordions.value = new Set()
  error.value       = ''
  // Сбрасываем анимацию
  dealPhase.value   = 'fan'
  visibleCards.value = new Set()
  animationDone.value = false
}
</script>

<style scoped>
.screen-wrap { min-height: var(--tg-viewport-stable-height, 100vh); padding-bottom: calc(100px + var(--tg-safe-area-inset-bottom, 0px)); overflow-y: auto; }
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px; }

.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-title { font-size: 18px; text-align: center; }

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
  /* нет анимации — полоса уже заполнена статично */
}
.step-item.current::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  animation: fill-bar 0.5s ease;
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

/* Spread selector */
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

/* ══ Анимация перехода фаза-фаза ═══════════════════════════════════════════ */
.phase-fade-enter-active,
.phase-fade-leave-active {
  transition: opacity 0.45s ease;
}
.phase-fade-enter-from,
.phase-fade-leave-to {
  opacity: 0;
}

/* ══ Веер карт ══════════════════════════════════════════════════════════════ */
.fan-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 36px 0 28px;
  gap: 36px;
}

.fan-stage {
  position: relative;
  width: 220px;
  height: 190px;
  /* Карты выровнены по нижнему краю и вращаются вокруг нижней точки */
}

.fan-card-item {
  position: absolute;
  bottom: 0;
  left: 50%;
  margin-left: -30px;   /* центрирование: половина ширины карты 60px */
  width: 60px;
  height: 90px;
  transform-origin: 50% 100%; /* вращение вокруг нижнего центра */
}

.fan-card-body {
  width: 100%;
  height: 100%;
  border-radius: 10px;
  background: linear-gradient(160deg, #3d1a72, #1e0b35);
  border: 1px solid rgba(255, 200, 87, 0.35);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.5), 0 2px 8px rgba(182,84,255,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  /* Анимация парения — на дочернем элементе, чтобы не конфликтовать с rotate родителя */
  animation: fan-float 1.9s ease-in-out infinite;
}

.fan-card-face {
  position: absolute;
  inset: 6px;
  border: 1px solid rgba(255, 200, 87, 0.4);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fan-card-face svg { width: 55%; }

@keyframes fan-float {
  0%, 100% { transform: translateY(0px);  }
  50%       { transform: translateY(-5px); }
}

.fan-hint {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  text-align: center;
  letter-spacing: 0.06em;
  animation: hint-pulse 1.7s ease-in-out infinite;
}

@keyframes hint-pulse {
  0%, 100% { opacity: 0.45; }
  50%       { opacity: 0.9;  }
}

/* ══ Расклад — обёртка ══════════════════════════════════════════════════════ */
.spread-phase { width: 100%; }

/* ══ Анимация появления карт ════════════════════════════════════════════════ */

/* Три карты: fade + slide up */
.result-card-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transform: translateY(18px) scale(0.9);
  transition: opacity 0.4s ease, transform 0.4s ease;
}
.result-card-wrap.card-visible {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* Подкова: слоты с абсолютной позицией */
.hs-slot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: scale(0.82);
  transition: opacity 0.38s ease, transform 0.38s ease;
}
.hs-slot.card-visible {
  opacity: 1;
  transform: scale(1);
}

/* Кельтский крест: слоты с абсолютной позицией */
.cc-slot {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  overflow: visible;
  opacity: 0;
  transform: scale(0.82);
  transition: opacity 0.38s ease, transform 0.38s ease;
}
.cc-slot.card-visible {
  opacity: 1;
  transform: scale(1);
}

/* Посох: горизонтальные слоты */
.cc-staff-slot {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transform: scale(0.82);
  transition: opacity 0.38s ease, transform 0.38s ease;
}
.cc-staff-slot.card-visible {
  opacity: 1;
  transform: scale(1);
}

/* ══ Кнопка «Получить пояснение» ════════════════════════════════════════════ */
.explain-btn-wrap {
  margin: 22px 0 6px;
}

.explain-btn {
  width: 100%;
  padding: 17px;
  border-radius: 16px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  font-family: 'Manrope', sans-serif;
  border: none;
  cursor: pointer;
  letter-spacing: 0.04em;
  animation: explain-glow 2.3s ease-in-out infinite;
}

@keyframes explain-glow {
  0%, 100% { box-shadow: 0 8px 28px rgba(182,84,255,0.5); }
  50%       { box-shadow: 0 8px 48px rgba(182,84,255,0.95), 0 0 28px rgba(233,74,168,0.55); }
}

/* Кнопка вылетает снизу */
.btn-rise-enter-active {
  transition: opacity 0.55s ease, transform 0.5s ease;
}
.btn-rise-enter-from {
  opacity: 0;
  transform: translateY(16px);
}

/* ══ Карты результата ═══════════════════════════════════════════════════════ */
.result-cards {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin: 0 0 10px;
  flex-wrap: wrap;
}

.result-card {
  width: 90px; height: 135px;
  border-radius: 12px; overflow: hidden;
  position: relative;
  box-shadow: 0 8px 24px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,200,87,0.2);
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.cards-7 { gap: 6px 8px; margin-bottom: 16px; }
.cards-7 .result-card { width: 78px; height: 116px; }
.cards-7 .res-emoji { font-size: 22px; }
.cards-7 .res-name  { font-size: 8px; }
.cards-7 .position-label { font-size: 8px; }

.res-face {
  position: absolute; inset: 0; border-radius: 12px; opacity: 0;
  transition: opacity 0.45s ease;
}
.result-card:not(.flipped) .res-back  { opacity: 1; }
.result-card.flipped       .res-front { opacity: 1; }

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
.res-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; display: block; border-radius: inherit; }
/* Когда карта показывает реальную картинку — чёрный фон вместо фиолетового */
.res-front:has(.res-image) {
  background: #000;
  border-color: transparent;
  padding: 0;
}

.position-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: .1em;
  font-weight: 700; text-align: center;
}

/* Три карты */
.pos-label--past    { color: #b39ddb; }
.pos-label--present { color: #ffc857; }
.pos-label--future  { color: #70e0a8; }

/* Подкова */
.pos-label--horseshoe_past      { color: #b39ddb; }
.pos-label--horseshoe_present   { color: #ffc857; }
.pos-label--horseshoe_hidden    { color: #cc88ff; }
.pos-label--horseshoe_obstacles { color: #ff8a65; }
.pos-label--horseshoe_external  { color: #4dd0e1; }
.pos-label--horseshoe_advice    { color: #a5d6a7; }
.pos-label--horseshoe_outcome   { color: #70e0a8; }

/* Кельтский крест */
.pos-label--celtic_heart           { color: #e91e8c; }
.pos-label--celtic_cross           { color: #ff5252; }
.pos-label--celtic_foundation      { color: #b39ddb; }
.pos-label--celtic_past            { color: #9e9e9e; }
.pos-label--celtic_possible_future { color: #ffc857; }
.pos-label--celtic_near_future     { color: #ffeb3b; }
.pos-label--celtic_self            { color: #ce93d8; }
.pos-label--celtic_external        { color: #4dd0e1; }
.pos-label--celtic_hopes_fears     { color: #90caf9; }
.pos-label--celtic_outcome         { color: #70e0a8; }

/* ══ Question pill ══════════════════════════════════════════════════════════ */
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

/* ══ Пояснения (step 5) ═════════════════════════════════════════════════════ */
.card-section {
  border-radius: 18px;
  padding: 18px 16px 14px;
  margin-bottom: 12px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.07);
  border-left-width: 3px;
}

/* Три карты */
.card-section--past    { border-left-color: #b39ddb; }
.card-section--present { border-left-color: #ffc857; }
.card-section--future  { border-left-color: #70e0a8; }

/* Подкова */
.card-section--horseshoe_past      { border-left-color: #b39ddb; }
.card-section--horseshoe_present   { border-left-color: #ffc857; }
.card-section--horseshoe_hidden    { border-left-color: #cc88ff; }
.card-section--horseshoe_obstacles { border-left-color: #ff8a65; }
.card-section--horseshoe_external  { border-left-color: #4dd0e1; }
.card-section--horseshoe_advice    { border-left-color: #a5d6a7; }
.card-section--horseshoe_outcome   { border-left-color: #70e0a8; }

/* Кельтский крест */
.card-section--celtic_heart           { border-left-color: #e91e8c; }
.card-section--celtic_cross           { border-left-color: #ff5252; }
.card-section--celtic_foundation      { border-left-color: #b39ddb; }
.card-section--celtic_past            { border-left-color: #9e9e9e; }
.card-section--celtic_possible_future { border-left-color: #ffc857; }
.card-section--celtic_near_future     { border-left-color: #ffeb3b; }
.card-section--celtic_self            { border-left-color: #ce93d8; }
.card-section--celtic_external        { border-left-color: #4dd0e1; }
.card-section--celtic_hopes_fears     { border-left-color: #90caf9; }
.card-section--celtic_outcome         { border-left-color: #70e0a8; }

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

/* Три карты */
.card-section--past    .cs-pos-label { color: #b39ddb; }
.card-section--present .cs-pos-label { color: #ffc857; }
.card-section--future  .cs-pos-label { color: #70e0a8; }
/* Подкова */
.card-section--horseshoe_past      .cs-pos-label { color: #b39ddb; }
.card-section--horseshoe_present   .cs-pos-label { color: #ffc857; }
.card-section--horseshoe_hidden    .cs-pos-label { color: #cc88ff; }
.card-section--horseshoe_obstacles .cs-pos-label { color: #ff8a65; }
.card-section--horseshoe_external  .cs-pos-label { color: #4dd0e1; }
.card-section--horseshoe_advice    .cs-pos-label { color: #a5d6a7; }
.card-section--horseshoe_outcome   .cs-pos-label { color: #70e0a8; }
/* Кельтский крест */
.card-section--celtic_heart           .cs-pos-label { color: #e91e8c; }
.card-section--celtic_cross           .cs-pos-label { color: #ff5252; }
.card-section--celtic_foundation      .cs-pos-label { color: #b39ddb; }
.card-section--celtic_past            .cs-pos-label { color: #9e9e9e; }
.card-section--celtic_possible_future .cs-pos-label { color: #ffc857; }
.card-section--celtic_near_future     .cs-pos-label { color: #ffeb3b; }
.card-section--celtic_self            .cs-pos-label { color: #ce93d8; }
.card-section--celtic_external        .cs-pos-label { color: #4dd0e1; }
.card-section--celtic_hopes_fears     .cs-pos-label { color: #90caf9; }
.card-section--celtic_outcome         .cs-pos-label { color: #70e0a8; }

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

.no-credits-block {
  margin-top: 20px;
  padding: 18px;
  background: linear-gradient(135deg, rgba(255,200,87,0.08), rgba(233,74,168,0.06));
  border: 1px solid rgba(255,200,87,0.25);
  border-radius: 18px;
  text-align: center;
}
.no-credits-block p {
  font-size: 14px;
  color: rgba(255,255,255,0.7);
  margin: 0 0 4px;
}

/* ══ Подкова ════════════════════════════════════════════════════════════════ */
.hs-spread {
  position: relative;
  width: 350px;
  height: 278px;  /* увеличено: глубже дуга + карты выше */
  margin: 0 auto 12px;
  max-width: 100%;
}
.hs-card {
  width: 50px !important;  /* было 46px */
  height: 75px !important; /* было 70px */
  border-radius: 8px !important;
}
.hs-card .res-emoji  { font-size: 18px !important; }
.hs-card .res-name   { font-size: 7px !important; line-height: 1.2; }
.hs-label {
  font-size: 7px;          /* было 6px */
  text-transform: uppercase;
  letter-spacing: 0.3px;
  text-align: center;
  color: rgba(255,255,255,0.65);
  width: 54px;             /* было 50px */
  line-height: 1.3;
}

/* ══ Кельтский крест ════════════════════════════════════════════════════════ */
/* Карта 1 теперь ниже карты 0, контейнер увеличен по высоте               */
.cc-spread {
  margin: 0 auto 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.cc-cross {
  position: relative;
  width: 290px;
  height: 520px;   /* карта 68×102, зазоры ~28px: 4 карты + 3 зазора + подпись */
  flex-shrink: 0;
}
.cc-card {
  width: 68px !important;
  height: 102px !important;
}
.cc-label {
  font-size: 7.5px;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  text-align: center;
  color: rgba(255,255,255,0.65);
  max-width: 72px;
  line-height: 1.3;
  white-space: normal;
  z-index: 3;
  position: relative;
}
.cc-staff {
  display: flex;
  flex-direction: row;
  justify-content: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.12);
  width: 290px;
}

/* ══ Тапабельные карты ══════════════════════════════════════════════════════ */
.card-tappable {
  cursor: pointer;
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

/* ══ Модал детали карты ═════════════════════════════════════════════════════ */
.card-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
}

.card-modal-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  max-width: 260px;
  width: 100%;
  position: relative;
}

.card-modal-image-wrap {
  width: 190px;
  height: 285px;
  border-radius: 18px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(255, 200, 87, 0.35),
    0 0 40px rgba(182, 84, 255, 0.2);
}

.card-modal-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
  display: block;
  background: #000;
}

.card-modal-placeholder {
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, #4a1d7e, #2a0e4e, #1a0529);
  border: 1px solid rgba(255, 200, 87, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-modal-placeholder-emoji {
  font-size: 64px;
}

.card-modal-position {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.15em;
  font-weight: 700;
}

.card-modal-name {
  font-size: 22px;
  color: #F5ECFF;
  text-align: center;
  line-height: 1.25;
}

.card-modal-close {
  margin-top: 4px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Manrope', sans-serif;
}

/* Анимация появления/исчезновения модала */
.modal-fade-enter-active {
  transition: opacity 0.22s ease;
}
.modal-fade-leave-active {
  transition: opacity 0.18s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-active .card-modal-content {
  transition: transform 0.22s ease;
}
.modal-fade-leave-active .card-modal-content {
  transition: transform 0.18s ease;
}
.modal-fade-enter-from .card-modal-content,
.modal-fade-leave-to .card-modal-content {
  transform: scale(0.88);
}
</style>

<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- ══ Step 1: Ввод сна ══════════════════════════════════════════ -->
      <template v-if="step === 1">
        <div class="header-bar">
          <div class="header-title serif">Сонник</div>
        </div>

        <!-- Hero -->
        <div class="dream-hero">
          <div class="dream-hero-icon">💤</div>
          <h1 class="serif">Что вам приснилось?</h1>
          <p v-if="profileReady">
            Опишите сон и мы разберём символы с учётом вашего знака
            {{ horoscope?.zodiacSign || '' }} и числа жизни {{ numerologyData?.lifePathNumber || '' }}
          </p>
          <p v-else>Опишите сон - разберём его символы и подскажем, о чём они говорят</p>
        </div>

        <!-- Нет даты рождения: разбор строится на знаке зодиака и числе жизни -->
        <div v-if="needsBirthDate" class="glass profile-prompt">
          <div class="profile-prompt-icon">🎂</div>
          <div class="profile-prompt-text">
            Для разбора сна нужна дата рождения — по ней мы определяем ваш знак зодиака и число жизни
          </div>
          <button class="profile-prompt-btn haptic" @click="navigate?.('profile')">Заполнить профиль</button>
        </div>

        <template v-else>
          <!-- Textarea -->
          <div class="dream-input-area glass">
            <textarea
              v-model="dreamText"
              maxlength="1000"
              rows="4"
              placeholder="Например: мне снилось, что я летела над городом, а потом оказалась в незнакомом доме..."
            ></textarea>
            <div class="char-count">{{ dreamText.length }}/1000</div>
          </div>

          <!-- Символы-чипы -->
          <div v-if="symbols.length" class="symbols-block">
            <div class="section-label">Частые символы в снах</div>
            <div class="symbols-wrap">
              <button
                v-for="s in symbols"
                :key="s.id"
                class="symbol-chip haptic"
                :class="{ selected: selectedSymbolIds.has(s.id) }"
                @click="toggleSymbol(s.id)"
              >
                {{ s.emoji }} {{ s.name }}
              </button>
            </div>
          </div>

          <!-- Ошибка (чувствительная тема и т.п.) -->
          <div v-if="error" class="dream-error">{{ error }}</div>

          <!-- CTA -->
          <button class="dream-btn haptic" :disabled="!canSubmit" @click="startAnalysis">
            Разобрать сон ✦ {{ dreamCost }} {{ creditsWord(dreamCost) }}
          </button>
        </template>

        <!-- Недавние сны -->
        <div v-if="recentDreams.length" class="recent-block">
          <div class="section-label">Недавние сны</div>
          <div
            v-for="d in recentDreams"
            :key="d.id"
            class="recent-item glass haptic"
            @click="openSavedDream(d.id)"
          >
            <div class="recent-icon">🌙</div>
            <div class="recent-text">
              <div class="recent-title">{{ d.titleSymbols.join(' · ') }}</div>
              <div class="recent-date">{{ formatDate(d.createdAt) }}</div>
            </div>
            <div class="recent-arrow">›</div>
          </div>
        </div>
      </template>

      <!-- ══ Step 2: Лоадер ════════════════════════════════════════════ -->
      <template v-if="step === 2">
        <div class="loader-wrap">
          <div class="ai-orb">
            <div class="orb-core"></div>
            <div class="orb-ring r1"></div>
            <div class="orb-ring r2"></div>
          </div>
          <h2 class="serif loader-phrase">{{ loadingPhrases[phraseIdx] }}</h2>
          <p class="loader-sub">Толкуем язык вашего подсознания...</p>
          <div class="progress-bar-wrap">
            <div class="progress-bar-fill" :style="`width:${progress}%`"></div>
          </div>
        </div>
      </template>

      <!-- ══ Step 3: Результат ═════════════════════════════════════════ -->
      <template v-if="step === 3 && result">
        <div class="header-bar">
          <div class="header-title serif">Разбор сна</div>
        </div>

        <!-- Success banner (только для свежего разбора) -->
        <div v-if="justAnalyzed" class="success-banner">
          <span class="success-check">✓</span>
          <span><b>Разбор готов.</b> Сохранён в вашей истории снов.</span>
        </div>

        <!-- Заголовок: дата + ключевые символы -->
        <div class="result-head glass">
          <div class="result-head-icon">💤</div>
          <div>
            <div class="result-date">{{ formatDate(result.createdAt) }}</div>
            <div class="result-symbols serif">{{ result.titleSymbols.join(' · ') }}</div>
          </div>
        </div>

        <!-- Главный смысл -->
        <div class="meaning-card glass">
          <div class="meaning-title gold">✦ Главный смысл</div>
          <p>{{ result.mainMeaning }}</p>
        </div>

        <!-- Число жизни -->
        <div class="meaning-card glass">
          <div class="meaning-title gold">🔢 Связь с вашим числом жизни</div>
          <p>{{ result.lifeNumberSection }}</p>
        </div>

        <!-- Знак зодиака -->
        <div class="meaning-card glass">
          <div class="meaning-title gold">{{ zodiacGlyph(result.zodiacSign) }} Знак {{ zodiacGenitive(result.zodiacSign) }} говорит</div>
          <p>{{ result.zodiacSection }}</p>
        </div>

        <!-- Символы сна -->
        <div v-if="result.symbols.length" class="meaning-card glass">
          <div class="meaning-title gold">🌙 Символы вашего сна</div>
          <div v-for="(s, i) in result.symbols" :key="i" class="symbol-meaning">
            <div class="symbol-meaning-name">{{ symbolEmoji(s.name) }} {{ s.name }}</div>
            <p>{{ s.meaning }}</p>
          </div>
        </div>

        <!-- Совет -->
        <div class="meaning-card glass advice-card">
          <div class="meaning-title gold">💡 Совет</div>
          <p>{{ result.advice }}</p>
        </div>

        <!-- Оценка разбора (только на свежем результате — как в раскладах) -->
        <ActionFeedbackWidget
          v-if="justAnalyzed && result.id"
          action-type="DREAM"
          :action-id="result.id"
        />

        <!-- Спросить карты об этом -->
        <div class="oracle-cta haptic" @click="askOracle">
          <div class="oracle-cta-icon">🔮</div>
          <div class="oracle-cta-text">
            <div class="oracle-cta-title">Спросить карты об этом</div>
            <div class="oracle-cta-sub">Расклад поможет разобраться глубже →</div>
          </div>
        </div>

        <!-- Ещё один сон -->
        <button class="dream-btn secondary haptic" @click="resetToInput">
          Разобрать ещё один сон
        </button>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, onMounted, onUnmounted, watch } from 'vue'
import {
  api,
  type DreamSymbolDto,
  type DreamResponse,
  type DreamHistoryItemDto,
  type NumerologyTodayResponse,
} from '@/utils/api'
import { useUser } from '@/composables/useUser'
import { useBalance } from '@/composables/useBalance'
import { useFeatureCosts } from '@/composables/useFeatureCosts'
import { usePrefilledQuestion } from '@/composables/usePrefilledQuestion'
import { useDevMode } from '@/composables/useDevMode'
import { useHoroscope } from '@/composables/useHoroscope'
import { useSpendConfirm } from '@/composables/useSpendConfirm'
import { useMySubscription } from '@/composables/useMySubscription'
import { zodiacGlyph } from '@/utils/zodiac'
import ActionFeedbackWidget from '@/components/ui/ActionFeedbackWidget.vue'

const navigate = inject<(r: string) => void>('navigate')
const setBackOverride = inject<(fn: (() => void) | null) => void>('setBackOverride')

const { profile } = useUser()
const { refreshBalance } = useBalance()
// Знак пользователя берём из гороскопа (по дате рождения), а НЕ из numerology/today:
// там zodiacSign — это знак ТЕКУЩЕЙ ДАТЫ (астрологический период), не знак пользователя
const { horoscope, fetchHoroscope } = useHoroscope()
const { featureCosts, loadFeatureCosts } = useFeatureCosts()
const { setPrefilledQuestion } = usePrefilledQuestion()
const { isDev } = useDevMode()
const { resolveSpendMode } = useSpendConfirm()
const { refreshSubscription } = useMySubscription()

// ── Состояние ────────────────────────────────────────────────────────────────
const step              = ref<1 | 2 | 3>(1)
const dreamText         = ref('')
const symbols           = ref<DreamSymbolDto[]>([])
const selectedSymbolIds = ref(new Set<number>())
const result            = ref<DreamResponse | null>(null)
const recentDreams      = ref<DreamHistoryItemDto[]>([])
const error             = ref('')
const justAnalyzed      = ref(false)  // свежий разбор (показываем баннер) vs открыт из истории
const numerologyData    = ref<NumerologyTodayResponse | null>(null)

// Лоадер
const phraseIdx = ref(0)
const progress  = ref(0)
let loaderTimer: ReturnType<typeof setInterval> | null = null

// 18 фраз — крутятся по кругу каждые 2.5с, чтобы глаза не замыливались
const loadingPhrases = [
  'Погружаемся в ваш сон...',
  'Расшифровываем символы...',
  'Слушаем шёпот подсознания...',
  'Листаем древние сонники...',
  'Сверяемся со звёздами...',
  'Толкуем язык сновидений...',
  'Ищем скрытые знаки...',
  'Соединяем образы в историю...',
  'Спрашиваем у Луны...',
  'Читаем между строк сна...',
  'Разгадываем ночные образы...',
  'Настраиваемся на вашу энергию...',
  'Вспоминаем, что говорил Морфей...',
  'Складываем мозаику сна...',
  'Прислушиваемся к интуиции...',
  'Открываем дверь в подсознание...',
  'Ловим ускользающие образы...',
  'Переводим сон на язык символов...',
]

// ── Вычисления ───────────────────────────────────────────────────────────────
const dreamCost      = computed(() => featureCosts.value.dream)
const needsBirthDate = computed(() => !profile.value?.birthDate)
const profileReady   = computed(() => !!numerologyData.value && !!horoscope.value?.zodiacSign)
const canSubmit      = computed(() =>
  dreamText.value.trim().length > 0 || selectedSymbolIds.value.size > 0
)

// ── Действия ─────────────────────────────────────────────────────────────────
const toggleSymbol = (id: number) => {
  const next = new Set(selectedSymbolIds.value)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  selectedSymbolIds.value = next
}

const startAnalysis = async () => {
  // Способ оплаты: знаки или квота подписки. Модалка сама разберётся
  // (в т.ч. покажет «не хватает знаков» + подписки, если средств нет)
  let spendMode: 'CREDITS' | 'QUOTA' = 'CREDITS'
  if (!isDev.value) {
    const mode = await resolveSpendMode('DREAM')
    if (!mode) return
    spendMode = mode
  }

  error.value = ''
  step.value = 2
  progress.value = 0
  phraseIdx.value = 0

  // Прогресс асимптотически ползёт к 96% — как в FortuneScreen
  loaderTimer = setInterval(() => {
    phraseIdx.value = (phraseIdx.value + 1) % loadingPhrases.length
    progress.value = progress.value + (96 - progress.value) * 0.1
  }, 2500)

  try {
    const res = await api.analyzeDream({
      dreamText: dreamText.value.trim() || null,
      symbolIds: [...selectedSymbolIds.value],
      spendMode,
    })
    result.value = res.data
    justAnalyzed.value = true
    progress.value = 100
    await refreshBalance()
    if (spendMode === 'QUOTA') await refreshSubscription()
    loadRecentDreams()
    setTimeout(() => { step.value = 3 }, 400)
  } catch (e: any) {
    if (e?.response?.status === 402) {
      navigate?.('payment')
      step.value = 1
    } else {
      error.value = e?.response?.data?.message || 'Не удалось разобрать сон. Попробуйте ещё раз.'
      step.value = 1
    }
  } finally {
    if (loaderTimer) { clearInterval(loaderTimer); loaderTimer = null }
  }
}

const openSavedDream = async (id: number) => {
  try {
    const res = await api.getDream(id)
    result.value = res.data
    justAnalyzed.value = false
    step.value = 3
  } catch {
    // Тост покажет глобальный обработчик
  }
}

const resetToInput = () => {
  dreamText.value = ''
  selectedSymbolIds.value = new Set()
  result.value = null
  error.value = ''
  step.value = 1
}

const askOracle = () => {
  if (!result.value) return
  setPrefilledQuestion(result.value.oracleQuestion)
  navigate?.('fortune')
}

// ── Вспомогательное ──────────────────────────────────────────────────────────
const creditsWord = (n: number) =>
  n === 1 ? 'знак' : n < 5 ? 'знака' : 'знаков'

const formatDate = (iso: string) => {
  const d = new Date(iso)
  const today = new Date()
  const prefix = d.toDateString() === today.toDateString() ? 'Сегодня, ' : ''
  return prefix + d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
}

// «Знак Тельца говорит» — родительный падеж названий знаков
const zodiacGenitive = (sign: string) => {
  const map: Record<string, string> = {
    'Овен': 'Овна', 'Телец': 'Тельца', 'Близнецы': 'Близнецов', 'Рак': 'Рака',
    'Лев': 'Льва', 'Дева': 'Девы', 'Весы': 'Весов', 'Скорпион': 'Скорпиона',
    'Стрелец': 'Стрельца', 'Козерог': 'Козерога', 'Водолей': 'Водолея', 'Рыбы': 'Рыб',
  }
  return map[sign] || sign
}

// Эмодзи для символа в результате: берём из справочника чипов, если название совпало
const symbolEmoji = (name: string) => {
  const found = symbols.value.find(s => s.name.toLowerCase() === name.toLowerCase())
  return found?.emoji || '✨'
}

const loadRecentDreams = async () => {
  try {
    const res = await api.getRecentDreams()
    recentDreams.value = res.data
  } catch {
    // Некритично — просто не покажем блок
  }
}

// ── Кнопка «Назад» Telegram ──────────────────────────────────────────────────
// С результата и лоадера возвращаемся на ввод, а не на предыдущий экран
watch(step, (s) => {
  if (s === 3) {
    setBackOverride?.(() => { resetToInput() })
  } else {
    setBackOverride?.(null)
  }
})

onMounted(async () => {
  loadFeatureCosts()
  loadRecentDreams()
  fetchHoroscope() // знак пользователя для подзаголовка (кэшируется глобально)
  try {
    const res = await api.getDreamSymbols()
    symbols.value = res.data
  } catch {
    // Чипы не загрузились — экран работает и с одним текстом
  }
  // Знак зодиака и число жизни для подзаголовка (бесплатный эндпоинт)
  try {
    const res = await api.getNumerologyToday()
    numerologyData.value = res.data
  } catch {
    // Нет даты рождения — подзаголовок будет общим, а разбор закрыт profile-prompt'ом
  }
})

onUnmounted(() => {
  if (loaderTimer) clearInterval(loaderTimer)
  setBackOverride?.(null)
})
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
}
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px) 20px 0; }

.header-bar {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 18px;
}
.header-title { font-size: 18px; }

/* ── Hero ── */
.dream-hero { text-align: center; margin-bottom: 20px; }
.dream-hero-icon { font-size: 44px; margin-bottom: 10px; }
.dream-hero h1 { font-size: 24px; margin-bottom: 8px; }
.dream-hero p  { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.5; max-width: 300px; margin: 0 auto; }

/* ── Профиль не заполнен ── */
.profile-prompt {
  padding: 20px;
  text-align: center;
  margin-bottom: 16px;
}
.profile-prompt-icon { font-size: 32px; margin-bottom: 10px; }
.profile-prompt-text { font-size: 13px; color: rgba(255,255,255,0.7); line-height: 1.5; margin-bottom: 14px; }
.profile-prompt-btn {
  padding: 10px 22px;
  border-radius: 100px;
  border: none;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
}

/* ── Textarea ── */
.dream-input-area {
  position: relative;
  padding: 14px 16px 30px;
  margin-bottom: 18px;
}
.dream-input-area textarea {
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  color: #F5ECFF;
  font-family: 'Manrope', sans-serif;
  font-size: 14px;
  line-height: 1.5;
}
.dream-input-area textarea::placeholder { color: rgba(255,255,255,0.35); }
.char-count {
  position: absolute;
  bottom: 10px; right: 14px;
  font-size: 11px;
  color: rgba(255,255,255,0.35);
}

/* ── Символы ── */
.section-label {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: rgba(255,255,255,0.5);
  font-weight: 600;
  margin-bottom: 10px;
}
.symbols-block { margin-bottom: 20px; }
.symbols-wrap { display: flex; flex-wrap: wrap; gap: 8px; }
.symbol-chip {
  padding: 8px 14px;
  border-radius: 100px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.12);
  color: rgba(255,255,255,0.8);
  font-size: 13px;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
  transition: all 0.2s;
}
.symbol-chip.selected {
  background: rgba(182,84,255,0.25);
  border-color: rgba(182,84,255,0.6);
  color: #fff;
  box-shadow: 0 0 12px rgba(182,84,255,0.3);
}

/* ── Ошибка ── */
.dream-error {
  padding: 12px 16px;
  margin-bottom: 14px;
  border-radius: 14px;
  background: rgba(233,74,110,0.12);
  border: 1px solid rgba(233,74,110,0.3);
  color: #ff9db8;
  font-size: 13px;
  line-height: 1.5;
}

/* ── CTA ── */
.dream-btn {
  width: 100%;
  padding: 16px;
  border-radius: 100px;
  border: none;
  background: linear-gradient(135deg, #b654ff 0%, #e94aa8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,0.4);
  transition: opacity 0.2s, transform 0.15s;
  margin-bottom: 24px;
}
.dream-btn:disabled {
  opacity: 0.4;
  box-shadow: none;
  cursor: default;
}
.dream-btn:not(:disabled):active { transform: scale(0.97); }
.dream-btn.secondary {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: none;
  margin-top: 4px;
}

/* ── Недавние сны ── */
.recent-block { margin-bottom: 20px; }
.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 10px;
  cursor: pointer;
}
.recent-icon {
  width: 38px; height: 38px;
  border-radius: 12px;
  background: rgba(182,84,255,0.15);
  display: flex; align-items: center; justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}
.recent-text { flex: 1; min-width: 0; }
.recent-title {
  font-size: 14px;
  font-weight: 600;
  color: #e0c3ff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.recent-date { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 2px; }
.recent-arrow { font-size: 20px; color: rgba(255,255,255,0.35); }

/* ── Лоадер ── */
.loader-wrap {
  min-height: 80vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px 0;
}
.loader-phrase { font-size: 24px; margin: 24px 12px 8px; min-height: 60px; }
.loader-sub { color: rgba(255,255,255,.55); font-size: 13px; margin-bottom: 28px; }

.ai-orb { position: relative; width: 90px; height: 90px; }
.orb-core {
  position: absolute; inset: 18px;
  border-radius: 50%;
  background: radial-gradient(circle, #b654ff, #6a2eb8);
  box-shadow: 0 0 40px rgba(182,84,255,0.6);
  animation: orb-breathe 2s ease-in-out infinite;
}
.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(182,84,255,0.35);
  animation: center-ring 2.5s ease-out infinite;
}
.orb-ring.r1 { inset: 9px; animation-delay: 0s; }
.orb-ring.r2 { inset: 0;   animation-delay: 0.8s; }
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); }
  50%      { transform: scale(1.08); }
}

.progress-bar-wrap {
  width: 200px;
  height: 4px;
  border-radius: 4px;
  background: rgba(255,255,255,0.1);
  overflow: hidden;
}
.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  transition: width 0.4s ease;
}

/* ── Результат ── */
.success-banner {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  margin-bottom: 14px;
  border-radius: 14px;
  background: rgba(112,224,168,0.1);
  border: 1px solid rgba(112,224,168,0.3);
  color: #86e8b6;
  font-size: 13px;
}
.success-banner b { font-weight: 700; }
.success-check {
  width: 20px; height: 20px;
  border-radius: 50%;
  background: rgba(112,224,168,0.9);
  color: #0a3a2a;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  font-weight: 800;
  flex-shrink: 0;
}

.result-head {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  margin-bottom: 14px;
}
.result-head-icon { font-size: 30px; }
.result-date { font-size: 11px; color: rgba(255,255,255,0.5); margin-bottom: 3px; }
.result-symbols { font-size: 17px; color: #e0c3ff; }

.meaning-card {
  padding: 18px;
  margin-bottom: 14px;
}
.meaning-card p {
  font-size: 14px;
  line-height: 1.6;
  color: rgba(255,255,255,0.85);
}
.meaning-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 10px;
}
.meaning-title.gold { color: #ffc857; }

.symbol-meaning { margin-bottom: 12px; }
.symbol-meaning:last-child { margin-bottom: 0; }
.symbol-meaning-name {
  font-size: 13px;
  font-weight: 700;
  color: #e0c3ff;
  margin-bottom: 4px;
}

.advice-card {
  background: linear-gradient(135deg, rgba(255,200,87,0.08), rgba(255,160,50,0.04));
  border: 1px solid rgba(255,200,87,0.25);
}

.oracle-cta {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 18px;
  margin-bottom: 14px;
  border-radius: 22px;
  background: linear-gradient(135deg, #6a2eb8 0%, #3a1b6e 100%);
  border: 1px solid rgba(255,255,255,0.15);
  cursor: pointer;
}
.oracle-cta-icon {
  width: 44px; height: 44px;
  border-radius: 14px;
  background: rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 22px;
  flex-shrink: 0;
}
.oracle-cta-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 2px; }
.oracle-cta-sub   { font-size: 12px; color: #ffc857; }
</style>

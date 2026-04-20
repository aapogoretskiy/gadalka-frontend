<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <button class="back-btn haptic" @click="navigate('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="header-title serif">Карта дня</div>
        <div style="width:36px"></div>
      </div>

      <!-- Big card -->
      <div class="big-card-container">
        <div class="big-card haptic" :class="{ flipped: isFlipped }" @click="isFlipped = true">
          <div class="glow-card"></div>
          <!-- Back -->
          <div class="big-face big-back">
            <div class="big-back-border">
              <svg viewBox="0 0 80 120" fill="none" opacity="0.85" width="65%">
                <rect x="3" y="3" width="74" height="114" rx="6" stroke="#ffc857" stroke-width="1.2"/>
                <circle cx="40" cy="60" r="24" stroke="#ffc857" stroke-width="1.2"/>
                <path d="M40 36 L40 84 M16 60 L64 60" stroke="#ffc857" stroke-width="1"/>
                <path d="M40 36 L56 60 L40 84 L24 60 Z" stroke="#ffc857" stroke-width="0.8" fill="none"/>
              </svg>
            </div>
          </div>
          <!-- Front -->
          <div class="big-face big-front">
            <div class="big-roman">✦</div>
            <div class="big-illustration">🌟</div>
            <div class="big-name serif">
              {{ cardLoading ? '...' : (dailyCard?.name || 'Карта дня') }}
            </div>
          </div>
        </div>
      </div>

      <div v-if="!isFlipped" class="tap-hint">
        Нажмите на карту, чтобы открыть
      </div>

      <!-- Loading skeleton -->
      <div v-if="isFlipped && cardLoading" class="meaning-card glass">
        <div class="skeleton-line" style="width:40%;height:12px;margin-bottom:12px"></div>
        <div class="skeleton-line" style="width:70%;height:26px;margin-bottom:16px"></div>
        <div class="skeleton-line" style="width:100%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:90%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:80%;height:14px"></div>
      </div>

      <!-- Meaning (shown after flip) -->
      <div v-if="isFlipped && dailyCard && !cardLoading" class="meaning-card glass">
        <div class="meaning-label">✦ Значение</div>
        <div class="meaning-title serif">{{ dailyCard.name }}</div>
        <div class="meaning-body">{{ dailyCard.meaning }}</div>
        <div v-if="dailyCard.advice" class="meaning-advice">
          <div class="advice-label">💡 Совет</div>
          <div class="meaning-body">{{ dailyCard.advice }}</div>
        </div>
        <div class="meaning-date">Карта на {{ formattedDate }}</div>
      </div>

      <!-- Error state -->
      <div v-if="isFlipped && cardError" class="meaning-card glass error-card">
        <div class="meaning-label">⚠️ Ошибка</div>
        <div class="meaning-body">{{ cardError }}</div>
        <button class="retry-btn haptic" @click="fetchDailyCard(true)">Попробовать снова</button>
      </div>

      <div v-if="isFlipped" style="display:flex;flex-direction:column;gap:10px;margin-top:16px">
        <button class="action-btn primary haptic" :disabled="isSaving || saveSuccess" @click="addToDiary">
          {{ saveSuccess ? '✓ Сохранено' : isSaving ? 'Сохраняем...' : 'Добавить в дневник' }}
        </button>
        <button class="action-btn secondary haptic" @click="navigate('tarot')">
          Открыть колоду
        </button>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useDailyCard } from '@/composables/useDailyCard'
import { hapticFeedback } from '@/utils/telegram'
import { api } from '@/utils/api'

const navigate = inject<(r: string) => void>('navigate')
const { dailyCard, isLoading: cardLoading, error: cardError, fetchDailyCard } = useDailyCard()

const isFlipped = ref(false)
const isSaving = ref(false)
const saveSuccess = ref(false)

const formattedDate = computed(() => {
  if (!dailyCard.value?.date) return ''
  return new Date(dailyCard.value.date).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long',
  })
})

const addToDiary = async () => {
  if (!dailyCard.value?.cardId || isSaving.value || saveSuccess.value) return
  isSaving.value = true
  try {
    await api.saveDiaryEntry({ featureType: 'DAILY_CARD', referenceId: dailyCard.value.cardId })
    hapticFeedback.success()
    saveSuccess.value = true
    setTimeout(() => navigate?.('diary'), 800)
  } catch {
    hapticFeedback.error?.()
    navigate?.('diary')
  } finally {
    isSaving.value = false
  }
}

onMounted(() => {
  fetchDailyCard()
})
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 30px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

.header-bar {
  display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px;
}
.back-btn {
  width: 36px; height: 36px; border-radius: 12px;
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.1);
  display: flex; align-items: center; justify-content: center; cursor: pointer; color: #F5ECFF;
}
.header-title { font-size: 18px; }

/* Big card */
.big-card-container {
  display: flex; justify-content: center; align-items: center;
  margin: 10px 0 24px; perspective: 1500px;
}
.big-card {
  width: 200px; height: 300px;
  position: relative; cursor: pointer;
  animation: card-breathe 4s ease-in-out infinite;
  border-radius: 16px; overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,200,87,0.3);
}
.big-card.flipped { animation-play-state: paused; }

.glow-card {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 240px; height: 240px;
  background: radial-gradient(circle, rgba(255,200,87,0.2) 0%, transparent 60%);
  filter: blur(40px);
  animation: glow-pulse 3s ease-in-out infinite;
  pointer-events: none; z-index: -1;
}

.big-face {
  position: absolute; inset: 0; border-radius: 16px;
  opacity: 0; transition: opacity 0.6s ease;
}
.big-card:not(.flipped) .big-back  { opacity: 1; }
.big-card.flipped      .big-front { opacity: 1; }

.big-back {
  background: linear-gradient(135deg, #3a1b6e 0%, #1a0b2e 100%);
  display: flex; align-items: center; justify-content: center;
}
.big-back-border {
  position: absolute; inset: 12px;
  border: 1px solid rgba(255,200,87,0.5); border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
}

.big-front {
  background: linear-gradient(160deg, #4a1d7e 0%, #2a0e4e 50%, #1a0529 100%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: space-between;
  padding: 20px 14px;
  border: 1px solid rgba(255,200,87,0.3);
}
.big-roman { font-family: 'Cormorant Garamond',serif; font-size: 18px; color: #ffc857; letter-spacing: .2em; }
.big-illustration { font-size: 70px; flex: 1; display: flex; align-items: center; }
.big-name { font-family: 'Cormorant Garamond',serif; font-size: 20px; text-align: center; color: #fff; padding-bottom: 4px; }

.tap-hint {
  text-align: center; font-size: 12px; color: rgba(255,255,255,.45); margin-bottom: 24px;
  animation: hint-pulse 2s ease-in-out infinite;
}
@keyframes hint-pulse { 0%,100%{opacity:.45}50%{opacity:1} }

/* Meaning */
.meaning-card { padding: 22px; margin-bottom: 14px; }
.meaning-label { font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:#ffc857; font-weight:600; margin-bottom:8px; }
.meaning-title { font-size:26px; margin-bottom:10px; }
.meaning-body  { font-size:14px; line-height:1.6; color:rgba(255,255,255,.8); margin-bottom:8px; }

.keywords { display:flex; flex-wrap:wrap; align-items:center; gap:4px; margin-top:10px; }
.keyword  { font-size:11px; text-transform:uppercase; letter-spacing:.1em; color:rgba(255,200,87,.8); font-weight:600; }
.kw-sep   { color:rgba(255,255,255,.3); margin:0 4px; }

/* Advice block */
.meaning-advice { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.08); }
.advice-label   { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#ffc857; font-weight:600; margin-bottom:6px; }

/* Date */
.meaning-date   { font-size:11px; color:rgba(255,255,255,.35); text-align:right; margin-top:12px; }

/* Error */
.error-card { border-color: rgba(255,100,100,.2) !important; }
.retry-btn  {
  margin-top:12px; padding:10px 20px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
  color:#F5ECFF; font-size:13px; font-weight:600;
  font-family:'Manrope',sans-serif; cursor:pointer;
}

/* Skeleton */
.skeleton-line {
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.12) 50%, rgba(255,255,255,.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}
@keyframes skeleton-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

/* Buttons */
.action-btn {
  width: 100%; padding: 15px; border-radius: 16px;
  font-size: 15px; font-weight: 600; font-family: 'Manrope', sans-serif; border: none; cursor: pointer;
}
.action-btn.primary {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; box-shadow: 0 8px 24px rgba(182,84,255,0.4);
}
.action-btn.secondary {
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.12); color: #F5ECFF;
}
</style>

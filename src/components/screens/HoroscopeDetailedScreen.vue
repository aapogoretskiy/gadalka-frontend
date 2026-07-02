<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Гороскоп на день</div>
        <div style="width:36px"></div>
      </div>

      <!-- Loading skeleton -->
      <div v-if="isLoading" class="meaning-card glass">
        <div class="skeleton-line" style="width:50%;height:14px;margin-bottom:14px"></div>
        <div class="skeleton-line" style="width:100%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:90%;height:14px;margin-bottom:8px"></div>
        <div class="skeleton-line" style="width:75%;height:14px"></div>
      </div>

      <!-- Нужна дата рождения -->
      <div v-else-if="needsBirthDate" class="meaning-card glass empty-card">
        <div class="empty-icon">✦</div>
        <div class="empty-title serif">Нужна дата рождения</div>
        <div class="empty-text">Чтобы определить ваш знак зодиака и составить гороскоп, укажите дату рождения — это 10 секунд, а в подарок начислим +1 знак.</div>
        <button class="action-btn primary haptic" @click="navigate('onboarding')">Указать дату рождения</button>
      </div>

      <!-- Ошибка -->
      <div v-else-if="error" class="meaning-card glass error-card">
        <div class="meaning-label">⚠️ Ошибка</div>
        <div class="meaning-body">{{ error }}</div>
        <button class="retry-btn haptic" @click="fetchHoroscope(true)">Попробовать снова</button>
      </div>

      <!-- Контент -->
      <template v-else-if="horoscope">

        <!-- Шапка со знаком -->
        <div class="sign-hero glass">
          <div class="sign-glyph">{{ zodiacGlyph(horoscope.zodiacSign) }}</div>
          <div class="sign-name serif">{{ horoscope.zodiacSign }}</div>
          <div class="sign-period">{{ horoscope.periodLabel }}</div>
        </div>

        <!-- Гороскоп не успели обновить на сегодня — показываем вчерашний с пометкой -->
        <div v-if="horoscope.stale" class="stale-banner glass">
          ✦ Обновляем гороскоп на сегодня, пока показываем прогноз от {{ formattedDate }}
        </div>

        <!-- Рейтинги -->
        <div class="scores-grid">
          <div v-for="s in scoreRows" :key="s.label" class="score-card glass">
            <div class="score-card-icon">{{ s.icon }}</div>
            <div class="score-card-label" :style="{ color: s.color }">{{ s.label }}</div>
            <div class="score-card-bar-wrap">
              <div class="score-card-bar" :style="{ width: (s.value / 5 * 100) + '%', background: s.color }"></div>
            </div>
            <div class="score-card-frac" :style="{ color: s.color }">{{ s.value }}/5</div>
          </div>
        </div>

        <!-- Общий прогноз -->
        <div class="meaning-card glass">
          <div class="meaning-label">✦ Общий прогноз</div>
          <div class="meaning-body">{{ horoscope.general }}</div>
        </div>

        <!-- Совет дня -->
        <div class="meaning-card glass meaning-advice-card">
          <div class="meaning-label">💡 Совет дня</div>
          <div class="meaning-body">{{ horoscope.advice }}</div>
        </div>

        <!-- Любовь -->
        <div class="meaning-card glass">
          <div class="meaning-label">💗 Любовь и отношения</div>
          <div class="meaning-body">{{ horoscope.love }}</div>
        </div>

        <!-- Карьера -->
        <div class="meaning-card glass">
          <div class="meaning-label">💼 Карьера</div>
          <div class="meaning-body">{{ horoscope.career }}</div>
        </div>

        <!-- Деньги -->
        <div class="meaning-card glass">
          <div class="meaning-label">💰 Финансы</div>
          <div class="meaning-body">{{ horoscope.money }}</div>
        </div>

        <!-- Статичная справка по знаку -->
        <div class="static-grid">
          <div class="static-card glass">
            <div class="static-icon">🔢</div>
            <div class="static-label">Числа</div>
            <div class="static-value">{{ horoscope.luckyNumbers.join(', ') }}</div>
          </div>
          <div class="static-card glass">
            <div class="static-icon">🎨</div>
            <div class="static-label">Цвета</div>
            <div class="static-value">{{ horoscope.luckyColors.join(', ') }}</div>
          </div>
          <div class="static-card glass">
            <div class="static-icon">💎</div>
            <div class="static-label">Камень</div>
            <div class="static-value">{{ horoscope.stone }}</div>
          </div>
        </div>

      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, inject } from 'vue'
import { useHoroscope } from '@/composables/useHoroscope'
import { zodiacGlyph } from '@/utils/zodiac'

const navigate = inject<(r: string) => void>('navigate')
const { horoscope, isLoading, error, needsBirthDate, fetchHoroscope } = useHoroscope()

const formattedDate = computed(() => {
  if (!horoscope.value) return ''
  return new Date(horoscope.value.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
})

const scoreRows = computed(() => {
  if (!horoscope.value) return []
  return [
    { label: 'Общий',   value: horoscope.value.generalScore, icon: '🌀', color: '#b654ff' },
    { label: 'Любовь',  value: horoscope.value.loveScore,    icon: '💗', color: '#ff6b9d' },
    { label: 'Карьера', value: horoscope.value.careerScore,  icon: '🚀', color: '#ffa857' },
    { label: 'Деньги',  value: horoscope.value.moneyScore,   icon: '💰', color: '#4ade80' },
  ]
})

onMounted(() => {
  fetchHoroscope()
})
</script>

<style scoped>
.screen-wrap { min-height: var(--tg-viewport-stable-height, 100vh); padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px)); overflow-y: auto; }
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
.header-title { font-size:18px; text-align:center; }

/* Sign hero */
.sign-hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 24px 16px; margin-bottom: 14px; text-align: center;
}
.sign-glyph {
  width: 64px; height: 64px; border-radius: 50%;
  background: linear-gradient(135deg, rgba(182,84,255,0.3), rgba(233,74,168,0.18));
  border: 1px solid rgba(182,84,255,0.45);
  display: flex; align-items: center; justify-content: center;
  font-size: 32px; color: #e0c3ff;
  margin-bottom: 10px;
}
.sign-name { font-size: 24px; }
.sign-period { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 4px; }

/* Stale-баннер: гороскоп на сегодня ещё не сгенерирован, показан вчерашний */
.stale-banner {
  padding: 12px 16px; margin-bottom: 14px; text-align: center;
  font-size: 12px; line-height: 1.5; color: #ffc857;
  background: linear-gradient(135deg, rgba(255,200,87,.1), rgba(255,200,87,.04));
  border: 1px solid rgba(255,200,87,.25);
}

/* Scores */
.scores-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 14px; }
.score-card { padding: 12px 8px; text-align: center; }
.score-card-icon { font-size: 16px; margin-bottom: 6px; }
.score-card-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: .06em;
  font-weight: 700; margin-bottom: 8px;
}
.score-card-bar-wrap { height: 4px; border-radius: 2px; background: rgba(255,255,255,.08); overflow: hidden; margin-bottom: 6px; }
.score-card-bar { height: 100%; border-radius: 2px; transition: width 1s ease; }
.score-card-frac { font-size: 11px; font-weight: 700; }

/* Meaning cards */
.meaning-card { padding: 20px; margin-bottom: 12px; }
.meaning-label { font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:#ffc857; font-weight:600; margin-bottom:8px; }
.meaning-body  { font-size:14px; line-height:1.6; color:rgba(255,255,255,.8); }
.meaning-advice-card {
  background: linear-gradient(135deg, rgba(182,84,255,.08), rgba(233,74,168,.04));
  border: 1px solid rgba(182,84,255,.2);
}

/* Static info grid (числа / цвета / камень) */
.static-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 12px; }
.static-card {
  padding: 14px 10px;
  text-align: center;
}
.static-icon { font-size: 18px; margin-bottom: 6px; }
.static-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: .1em;
  color: rgba(255,255,255,.45); font-weight: 700; margin-bottom: 6px;
}
.static-value {
  font-size: 13px; font-weight: 600; color: #ffc857;
  line-height: 1.3;
}

/* Empty state (нет даты рождения) */
.empty-card { display: flex; flex-direction: column; align-items: center; text-align: center; padding: 32px 20px; }
.empty-icon { font-size: 28px; color: rgba(255,200,87,.7); margin-bottom: 12px; }
.empty-title { font-size: 18px; margin-bottom: 8px; }
.empty-text { font-size: 13px; color: rgba(255,255,255,.55); line-height: 1.5; margin-bottom: 18px; }

/* Error */
.error-card { border-color: rgba(255,100,100,.2) !important; }
.retry-btn {
  margin-top:12px; padding:10px 20px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
  color:#F5ECFF; font-size:13px; font-weight:600;
  font-family:'Manrope',sans-serif; cursor:pointer;
}

/* Buttons */
.action-btn {
  width: 100%; padding: 15px; border-radius: 16px;
  font-size: 15px; font-weight: 600; font-family: 'Manrope', sans-serif; border: none; cursor: pointer;
}
.action-btn.primary {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; box-shadow: 0 8px 24px rgba(182,84,255,0.4);
}

/* Skeleton */
.skeleton-line {
  border-radius: 6px;
  background: linear-gradient(90deg, rgba(255,255,255,.06) 25%, rgba(255,255,255,.12) 50%, rgba(255,255,255,.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s infinite;
}
@keyframes skeleton-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
</style>

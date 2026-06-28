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
        <div class="empty-text">Чтобы определить ваш знак зодиака и составить гороскоп, укажите дату рождения в профиле.</div>
        <button class="action-btn primary haptic" @click="navigate('profile')">Заполнить профиль</button>
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

        <!-- Рейтинги -->
        <div class="scores-card glass">
          <div v-for="s in scoreRows" :key="s.label" class="score-row">
            <div class="score-label">{{ s.label }}</div>
            <div class="score-bar-wrap">
              <div class="score-bar" :style="{ width: (s.value / 5 * 100) + '%' }"></div>
            </div>
            <div class="score-value">{{ s.value }}/5</div>
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
        <div class="meaning-card glass">
          <div class="meaning-label">✦ Знаки дня</div>
          <div class="static-chips">
            <span v-for="n in horoscope.luckyNumbers" :key="'n'+n" class="static-chip">{{ n }}</span>
            <span v-for="c in horoscope.luckyColors" :key="c" class="static-chip">{{ c }}</span>
            <span class="static-chip static-chip--stone">{{ horoscope.stone }}</span>
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

const scoreRows = computed(() => {
  if (!horoscope.value) return []
  return [
    { label: 'Общее',  value: horoscope.value.generalScore },
    { label: 'Любовь', value: horoscope.value.loveScore },
    { label: 'Карьера', value: horoscope.value.careerScore },
    { label: 'Деньги', value: horoscope.value.moneyScore },
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

/* Scores */
.scores-card { padding: 18px 16px; margin-bottom: 14px; }
.score-row { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.score-row:last-child { margin-bottom: 0; }
.score-label { font-size: 12px; width: 64px; flex-shrink: 0; color: rgba(255,255,255,.7); }
.score-bar-wrap { flex: 1; height: 6px; border-radius: 3px; background: rgba(255,255,255,.08); overflow: hidden; }
.score-bar {
  height: 100%; border-radius: 3px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  transition: width 1s ease;
}
.score-value { font-size: 11px; font-weight: 600; color: #ffc857; width: 30px; text-align: right; flex-shrink: 0; }

/* Meaning cards */
.meaning-card { padding: 20px; margin-bottom: 12px; }
.meaning-label { font-size:10px; text-transform:uppercase; letter-spacing:.12em; color:#ffc857; font-weight:600; margin-bottom:8px; }
.meaning-body  { font-size:14px; line-height:1.6; color:rgba(255,255,255,.8); }
.meaning-advice-card {
  background: linear-gradient(135deg, rgba(182,84,255,.08), rgba(233,74,168,.04));
  border: 1px solid rgba(182,84,255,.2);
}

/* Static chips */
.static-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.static-chip {
  font-size: 12px; font-weight: 600;
  padding: 6px 14px; border-radius: 100px;
  background: rgba(255,200,87,.1); border: 1px solid rgba(255,200,87,.25);
  color: rgba(255,255,255,.85);
}
.static-chip--stone { color: #ffc857; }

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

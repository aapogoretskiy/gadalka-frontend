<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- Header -->
      <div class="astro-header">
        <h1 class="serif">Астро</h1>
        <p>Сны, звёзды и знаки — всё о вашей связи с космосом</p>
      </div>

      <!-- Сонник -->
      <div
        class="astro-card gradient-dream haptic"
        :class="{ 'astro-card--new': dreamBadge.isNew || dreamBadge.isHot }"
        @click="navigate?.('dream')"
      >
        <div class="astro-card-shine"></div>
        <div v-if="dreamBadge.isNew || dreamBadge.isHot" class="astro-card-badge">
          {{ dreamBadge.isNew ? 'Новинка' : 'Хит' }}
        </div>
        <div class="astro-card-icon">🌙</div>
        <div class="astro-card-text">
          <h3 class="serif">Сонник</h3>
          <p>Разбор вашего сна с учётом знака зодиака и числа жизни</p>
        </div>
        <div class="astro-card-arrow">›</div>
      </div>

      <!-- Гороскоп -->
      <div class="astro-card glass haptic" @click="navigate?.('horoscope-day')">
        <div class="astro-card-icon astro-card-icon--glyph">
          {{ horoscope?.zodiacSign ? zodiacGlyph(horoscope.zodiacSign) : '✦' }}
        </div>
        <div class="astro-card-text">
          <h3 class="serif">Гороскоп</h3>
          <p v-if="horoscopeNeedsBirthDate">Укажите дату рождения в профиле</p>
          <p v-else>{{ horoscope?.zodiacSign ? `Прогноз на день для знака ${horoscope.zodiacSign}` : 'Ваш прогноз на день' }}</p>
        </div>
        <div v-if="horoscope?.generalScore" class="astro-card-score">
          <span class="score-num">{{ horoscope.generalScore }}</span><span class="score-max">/5</span>
        </div>
        <div class="astro-card-arrow">›</div>
      </div>

      <!-- Задел на будущее -->
      <div class="astro-hint">Скоро здесь появятся новые разделы ✨</div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onMounted } from 'vue'
import { useHoroscope } from '@/composables/useHoroscope'
import { useFeatureBadges } from '@/composables/useFeatureBadges'
import { zodiacGlyph } from '@/utils/zodiac'

const navigate = inject<(r: string) => void>('navigate')
const { horoscope, needsBirthDate: horoscopeNeedsBirthDate, fetchHoroscope } = useHoroscope()

// Отметка «Новинка»/«Хит» на Соннике — настраивается админом (вкладка «Цены»),
// см. useFeatureBadges.ts.
const { featureBadges, loadFeatureBadges } = useFeatureBadges()
const dreamBadge = computed(() => featureBadges.value.dream)

onMounted(() => {
  fetchHoroscope()
  loadFeatureBadges()
})
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
}
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px) 20px 0; }

.astro-header { text-align: center; margin-bottom: 24px; }
.astro-header h1 { font-size: 26px; margin-bottom: 6px; }
.astro-header p  { font-size: 13px; color: rgba(255,255,255,0.55); line-height: 1.5; }

.astro-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 18px;
  margin-bottom: 14px;
  border-radius: 22px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
.gradient-dream {
  background: linear-gradient(135deg, #6a2eb8 0%, #3a1b6e 100%);
  border: 1px solid rgba(255,255,255,0.15);
}
.astro-card--new {
  border-color: rgba(182,84,255,.7);
  box-shadow: 0 0 0 1px rgba(182,84,255,.4), 0 0 18px rgba(182,84,255,.35);
}
.astro-card-badge {
  position: absolute;
  top: 12px; right: 14px;
  background: #ffc857; color: #1a0529;
  font-size: 10px; font-weight: 700;
  padding: 3px 8px; border-radius: 6px;
  letter-spacing: .03em; text-transform: uppercase;
  font-family: 'Manrope', sans-serif;
}
.astro-card-shine {
  position: absolute;
  top: 0; left: -100%;
  width: 60%; height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.12), transparent);
  transform: skewX(-20deg);
  animation: cta-shine 4s ease-in-out infinite;
  pointer-events: none;
}

.astro-card-icon {
  width: 52px; height: 52px;
  border-radius: 16px;
  background: rgba(255,255,255,0.12);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}
.astro-card-icon--glyph {
  background: linear-gradient(135deg, rgba(182,84,255,0.25), rgba(233,74,168,0.15));
  border: 1px solid rgba(182,84,255,0.4);
  color: #e0c3ff;
  font-size: 24px;
}

.astro-card-text { flex: 1; min-width: 0; }
.astro-card-text h3 { font-size: 18px; margin-bottom: 3px; color: #fff; }
.astro-card-text p  { font-size: 12px; color: rgba(255,255,255,0.6); line-height: 1.4; }

.astro-card-score {
  display: flex;
  align-items: baseline;
  font-family: 'Cormorant Garamond', serif;
  color: #ffc857;
  flex-shrink: 0;
}
.score-num { font-size: 22px; font-weight: 600; }
.score-max { font-size: 12px; opacity: .6; }

.astro-card-arrow { font-size: 24px; color: rgba(255,255,255,0.4); flex-shrink: 0; }

.astro-hint {
  text-align: center;
  font-size: 12px;
  color: rgba(255,255,255,0.35);
  margin-top: 10px;
}
</style>

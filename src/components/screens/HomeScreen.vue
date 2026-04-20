<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- Greeting -->
      <div class="greeting">
        <div class="greeting-text">
          <div class="hello">{{ dateStr }}</div>
          <div class="name serif">{{ userName }}</div>
        </div>
        <div class="avatar" @click="navigate('profile')">
          {{ userInitial }}
          <div class="streak-mini">🔥 7</div>
        </div>
      </div>

      <!-- Card of the Day -->
      <div class="tarot-day-card gradient-card haptic" @click="navigate('tarot-day')">
        <div class="tarot-hero-label">
          <span class="label-line"></span> Карта дня <span class="label-line"></span>
        </div>
        <div class="tarot-card-wrapper">
          <div class="glow-behind"></div>
          <!-- Card visual -->
          <div class="mini-tarot-card" :class="{ flipped: cardFlipped }" @click.stop="cardFlipped = !cardFlipped">
            <div class="card-face card-back">
              <div class="card-back-inner">
                <svg viewBox="0 0 60 80" fill="none" opacity="0.7">
                  <rect x="4" y="4" width="52" height="72" rx="4" stroke="#ffc857" stroke-width="1"/>
                  <circle cx="30" cy="40" r="16" stroke="#ffc857" stroke-width="1"/>
                  <path d="M30 24 L30 56 M14 40 L46 40" stroke="#ffc857" stroke-width="0.8"/>
                </svg>
              </div>
            </div>
            <div class="card-face card-front">
              <div class="card-roman">✦</div>
              <div class="card-emoji">🌟</div>
              <div class="card-name serif">
                {{ cardLoading ? '...' : (dailyCard?.name || 'Карта дня') }}
              </div>
            </div>
          </div>
        </div>
        <div v-if="!cardFlipped" class="tap-hint">Нажмите чтобы открыть карту</div>
        <div v-else class="meaning-link" @click.stop="navigate('tarot-day')">
          Читать значение →
        </div>
      </div>

      <!-- Numerology number -->
      <div class="number-card glass haptic" @click="navigate('numerology')">
        <div class="number-big">
          <span>{{ lifeNumber }}</span>
        </div>
        <div class="number-text">
          <div class="number-label">Число дня</div>
          <div class="number-title serif">{{ lifeNumberTitle }}</div>
          <div class="number-desc">Откройте полный анализ</div>
        </div>
        <div class="arrow-right">›</div>
      </div>

      <!-- CTA Fortune -->
      <div class="cta-question haptic" @click="navigate('fortune')">
        <div class="cta-shine"></div>
        <h3>Задать вопрос Оракулу</h3>
        <p>Получите ответ через расклад карт Таро</p>
        <div class="cta-btn-inner">Начать <span>→</span></div>
        <div class="free-badge">Первый бесплатно</div>
      </div>

      <!-- Actions grid -->
      <div class="actions-grid">
        <div class="action-card glass haptic" @click="navigate('compatibility')">
          <div class="action-icon">💕</div>
          <div class="action-title">Совместимость</div>
          <div class="action-sub">По именам</div>
        </div>
        <div class="action-card glass haptic" @click="navigate('shop')">
          <div class="action-icon">🃏</div>
          <div class="action-title">Магазин колод</div>
          <div class="action-sub">6 тем</div>
        </div>
      </div>

      <!-- Quote -->
      <div class="quote-card glass">
        <div class="quote-text serif">"Доверьтесь своей интуиции — она знает путь"</div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { useUser } from '@/composables/useUser'
import { useDailyCard } from '@/composables/useDailyCard'

const navigate = inject<(r: string) => void>('navigate')
const { telegramUser, profile } = useUser()
const { dailyCard, isLoading: cardLoading, fetchDailyCard } = useDailyCard()

const cardFlipped = ref(false)

const userName    = computed(() => telegramUser.value?.first_name || 'Мистик')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const dateStr = computed(() =>
  new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
)

function calcLifeNumber(d: string) {
  const digits = d.replace(/-/g, '').split('').map(Number)
  let s = digits.reduce((a, b) => a + b, 0)
  while (s > 9 && s !== 11 && s !== 22 && s !== 33)
    s = String(s).split('').map(Number).reduce((a, b) => a + b, 0)
  return s
}
const lifeNumber = computed(() => profile.value?.birthDate ? calcLifeNumber(profile.value.birthDate) : 7)
const lifeNumberTitle = computed(() => {
  const m: Record<number,string> = {
    1:'Лидер', 2:'Дипломат', 3:'Творец', 4:'Строитель',
    5:'Искатель', 6:'Хранитель', 7:'Мудрец', 8:'Властитель',
    9:'Гуманист', 11:'Интуит', 22:'Созидатель', 33:'Учитель',
  }
  return m[lifeNumber.value] || 'Мудрость'
})

onMounted(() => {
  fetchDailyCard()
})
</script>

<style scoped>
.screen-wrap {
  min-height: 100vh;
  padding-bottom: 90px;
  overflow-y: auto;
}
.content { padding: 60px 20px 0; }

/* Greeting */
.greeting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
.hello { font-size: 12px; color: rgba(255,255,255,0.55); margin-bottom: 2px; text-transform: capitalize; }
.name  { font-size: 22px; }

.avatar {
  width: 44px; height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  display: flex; align-items: center; justify-content: center;
  font-weight: 600; font-size: 16px;
  position: relative; cursor: pointer;
  box-shadow: 0 4px 14px rgba(182,84,255,0.35);
}
.avatar::before {
  content: '';
  position: absolute; inset: -2px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffc857, #e94aa8, #b654ff);
  z-index: -1; opacity: 0.5;
  animation: avatar-rotate 6s linear infinite;
}
.streak-mini {
  position: absolute;
  bottom: -6px; right: -8px;
  background: linear-gradient(135deg, #ff7043, #e94aa8);
  border: 2px solid #0a0514;
  border-radius: 100px;
  padding: 2px 6px;
  font-size: 9px; font-weight: 700; color: #fff;
}

/* Tarot day card */
.tarot-day-card {
  padding: 20px 16px 22px;
  text-align: center;
  margin-bottom: 14px;
  cursor: pointer;
}
.tarot-hero-label {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .12em;
  color: rgba(255,255,255,0.55);
  font-weight: 600;
  margin-bottom: 16px;
}
.label-line { flex: 1; max-width: 40px; height: 1px; background: rgba(255,255,255,0.2); }

.tarot-card-wrapper { position: relative; display: inline-block; margin: 0 auto; }
.glow-behind {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%,-50%);
  width: 120px; height: 120px;
  background: radial-gradient(circle, rgba(255,200,87,0.25) 0%, transparent 60%);
  filter: blur(20px);
  animation: glow-pulse 3s ease-in-out infinite;
  pointer-events: none;
}

/* Mini tarot card (120×180) */
.mini-tarot-card {
  width: 110px; height: 165px;
  position: relative;
  cursor: pointer;
  margin: 0 auto;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,200,87,0.2);
  animation: card-breathe 4s ease-in-out infinite;
}
.card-face {
  position: absolute; inset: 0;
  border-radius: 10px;
  opacity: 0;
  transition: opacity 0.5s ease;
}
.mini-tarot-card:not(.flipped) .card-back  { opacity: 1; }
.mini-tarot-card.flipped     .card-front { opacity: 1; }

.card-back {
  background: linear-gradient(135deg, #3a1b6e 0%, #1a0b2e 100%);
  display: flex; align-items: center; justify-content: center;
}
.card-back-inner {
  position: absolute; inset: 6px;
  border: 1px solid rgba(255,200,87,0.4);
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}
.card-back-inner svg { width: 60%; }

.card-front {
  background: linear-gradient(160deg, #4a1d7e 0%, #2a0e4e 50%, #1a0529 100%);
  display: flex; flex-direction: column;
  align-items: center; justify-content: space-between;
  padding: 12px 8px;
  border: 1px solid rgba(255,200,87,0.3);
}
.card-roman { font-family: 'Cormorant Garamond', serif; font-size: 13px; color: #ffc857; letter-spacing: .2em; }
.card-emoji { font-size: 32px; }
.card-name  { font-size: 12px; color: #fff; text-align: center; line-height: 1.2; }

.tap-hint {
  margin-top: 14px;
  font-size: 11px;
  color: rgba(255,255,255,0.45);
  letter-spacing: .03em;
  animation: hint-pulse 2s ease-in-out infinite;
}
@keyframes hint-pulse { 0%,100%{opacity:.45} 50%{opacity:1} }
.meaning-link {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 14px;
  padding: 8px 16px;
  font-size: 12px;
  color: #e94aa8;
  font-weight: 600;
  border-radius: 100px;
  background: rgba(233,74,168,0.1);
  border: 1px solid rgba(233,74,168,0.2);
  cursor: pointer;
  width: fit-content;
  margin-left: auto;
  margin-right: auto;
}

/* Number card */
.number-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  margin-bottom: 14px;
  cursor: pointer;
}
.number-big {
  width: 60px; height: 60px;
  border-radius: 14px;
  background: linear-gradient(135deg, #ffc857, #e94aa8);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px; font-weight: 600;
  color: #1a0529;
  flex-shrink: 0;
}
.number-text { flex: 1; }
.number-label { font-size: 10px; text-transform: uppercase; letter-spacing:.1em; color: rgba(255,255,255,.5); margin-bottom: 2px; font-weight:600; }
.number-title { font-size: 16px; font-weight: 500; margin-bottom: 2px; }
.number-desc  { font-size: 11px; color: rgba(255,255,255,.5); }
.arrow-right  { font-size: 24px; color: rgba(255,255,255,.4); }

/* CTA block */
.cta-question {
  padding: 20px;
  margin-bottom: 14px;
  background: linear-gradient(135deg, #b654ff 0%, #6a2eb8 100%);
  border-radius: 22px;
  position: relative;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(255,255,255,0.15);
}
.cta-question h3 { color:#fff; margin-bottom:4px; font-family:'Cormorant Garamond',serif; font-size:20px; }
.cta-question p  { font-size:13px; color:rgba(255,255,255,.8); margin-bottom:12px; }
.cta-shine {
  position: absolute;
  top:0; left:-100%;
  width:60%; height:100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,.15), transparent);
  transform: skewX(-20deg);
  animation: cta-shine 4s ease-in-out infinite;
  pointer-events: none;
}
.cta-btn-inner {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: rgba(255,255,255,.15);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 100px;
  font-size: 13px; font-weight: 600; color:#fff;
}
.free-badge {
  position: absolute;
  top: 12px; right: 14px;
  padding: 3px 8px;
  background: rgba(255,200,87,0.9);
  color: #1a0529;
  border-radius: 6px;
  font-size: 10px; font-weight: 700;
}

/* Actions grid */
.actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 14px; }
.action-card {
  padding: 16px;
  cursor: pointer;
  text-align: left;
}
.action-icon  { font-size: 26px; margin-bottom: 8px; display: block; }
.action-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
.action-sub   { font-size: 11px; color: rgba(255,255,255,.5); }

/* Quote */
.quote-card { padding: 18px; text-align: center; }
.quote-text { font-size: 16px; color: rgba(255,255,255,.75); font-style: italic; line-height: 1.5; }
</style>

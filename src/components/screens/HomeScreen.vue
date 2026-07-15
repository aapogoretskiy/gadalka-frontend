<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- Greeting -->
      <div class="greeting">
        <div class="greeting-text">
          <div class="hello">{{ dateStr }}</div>
          <div class="name serif">{{ userName }}</div>
        </div>
        <div class="greeting-right">
          <div class="chips-row">
            <!-- Шилдик активной подписки с названием плана: квоты намеренно не выводим
                 на главной, чтобы не перегружать шапку — детали в профиле («Моя подписка») -->
            <div
              v-if="mySubscription"
              class="sub-chip haptic"
              @click="navigate('profile')"
            >
              💫 {{ mySubscription.planName }}
            </div>
            <div
              class="balance-chip haptic"
              :class="{ 'balance-chip--empty': balance === 0 }"
              @click="navigate('payment')"
            >
              🔮 {{ balance > 0 ? `${balance} ${balance === 1 ? 'знак' : balance < 5 ? 'знака' : 'знаков'}` : 'Купить' }}
            </div>
          </div>
          <div class="avatar" @click="navigate('profile')">
            {{ userInitial }}
          </div>
        </div>
      </div>

      <!-- Beta banner -->
      <div v-if="betaVisible" class="beta-banner">
        <div class="beta-left">
          <span class="beta-badge haptic" @click="onBetaTap">BETA</span>
          <div class="beta-text">
            <div class="beta-title">Бета-тестирование</div>
            <div class="beta-sub">Текущая версия не отражает конечного результата</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          <span v-if="isDev" class="dev-badge">DEV</span>
          <button class="beta-close" @click="betaVisible = false">✕</button>
        </div>
      </div>

      <!-- Баннер разрешения на уведомления: показывается, если бот не может писать
           пользователю напрямую (зашёл в MiniApp по прямой ссылке, минуя /start) -->
      <div v-if="notifBannerVisible" class="notif-banner">
        <div class="notif-left">
          <span class="notif-badge">🔔</span>
          <div class="notif-text">
            <div class="notif-title">Не пропусти расклад дня</div>
            <div class="notif-sub">Разреши боту писать тебе, чтобы получать уведомления</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
          <button class="notif-allow haptic" :disabled="notifRequesting" @click="onAllowNotifications">
            {{ notifRequesting ? '...' : 'Разрешить' }}
          </button>
          <button class="notif-close" @click="dismissNotifBanner">✕</button>
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
            <div class="card-face card-front" :class="{ 'card-front--image': dailyCard?.imageUrl }">
              <!-- Если есть картинка — показываем её на всю карту -->
              <img
                v-if="dailyCard?.imageUrl"
                :src="dailyCard.imageUrl"
                :alt="dailyCard.name"
                class="card-image"
              />
              <!-- Иначе — заглушка с эмодзи -->
              <template v-else>
                <div class="card-roman">✦</div>
                <div class="card-emoji">🌟</div>
                <div class="card-name serif">
                  {{ cardLoading ? '...' : (dailyCard?.name || 'Карта дня') }}
                </div>
              </template>
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
        <h3>Карты знают ответ</h3>
        <p>О любви, работе, важном решении.<br>Спросите — и получите разбор прямо сейчас.</p>
        <div class="cta-btn-white">Открыть расклад <span>→</span></div>
      </div>

      <!-- Сонник -->
      <div class="dream-row glass haptic" @click="navigate('dream')">
        <div class="dream-row-icon">🌙</div>
        <div class="dream-row-body">
          <div class="dream-row-overline">Сонник</div>
          <div class="dream-row-title serif">Что означал ваш сон?</div>
          <div class="dream-row-sub">Опишите — Оракул разберёт символы лично для вас</div>
        </div>
        <div class="dream-row-arrow">›</div>
      </div>

      <!-- Actions grid -->
      <div class="actions-grid">
        <div class="action-card glass haptic" @click="navigate('compatibility')">
          <div class="action-icon">💕</div>
          <div class="action-title">Совместимость</div>
          <div class="action-sub">Нумерология пары</div>
        </div>
        <div class="action-card glass haptic action-card--horoscope" @click="navigate('horoscope-day')">
          <template v-if="horoscopeNeedsBirthDate">
            <div class="action-icon">✦</div>
            <div class="action-title">Гороскоп</div>
            <div class="action-sub">Укажите дату рождения</div>
          </template>
          <template v-else>
            <div class="action-horoscope-top">
              <div class="action-horoscope-glyph">{{ zodiacGlyph(horoscope?.zodiacSign) }}</div>
              <div class="action-horoscope-score" v-if="horoscope?.generalScore">
                <span class="action-score-num">{{ horoscope.generalScore }}</span>
                <span class="action-score-max">/5</span>
              </div>
            </div>
            <div class="action-title">Гороскоп</div>
            <div class="action-sub">{{ horoscopeLoading ? '…' : (horoscope?.zodiacSign || '') }}</div>
          </template>
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
import { useHoroscope } from '@/composables/useHoroscope'
import { useDevMode } from '@/composables/useDevMode'
import { useBalance } from '@/composables/useBalance'
import { useMySubscription } from '@/composables/useMySubscription'
import { useToast } from '@/composables/useToast'
import { zodiacGlyph } from '@/utils/zodiac'
import { canRequestWriteAccess, requestWriteAccess } from '@/utils/telegram'
import { api, type NumerologyTodayResponse } from '@/utils/api'

const navigate = inject<(r: string) => void>('navigate')
const { telegramUser } = useUser()
const { dailyCard, isLoading: cardLoading, fetchDailyCard } = useDailyCard()
const { horoscope, isLoading: horoscopeLoading, needsBirthDate: horoscopeNeedsBirthDate, fetchHoroscope } = useHoroscope()
const { isDev, toggleDevMode } = useDevMode()
const { balance, hasCredits, refreshBalance } = useBalance()
// Активная подписка (название плана для шилдика в шапке)
const { mySubscription, refreshSubscription } = useMySubscription()
const { addToast } = useToast()

const cardFlipped    = ref(false)
const betaVisible    = ref(true)
const numerologyData = ref<NumerologyTodayResponse | null>(null)

// ── Баннер разрешения на уведомления ────────────────────────────────────────
// Дизмисс не насовсем — храним таймстемп в localStorage и не показываем банер
// повторно N дней, чтобы не превращать это в надоедливый попап (см. обсуждение
// с администратором проекта: "баннер не надолго").
const NOTIF_BANNER_DISMISS_KEY = 'notif_banner_dismissed_at'
const NOTIF_BANNER_COOLDOWN_MS = 3 * 24 * 60 * 60 * 1000 // 3 дня

const notifRequesting = ref(false)
const notifDismissedThisSession = ref(false)

const notifBannerVisible = computed(() => {
  if (notifDismissedThisSession.value) return false
  if (telegramUser.value?.notificationsAllowed) return false
  if (!canRequestWriteAccess()) return false

  const dismissedAt = Number(localStorage.getItem(NOTIF_BANNER_DISMISS_KEY) || 0)
  if (dismissedAt && Date.now() - dismissedAt < NOTIF_BANNER_COOLDOWN_MS) return false

  return true
})

const dismissNotifBanner = () => {
  localStorage.setItem(NOTIF_BANNER_DISMISS_KEY, String(Date.now()))
  notifDismissedThisSession.value = true
}

const onAllowNotifications = async () => {
  notifRequesting.value = true
  try {
    const allowed = await requestWriteAccess()
    if (allowed) {
      // Оптимистично обновляем локальное состояние — реальный флаг на бэке
      // проставится чуть позже, когда боту придёт write_access_allowed
      if (telegramUser.value) telegramUser.value.notificationsAllowed = true
      addToast('Отлично! Теперь бот сможет присылать уведомления 🔮', 'success')
    } else {
      dismissNotifBanner()
    }
  } finally {
    notifRequesting.value = false
  }
}

// Секретный триггер: 5 тапов по BETA-бейджу за 3 секунды → включить/выключить DEV MODE
const betaTapCount = ref(0)
let betaTapTimer: ReturnType<typeof setTimeout> | null = null
function onBetaTap() {
  betaTapCount.value++
  if (betaTapTimer) clearTimeout(betaTapTimer)
  betaTapTimer = setTimeout(() => { betaTapCount.value = 0 }, 3000)
  if (betaTapCount.value >= 5) {
    betaTapCount.value = 0
    toggleDevMode()
  }
}

const userName    = computed(() => telegramUser.value?.first_name || 'Мистик')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())

const dateStr = computed(() =>
  new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
)

const lifeNumber      = computed(() => numerologyData.value?.dayCode || '—')
const lifeNumberTitle = computed(() => numerologyData.value?.dayCodeTitle || '')


onMounted(async () => {
  fetchDailyCard()
  fetchHoroscope()
  // Актуальный баланс + активная подписка (для шилдика в шапке)
  refreshBalance()
  refreshSubscription()
  try {
    const res = await api.getNumerologyToday()
    numerologyData.value = res.data
  } catch {
    // Превью не критично — молча игнорируем если профиль не заполнен
  }
})
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
}
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 20px) 20px 0; }

/* Beta banner */
.beta-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(255,200,87,0.12), rgba(255,160,50,0.07));
  border: 1px solid rgba(255,200,87,0.3);
  border-radius: 14px;
}
.beta-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.beta-badge {
  flex-shrink: 0;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(255,200,87,0.9);
  color: #1a0529;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .08em;
}
.beta-text { min-width: 0; }
.beta-title {
  font-size: 12px;
  font-weight: 700;
  color: #ffc857;
  margin-bottom: 2px;
}
.beta-sub {
  font-size: 11px;
  color: rgba(255,200,87,0.65);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.dev-badge {
  padding: 3px 7px;
  border-radius: 6px;
  background: rgba(112,224,168,0.9);
  color: #0a3a2a;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .08em;
}
.beta-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255,200,87,0.12);
  border: none;
  color: rgba(255,200,87,0.6);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Notifications permission banner */
.notif-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 16px;
  background: linear-gradient(135deg, rgba(182,84,255,0.14), rgba(233,74,168,0.08));
  border: 1px solid rgba(182,84,255,0.35);
  border-radius: 14px;
}
.notif-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.notif-badge {
  flex-shrink: 0;
  font-size: 18px;
  line-height: 1;
}
.notif-text { min-width: 0; }
.notif-title {
  font-size: 12px;
  font-weight: 700;
  color: #e0b8ff;
  margin-bottom: 2px;
}
.notif-sub {
  font-size: 11px;
  color: rgba(224,184,255,0.65);
  line-height: 1.4;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.notif-allow {
  flex-shrink: 0;
  padding: 6px 12px;
  border-radius: 8px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  border: none;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.notif-allow:disabled { opacity: 0.6; }
.notif-close {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(182,84,255,0.12);
  border: none;
  color: rgba(224,184,255,0.6);
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

/* Greeting */
.greeting {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 22px;
}
.hello { font-size: 12px; color: rgba(255,255,255,0.55); margin-bottom: 2px; text-transform: capitalize; }
.name  { font-size: 22px; }

.greeting-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.balance-chip {
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(255,200,87,0.15);
  border: 1px solid rgba(255,200,87,0.35);
  color: #ffc857;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}
.balance-chip--empty {
  background: rgba(182,84,255,0.15);
  border-color: rgba(182,84,255,0.35);
  color: #b654ff;
}

.chips-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Шилдик активной подписки — ведёт в профиль, к остаткам квот */
.sub-chip {
  max-width: 140px;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4px 10px;
  border-radius: 20px;
  background: rgba(182,84,255,0.15);
  border: 1px solid rgba(182,84,255,0.35);
  color: #d9a6ff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

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
/* Когда есть реальная картинка — убираем фиолетовый фон и рамку */
.card-front--image {
  background: #000;
  border-color: transparent;
  padding: 0;
}
.card-roman { font-family: 'Cormorant Garamond', serif; font-size: 13px; color: #ffc857; letter-spacing: .2em; }
.card-emoji { font-size: 32px; }
.card-name  { font-size: 12px; color: #fff; text-align: center; line-height: 1.2; }
.card-image { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; display: block; border-radius: 10px; }

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
/* Белая pill-кнопка внутри CTA — по макету «Открыть расклад →» */
.cta-btn-white {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #fff;
  border-radius: 100px;
  font-size: 13px; font-weight: 700;
  color: #6a2eb8;
  box-shadow: 0 4px 14px rgba(0,0,0,0.2);
}

/* Сонник — строчная карточка по макету: иконка + оверлайн + заголовок + подпись */
.dream-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  margin-bottom: 14px;
  cursor: pointer;
}
.dream-row-icon {
  width: 52px; height: 52px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(182,84,255,0.3), rgba(106,46,184,0.25));
  border: 1px solid rgba(182,84,255,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 26px;
  flex-shrink: 0;
}
.dream-row-body { flex: 1; min-width: 0; }
.dream-row-overline {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: .14em;
  color: #b654ff;
  font-weight: 700;
  margin-bottom: 3px;
}
.dream-row-title { font-size: 17px; color: #F5ECFF; margin-bottom: 3px; }
.dream-row-sub {
  font-size: 12px;
  color: rgba(255,255,255,0.55);
  line-height: 1.4;
}
.dream-row-arrow { font-size: 24px; color: rgba(255,255,255,0.35); flex-shrink: 0; }

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

/* Horoscope action card extras */
.action-horoscope-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}
.action-horoscope-glyph {
  width: 34px; height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(182,84,255,0.25), rgba(233,74,168,0.15));
  border: 1px solid rgba(182,84,255,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 17px;
  color: #e0c3ff;
}
.action-horoscope-score {
  display: flex;
  align-items: baseline;
  font-family: 'Cormorant Garamond', serif;
  color: #ffc857;
}
.action-score-num { font-size: 20px; font-weight: 600; }
.action-score-max { font-size: 11px; opacity: .6; }

/* Quote */
.quote-card { padding: 18px; text-align: center; }
.quote-text { font-size: 16px; color: rgba(255,255,255,.75); font-style: italic; line-height: 1.5; }
</style>

<template>
  <div class="app-shell">
    <!-- Atmospheric background -->
    <div class="bg-atmosphere">
      <div class="bg-orb o1"></div>
      <div class="bg-orb o2"></div>
      <div class="bg-orb o3"></div>
      <div ref="starsRef" class="stars-layer"></div>
    </div>

    <!-- Splash-лоадер при инициализации -->
    <Transition name="fade">
      <div v-if="isInitializing" class="splash-loader">
        <div class="splash-orb">
          <div class="splash-orb-core"></div>
          <div class="splash-orb-ring r1"></div>
          <div class="splash-orb-ring r2"></div>
        </div>
        <p class="splash-text">Загружаем...</p>
      </div>
    </Transition>

    <!-- Screens -->
    <Transition :name="transitionName" mode="out-in">
      <component v-if="!isInitializing" :is="currentScreen" :key="currentRoute" />
    </Transition>

    <!-- Bottom Navigation -->
    <BottomNav v-if="!isInitializing && showNav" :active-tab="activeTab" @change="handleTabChange" />

    <!-- Global error toasts -->
    <ToastContainer />

    <!-- Глобальная модалка выбора способа списания (знаки / квота подписки) -->
    <SpendConfirmModal />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide, watch } from 'vue'
import WebApp from '@twa-dev/sdk'
import { useTelegram } from './composables/useTelegram'
import { useUser } from './composables/useUser'
import { useToast } from './composables/useToast'
import { useInbox } from './composables/useInbox'

// Screens
import HomeScreen          from './components/screens/HomeScreen.vue'
import TarotDeckScreen     from './components/screens/TarotDeckScreen.vue'
import TarotDayDetailedScreen from './components/screens/TarotDayDetailedScreen.vue'
import HoroscopeDetailedScreen from './components/screens/HoroscopeDetailedScreen.vue'
import NumerologyScreen    from './components/screens/NumerologyScreen.vue'
import WeekSpreadScreen    from './components/screens/WeekSpreadScreen.vue'
import MonthSpreadScreen   from './components/screens/MonthSpreadScreen.vue'
import YearSpreadScreen    from './components/screens/YearSpreadScreen.vue'
import NumerologyPortraitScreen from './components/screens/NumerologyPortraitScreen.vue'
import CompatibilityScreen from './components/screens/CompatibilityScreen.vue'
import AstroScreen         from './components/screens/AstroScreen.vue'
import DreamScreen         from './components/screens/DreamScreen.vue'
import ProfileScreen       from './components/screens/ProfileScreen.vue'
import OnboardingScreen    from './components/screens/OnboardingScreen.vue'
import CardDiaryScreen     from './components/screens/CardDiaryScreen.vue'
import DeckShopScreen      from './components/screens/DeckShopScreen.vue'
import FortuneScreen          from './components/screens/FortuneScreen.vue'
import PaymentScreen          from './components/screens/PaymentScreen.vue'
import FeedbackScreen         from './components/screens/FeedbackScreen.vue'
import InboxScreen            from './components/screens/InboxScreen.vue'

import BottomNav from './components/BottomNav.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import SpendConfirmModal from './components/ui/SpendConfirmModal.vue'

const { hapticFeedback } = useTelegram()
const { authWithTelegram, fetchProfile, hasProfile, termsAccepted } = useUser()
const { addToast } = useToast()
const { refreshUnreadCount } = useInbox()

const currentRoute   = ref<string>('onboarding')
const historyStack   = ref<string[]>([])
const transitionName = ref<string>('fade')
const activeTab      = ref<string>('home')
const starsRef       = ref<HTMLElement | null>(null)
const isInitializing = ref<boolean>(true)

// Скрины без нижней навигации
const showNav = computed(() =>
  !['onboarding', 'payment'].includes(currentRoute.value)
)

const currentScreen = computed(() => {
  const screens: Record<string, any> = {
    onboarding:    OnboardingScreen,
    home:          HomeScreen,
    tarot:         TarotDeckScreen,
    'tarot-day':   TarotDayDetailedScreen,
    'horoscope-day': HoroscopeDetailedScreen,
    numerology:    NumerologyPortraitScreen,
    'numerology-day':     NumerologyScreen,
    'numerology-week':    WeekSpreadScreen,
    'numerology-month':   MonthSpreadScreen,
    'numerology-year':    YearSpreadScreen,
    compatibility: CompatibilityScreen,
    astro:         AstroScreen,
    dream:         DreamScreen,
    fortune:           FortuneScreen,
    payment:           PaymentScreen,
    profile:           ProfileScreen,
    feedback:          FeedbackScreen,
    inbox:         InboxScreen,
    diary:         CardDiaryScreen,
    shop:          DeckShopScreen,
  }
  return screens[currentRoute.value] || HomeScreen
})

// Вкладки нижней навигации (payment — не вкладка, открывается поверх).
// «Совместимость» убрана из вкладок (осталась кнопка на главной), на её месте — «Астро».
const tabOrder = ['home', 'numerology', 'fortune', 'astro', 'profile']

// Параметры для текущего перехода (например, дата конкретной недели при переходе
// из месячного разбора). Сбрасываются на null при каждом navigate() без явных params,
// чтобы не "утекали" в последующие обычные переходы на тот же экран.
const routeParams = ref<Record<string, any> | null>(null)

const navigate = (route: string, params?: Record<string, any>) => {
  const prev = currentRoute.value
  historyStack.value.push(prev)
  currentRoute.value = route
  routeParams.value = params ?? null

  // Синхронизируем подсветку нижней панели вне зависимости от источника перехода
  if (tabOrder.includes(route)) {
    activeTab.value = route
  }

  // Направление анимации по порядку вкладок
  const from = tabOrder.indexOf(prev)
  const to   = tabOrder.indexOf(route)
  if (from !== -1 && to !== -1) {
    transitionName.value = from < to ? 'slide-left' : 'slide-right'
  } else {
    transitionName.value = 'fade'
  }

  try { hapticFeedback.light() } catch {}
}

const handleTabChange = (tab: string) => {
  // При переключении вкладок сбрасываем стек истории — переход по вкладке
  // не должен накапливаться, иначе "Назад" будет листать все прошлые вкладки
  historyStack.value = []
  navigate(tab)
}

// previousRoute как computed для обратной совместимости
const previousRoute = computed(() => historyStack.value[historyStack.value.length - 1] || '')

provide('navigate', navigate)
provide('previousRoute', previousRoute)
provide('routeParams', routeParams)

// ── Telegram BackButton ──────────────────────────────────────────────────────
// Единый master-handler: компоненты могут переопределить действие через
// setBackOverride (например, закрыть открытый bottom-sheet вместо навигации).
const backOverride = ref<(() => void) | null>(null)
provide('setBackOverride', (fn: (() => void) | null) => { backOverride.value = fn })

const masterBackHandler = () => {
  if (backOverride.value) {
    backOverride.value()
    return
  }

  const prev = historyStack.value.pop()
  if (prev && prev !== 'onboarding') {
    // Анимация обратная: если шли вправо — теперь идём влево и наоборот
    const from = tabOrder.indexOf(currentRoute.value)
    const to   = tabOrder.indexOf(prev)
    if (from !== -1 && to !== -1) {
      transitionName.value = from > to ? 'slide-right' : 'slide-left'
    } else {
      transitionName.value = 'fade'
    }
    currentRoute.value = prev
    if (tabOrder.includes(prev)) activeTab.value = prev
  } else {
    // Стек пуст или там только onboarding — идём на главную
    transitionName.value = 'fade'
    currentRoute.value = 'home'
    activeTab.value = 'home'
  }
}
try { WebApp.BackButton.onClick(masterBackHandler) } catch {}

watch(currentRoute, (route) => {
  backOverride.value = null  // сбрасываем override при смене экрана
  if (route !== 'home' && route !== 'onboarding') {
    try { WebApp.BackButton.show() } catch {}
  } else {
    try { WebApp.BackButton.hide() } catch {}
  }
}, { immediate: true })

// Генерируем звёздный фон
const spawnStars = () => {
  if (!starsRef.value) return
  for (let i = 0; i < 40; i++) {
    const s = document.createElement('div')
    s.className = 'star'
    const size = Math.random() * 2 + 1
    s.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      top:${Math.random() * 100}%;
      animation-delay:${Math.random() * 4}s;
      animation-duration:${2 + Math.random() * 3}s;
    `
    starsRef.value.appendChild(s)
  }
}

onMounted(async () => {
  spawnStars()

  // Сообщаем Telegram что приложение готово — до любых await,
  // иначе Telegram покажет серый экран и закроет WebView по таймауту
  try { WebApp.ready() } catch {}
  try { WebApp.expand() } catch {}

  // Когда клавиатура появляется — visualViewport уменьшается.
  // Прокручиваем активный input/textarea в видимую область чтобы он
  // не оказался под клавиатурой.
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', () => {
      const el = document.activeElement as HTMLElement | null
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA')) {
        // Небольшая задержка — браузер ещё анимирует появление клавиатуры
        setTimeout(() => {
          el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        }, 100)
      }
    })
  }

  // Блокируем горизонтальную ориентацию
  try { WebApp.lockOrientation() } catch {}
  try { screen.orientation.lock('portrait') } catch {}

  // Страховочный таймаут: если авторизация зависнет (нет сети в Telegram WebView),
  // гарантированно убираем splash-лоадер через 12 секунд
  const safetyTimer = setTimeout(() => {
    isInitializing.value = false
  }, 12000)

  const authed = await authWithTelegram()
  if (authed) {
    if (authed.isNewUser) {
      addToast('Добро пожаловать! Вам начислено 5 знаков в подарок 🔮', 'success')
    }
    try { await fetchProfile() } catch {}
    refreshUnreadCount() // не ждём — шилдик на кнопке "Входящие" подтянется когда придёт

    // Гейт онбординга: раньше в приложение пускали только с заполненным профилем,
    // теперь профиль опционален — достаточно принятой оферты (welcome-экран).
    // Новички без согласия остаются на OnboardingScreen (welcome-путь).
    if (termsAccepted.value || hasProfile.value) {
      navigate('home')
      activeTab.value = 'home'

      // Deep-link из сообщений бота: кнопка «Оплатить картой» в напоминании
      // о брошенной оплате открывает Mini App с ?screen=pay (см. PaymentRecoveryService
      // на бэке). Сначала navigate('home') выше — чтобы кнопка «Назад» с экрана
      // оплаты вела на главную, а не в пустоту.
      const deepScreen = new URLSearchParams(window.location.search).get('screen')
      if (deepScreen === 'pay') {
        navigate('payment')
      }
    }
  }

  clearTimeout(safetyTimer)
  isInitializing.value = false
})
</script>

<style>
.app-shell {
  position: relative;
  min-height: var(--tg-viewport-stable-height, 100vh);
  background: #0a0514;
  color: #F5ECFF;
  overflow-x: hidden;
  font-family: 'Manrope', sans-serif;
}

.bg-atmosphere {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 0;
}
.stars-layer {
  position: absolute;
  inset: 0;
}

/* Screens need position:relative for absolutely-positioned children.
   No z-index here so modal-overlay (z-index:100, position:fixed) stays in root
   stacking context and renders above the nav (z-index:50). Screen appears above
   bg-atmosphere via DOM order (later sibling wins at same z-index:auto level). */
.app-shell > *:not(.bg-atmosphere):not(nav):not(.splash-loader) {
  position: relative;
}

/* ── Splash loader ── */
.splash-loader {
  position: fixed;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 28px;
  background: #0a0514;
}
.splash-orb {
  position: relative;
  width: 100px;
  height: 100px;
}
.splash-orb-core {
  position: absolute;
  inset: 20px;
  border-radius: 50%;
  background: radial-gradient(circle, #b654ff, #e94aa8);
  box-shadow: 0 0 40px rgba(182,84,255,0.6);
}
.splash-orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(182,84,255,0.35);
  animation: center-ring 2.5s ease-out infinite;
}
.splash-orb-ring.r1 { inset: 10px; animation-delay: 0s; }
.splash-orb-ring.r2 { inset: 0;    animation-delay: 0.8s; }
@keyframes center-ring {
  0%   { opacity: 0.7; transform: scale(1); }
  100% { opacity: 0;   transform: scale(1.6); }
}
.splash-text {
  font-size: 14px;
  color: rgba(255,255,255,0.45);
  letter-spacing: .06em;
  margin: 0;
}

/* ── Transitions ── */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,  .fade-leave-to      { opacity: 0; }

.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: opacity 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1);
}
.slide-left-enter-from  { opacity: 0; transform: translateX(30px); }
.slide-left-leave-to    { opacity: 0; transform: translateX(-30px); }
.slide-right-enter-from { opacity: 0; transform: translateX(-30px); }
.slide-right-leave-to   { opacity: 0; transform: translateX(30px); }
</style>

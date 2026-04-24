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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide, watch } from 'vue'
import WebApp from '@twa-dev/sdk'
import { useTelegram } from './composables/useTelegram'
import { useUser } from './composables/useUser'

// Screens
import HomeScreen          from './components/screens/HomeScreen.vue'
import TarotDeckScreen     from './components/screens/TarotDeckScreen.vue'
import TarotDayDetailedScreen from './components/screens/TarotDayDetailedScreen.vue'
import NumerologyScreen    from './components/screens/NumerologyScreen.vue'
import CompatibilityScreen from './components/screens/CompatibilityScreen.vue'
import ProfileScreen       from './components/screens/ProfileScreen.vue'
import OnboardingScreen    from './components/screens/OnboardingScreen.vue'
import CardDiaryScreen     from './components/screens/CardDiaryScreen.vue'
import HistoryScreen       from './components/screens/HistoryScreen.vue'
import DeckShopScreen      from './components/screens/DeckShopScreen.vue'
import FortuneScreen       from './components/screens/FortuneScreen.vue'

import BottomNav from './components/BottomNav.vue'
import ToastContainer from './components/ui/ToastContainer.vue'

const { hapticFeedback } = useTelegram()
const { authWithTelegram, fetchProfile, hasProfile } = useUser()

const currentRoute   = ref<string>('onboarding')
const previousRoute  = ref<string>('')
const transitionName = ref<string>('fade')
const activeTab      = ref<string>('home')
const starsRef       = ref<HTMLElement | null>(null)
const isInitializing = ref<boolean>(true)

// Скрины без нижней навигации
const showNav = computed(() =>
  !['onboarding'].includes(currentRoute.value)
)

const currentScreen = computed(() => {
  const screens: Record<string, any> = {
    onboarding:    OnboardingScreen,
    home:          HomeScreen,
    tarot:         TarotDeckScreen,
    'tarot-day':   TarotDayDetailedScreen,
    numerology:    NumerologyScreen,
    compatibility: CompatibilityScreen,
    fortune:       FortuneScreen,
    profile:       ProfileScreen,
    diary:         CardDiaryScreen,
    history:       HistoryScreen,
    shop:          DeckShopScreen,
  }
  return screens[currentRoute.value] || HomeScreen
})

const tabOrder = ['home', 'numerology', 'fortune', 'shop', 'profile']

const navigate = (route: string) => {
  previousRoute.value = currentRoute.value
  currentRoute.value  = route

  // Синхронизируем подсветку нижней панели вне зависимости от источника перехода
  if (tabOrder.includes(route)) {
    activeTab.value = route
  }

  // Направление анимации по порядку вкладок
  const from = tabOrder.indexOf(previousRoute.value)
  const to   = tabOrder.indexOf(route)
  if (from !== -1 && to !== -1) {
    transitionName.value = from < to ? 'slide-left' : 'slide-right'
  } else {
    transitionName.value = 'fade'
  }

  try { hapticFeedback.light() } catch {}
}

const handleTabChange = (tab: string) => {
  navigate(tab) // activeTab синхронизируется внутри navigate()
}

provide('navigate', navigate)
provide('previousRoute', previousRoute)

// ── Telegram BackButton ──────────────────────────────────────────────────────
// Единый master-handler: компоненты могут переопределить действие через
// setBackOverride (например, закрыть открытый bottom-sheet вместо навигации).
const backOverride = ref<(() => void) | null>(null)
provide('setBackOverride', (fn: (() => void) | null) => { backOverride.value = fn })

const masterBackHandler = () => {
  if (backOverride.value) {
    backOverride.value()
  } else {
    navigate(previousRoute.value || 'home')
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

  // Страховочный таймаут: если авторизация зависнет (нет сети в Telegram WebView),
  // гарантированно убираем splash-лоадер через 12 секунд
  const safetyTimer = setTimeout(() => {
    isInitializing.value = false
  }, 12000)

  const authed = await authWithTelegram()
  if (authed) {
    try { await fetchProfile() } catch {}
    if (hasProfile.value) {
      navigate('home')
      activeTab.value = 'home'
    }
  }

  clearTimeout(safetyTimer)
  isInitializing.value = false
})
</script>

<style>
.app-shell {
  position: relative;
  min-height: 100vh;
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

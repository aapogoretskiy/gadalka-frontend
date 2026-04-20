<template>
  <div class="app-shell">
    <!-- Atmospheric background -->
    <div class="bg-atmosphere">
      <div class="bg-orb o1"></div>
      <div class="bg-orb o2"></div>
      <div class="bg-orb o3"></div>
      <div ref="starsRef" class="stars-layer"></div>
    </div>

    <!-- Screens -->
    <Transition :name="transitionName" mode="out-in">
      <component :is="currentScreen" :key="currentRoute" />
    </Transition>

    <!-- Bottom Navigation -->
    <BottomNav v-if="showNav" :active-tab="activeTab" @change="handleTabChange" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, provide } from 'vue'
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

const { hapticFeedback } = useTelegram()
const { authWithTelegram, fetchProfile, hasProfile } = useUser()

const currentRoute  = ref<string>('onboarding')
const previousRoute = ref<string>('')
const transitionName = ref<string>('fade')
const activeTab     = ref<string>('home')
const starsRef      = ref<HTMLElement | null>(null)

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

  const authed = await authWithTelegram()
  if (authed) {
    try { await fetchProfile() } catch {}
    if (hasProfile.value) {
      navigate('home')
      activeTab.value = 'home'
    }
  }
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

/* All content sits above the background */
.app-shell > *:not(.bg-atmosphere) {
  position: relative;
  z-index: 1;
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

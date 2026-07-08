<template>
  <nav class="tabs">
    <!-- Главная -->
    <button class="tab-btn" :class="{ active: activeTab === 'home' }" @click="$emit('change', 'home')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <path d="M9 21V12h6v9"/>
      </svg>
      <span>Главная</span>
    </button>

    <!-- Числа -->
    <button class="tab-btn" :class="{ active: activeTab === 'numerology' }" @click="onTabClick('numerology')">
      <span v-if="hasUnseenNew('numerology')" class="nav-new-dot"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 8v4l3 3"/>
      </svg>
      <span>Числа</span>
    </button>

    <!-- Центральная кнопка — Гадание -->
    <button class="tab-btn center" @click="$emit('change', 'fortune')">
      <div class="center-circle" :class="{ 'center-active': activeTab === 'fortune' }">
        ✦
      </div>
      <span>Гадание</span>
    </button>

    <!-- Астро (Сонник, Гороскоп) -->
    <button class="tab-btn" :class="{ active: activeTab === 'astro' }" @click="onTabClick('astro')">
      <span v-if="hasUnseenNew('astro')" class="nav-new-dot"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z"/>
        <path d="M17 4l.9 2.1L20 7l-2.1.9L17 10l-.9-2.1L14 7l2.1-.9L17 4z"/>
      </svg>
      <span>Астро</span>
    </button>

    <!-- Профиль -->
    <button class="tab-btn tab-btn--profile" :class="{ active: activeTab === 'profile' }" @click="$emit('change', 'profile')">
      <span class="tab-icon-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
        <span v-if="unreadCount > 0" class="tab-unread-dot"></span>
      </span>
      <span>Профиль</span>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useInbox } from '@/composables/useInbox'
import { useFeatureBadges } from '@/composables/useFeatureBadges'
import { useNewFeatureDots } from '@/composables/useNewFeatureDots'

defineProps<{ activeTab: string }>()
const emit = defineEmits<{ change: [tab: string] }>()

// Красная точка на вкладке "Профиль" — чтобы пользователь узнал о новом сообщении
// во "Входящих", даже не заходя в сам раздел. Тот же синглтон-счётчик, что и шилдик
// с числом внутри Profile (см. ProfileScreen.vue) — обновляется сам после markAllRead.
const { unreadCount } = useInbox()

// Жёлтые точки «Новинка» на вкладках — управляются админом (вкладка «Цены»),
// см. useNewFeatureDots.ts. Грузим бейджи здесь же (а не только на конкретных
// экранах), чтобы точки были актуальны независимо от того, какой экран сейчас
// открыт — BottomNav виден всегда.
const { loadFeatureBadges } = useFeatureBadges()
const { hasUnseenNew, acknowledgeTab } = useNewFeatureDots()

onMounted(() => {
  loadFeatureBadges()
})

function onTabClick(tab: string) {
  acknowledgeTab(tab)
  emit('change', tab)
}
</script>

<style scoped>
.tabs {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: calc(78px + var(--tg-safe-area-inset-bottom, 0px));
  background: rgba(10, 5, 20, 0.92);
  backdrop-filter: blur(28px);
  -webkit-backdrop-filter: blur(28px);
  border-top: 1px solid rgba(255,255,255,0.06);
  display: flex;
  justify-content: space-around;
  align-items: flex-start;
  padding: 10px 4px calc(20px + var(--tg-safe-area-inset-bottom, 0px));
  z-index: 50;
}

.tab-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  background: none;
  border: none;
  color: rgba(255,255,255,0.45);
  cursor: pointer;
  font-family: 'Manrope', sans-serif;
  font-size: 10px;
  font-weight: 500;
  padding: 4px 8px;
  flex: 1;
  position: relative;
  transition: color 0.2s;
}

.tab-btn svg {
  width: 22px; height: 22px;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tab-btn.active {
  color: #e94aa8;
}
.tab-btn.active svg {
  transform: translateY(-2px);
}

/* Active indicator line */
.tab-btn.active::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 20px; height: 3px;
  border-radius: 0 0 3px 3px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  box-shadow: 0 0 10px rgba(233,74,168,0.6);
  animation: tab-indicator 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes tab-indicator {
  from { width: 0; opacity: 0; }
  to   { width: 20px; opacity: 1; }
}

/* Center button */
.tab-btn.center {
  position: relative;
  top: -14px;
  color: rgba(255,255,255,0.6);
}
.tab-btn.center span {
  margin-top: 4px;
}

.center-circle {
  width: 54px; height: 54px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff 0%, #e94aa8 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #fff;
  box-shadow: 0 8px 24px rgba(182,84,255,0.5);
  position: relative;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1),
              box-shadow 0.3s ease;
}
.center-circle::before {
  content: '';
  position: absolute;
  inset: -3px;
  border-radius: 50%;
  border: 2px solid rgba(233,74,168,0.4);
  animation: center-ring 2.5s ease-out infinite;
}
.center-circle.center-active {
  box-shadow: 0 12px 32px rgba(233,74,168,0.7);
  transform: scale(1.08);
}

.tab-btn:active svg { transform: scale(0.88); }
.tab-btn.center:active .center-circle { transform: scale(0.92); }

/* Шилдик непрочитанных на вкладке "Профиль" */
.tab-icon-wrap { position: relative; display: inline-flex; }
.tab-unread-dot {
  position: absolute;
  top: -1px; right: -3px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  box-shadow: 0 0 6px rgba(233,74,168,0.7), 0 0 0 2px rgba(10,5,20,0.92);
}

/* Жёлтая точка «есть непросмотренная новинка» на вкладках Числа/Астро */
.nav-new-dot {
  position: absolute;
  top: 2px;
  left: 50%;
  margin-left: 6px;
  width: 8px; height: 8px;
  border-radius: 50%;
  background: #ffc857;
  box-shadow: 0 0 6px rgba(255,200,87,0.8), 0 0 0 2px rgba(10,5,20,0.92);
}
</style>

<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- Avatar hero -->
      <div class="profile-hero">
        <div class="avatar-ring">
          <div class="avatar-circle">{{ userInitial }}</div>
        </div>
        <div class="profile-name serif">{{ userName }}</div>
        <div class="profile-title">Хранитель тайн</div>
        <div class="profile-date" v-if="userBirthdate">{{ userBirthdate }}</div>
      </div>

      <!-- Stats row (временно скрыт — расчёт на бэке не реализован) -->

      <!-- Life number -->
      <div class="life-card gradient-card">
        <div class="life-inner">
          <div class="life-num">{{ lifeNumber }}</div>
          <div class="life-text">
            <div class="life-label">Число жизни</div>
            <div class="life-title serif">{{ lifeNumberTitle }}</div>
            <div class="life-sub">Ваш путь предназначения</div>
          </div>
          <button class="life-arrow haptic" @click="navigate('numerology')">›</button>
        </div>
      </div>

      <!-- Menu -->
      <div class="menu-list">
        <button class="menu-item glass haptic" @click="navigate('shop')">
          <div class="menu-icon">🃏</div>
          <div class="menu-body">
            <div class="menu-title">Мои колоды</div>
            <div class="menu-sub">Классическая активна</div>
          </div>
          <div class="menu-arrow">›</div>
        </button>

        <button class="menu-item glass haptic" @click="navigate('diary')">
          <div class="menu-icon">📜</div>
          <div class="menu-body">
            <div class="menu-title">История</div>
            <div class="menu-sub">Ваши расклады и расчёты</div>
          </div>
          <div class="menu-arrow">›</div>
        </button>

        <button class="menu-item glass menu-item--disabled">
          <div class="menu-icon">📔</div>
          <div class="menu-body">
            <div class="menu-title">Дневник карт</div>
            <div class="menu-sub">Личные заметки к картам</div>
          </div>
          <ComingSoonBadge />
        </button>

        <button class="menu-item glass haptic">
          <div class="menu-icon">🔔</div>
          <div class="menu-body">
            <div class="menu-title">Уведомления</div>
            <div class="menu-sub">Ежедневная карта в 9:00</div>
          </div>
          <div class="menu-arrow">›</div>
        </button>
      </div>

      <!-- Logout -->
      <button class="logout-btn haptic" @click="handleLogout">
        Выйти из аккаунта
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { useUser } from '@/composables/useUser'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'

const navigate = inject<(r: string) => void>('navigate')
const { telegramUser, profile, logout } = useUser()

const userName    = computed(() => telegramUser.value?.first_name || 'Мистик')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userBirthdate = computed(() => {
  if (!profile.value?.birthDate) return ''
  return new Date(profile.value.birthDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

function calcLifeNumber(d: string) {
  const digits = d.replace(/-/g, '').split('').map(Number)
  let s = digits.reduce((a, b) => a + b, 0)
  while (s > 9 && s !== 11 && s !== 22 && s !== 33)
    s = String(s).split('').map(Number).reduce((a, b) => a + b, 0)
  return s
}
const lifeNumber = computed(() => profile.value?.birthDate ? calcLifeNumber(profile.value.birthDate) : 7)
const lifeNumberTitle = computed(() => {
  const m: Record<number, string> = {
    1:'Лидер', 2:'Дипломат', 3:'Творец', 4:'Строитель', 5:'Искатель',
    6:'Хранитель', 7:'Мудрец', 8:'Властитель', 9:'Гуманист',
    11:'Интуит', 22:'Созидатель', 33:'Учитель',
  }
  return m[lifeNumber.value] || 'Мудрость'
})

const handleLogout = () => {
  logout()
  navigate?.('home')
}
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 90px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

/* Hero */
.profile-hero {
  display: flex; flex-direction: column; align-items: center;
  padding: 20px 0 28px; text-align: center;
}
.avatar-ring {
  width: 96px; height: 96px; border-radius: 50%;
  background: linear-gradient(135deg, #ffc857, #e94aa8, #b654ff);
  padding: 2px; margin-bottom: 14px;
}
.avatar-circle {
  width: 100%; height: 100%; border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  display: flex; align-items: center; justify-content: center;
  font-size: 36px; font-weight: 600; color: #fff;
}
.profile-name  { font-size: 26px; margin-bottom: 4px; }
.profile-title { font-size: 12px; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.5); font-weight: 600; }
.profile-date  { font-size: 13px; color: rgba(255,255,255,.45); margin-top: 6px; }

/* Stats */
.stats-row {
  display: flex; align-items: center; justify-content: space-around;
  padding: 16px; margin-bottom: 14px;
}
.stat-item { flex: 1; text-align: center; }
.stat-val   { font-size: 18px; font-weight: 700; margin-bottom: 2px; }
.stat-label { font-size: 10px; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing: .06em; font-weight: 600; }
.stat-div   { width: 1px; height: 32px; background: rgba(255,255,255,.08); }

/* Life card */
.life-card { padding: 18px 20px; margin-bottom: 14px; }
.life-inner { display: flex; align-items: center; gap: 14px; }
.life-num {
  width: 60px; height: 60px; flex-shrink: 0;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255,255,255,.12), rgba(255,255,255,.04));
  border: 1px solid rgba(255,255,255,.15);
  display: flex; align-items: center; justify-content: center;
  font-family: 'Cormorant Garamond', serif;
  font-size: 32px; font-weight: 600; color: #ffc857;
}
.life-text { flex: 1; }
.life-label { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.5); font-weight: 600; margin-bottom: 2px; }
.life-title { font-size: 17px; margin-bottom: 2px; }
.life-sub   { font-size: 11px; color: rgba(255,255,255,.45); }
.life-arrow { font-size: 28px; color: rgba(255,255,255,.4); background: none; border: none; cursor: pointer; line-height: 1; }

/* Menu */
.menu-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 20px; }
.menu-item {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; cursor: pointer; text-align: left; width: 100%;
  border: none;
}
.menu-icon  { font-size: 22px; flex-shrink: 0; }
.menu-body  { flex: 1; }
.menu-title { font-size: 14px; font-weight: 600; color: #F5ECFF; margin-bottom: 2px; }
.menu-sub   { font-size: 11px; color: rgba(255,255,255,.45); }
.menu-arrow { font-size: 24px; color: rgba(255,255,255,.3); }
.menu-item--disabled { opacity: .5; cursor: not-allowed; pointer-events: none; }

/* Logout */
.logout-btn {
  width: 100%; padding: 14px; border-radius: 14px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,100,100,.2);
  color: rgba(255,120,120,.7); font-size: 14px; font-weight: 500;
  font-family: 'Manrope', sans-serif; cursor: pointer;
}
</style>

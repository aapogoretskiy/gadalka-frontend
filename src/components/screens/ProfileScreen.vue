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

        <button class="menu-item glass haptic" @click="openEdit">
          <div class="menu-icon">✏️</div>
          <div class="menu-body">
            <div class="menu-title">Изменить данные</div>
            <div class="menu-sub">Дата рождения, город, интересы</div>
          </div>
          <div class="menu-arrow">›</div>
        </button>

        <button class="menu-item glass menu-item--disabled">
          <div class="menu-icon">🔔</div>
          <div class="menu-body">
            <div class="menu-title">Уведомления</div>
            <div class="menu-sub">Ежедневная карта в 9:00</div>
          </div>
          <ComingSoonBadge />
        </button>
      </div>

      <!-- Reset profile -->
      <button class="reset-btn haptic" @click="handleReset">
        Сбросить профиль
      </button>
    </div>
  </div>

  <!-- Edit profile bottom sheet -->
  <div v-if="editOpen" class="sheet-overlay" @click.self="editOpen = false">
    <div class="bottom-sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title serif">Изменить данные</div>

      <div class="edit-form">
        <div class="edit-row">
          <label class="edit-label">Дата рождения</label>
          <input v-model="editForm.birthDate" type="date" class="edit-input" />
        </div>
        <div class="edit-row">
          <label class="edit-label">Время рождения</label>
          <input v-model="editForm.birthTime" type="time" class="edit-input" />
        </div>
        <div class="edit-row">
          <label class="edit-label">Город рождения</label>
          <input v-model="editForm.birthCity" type="text" placeholder="Например: Москва" class="edit-input" />
        </div>

        <div class="edit-label" style="margin-bottom:10px">Интересы</div>
        <div class="goal-grid">
          <button
            v-for="g in goalOptions" :key="g.value"
            class="goal-card haptic"
            :class="{ selected: editForm.goals.includes(g.value) }"
            @click="toggleEditGoal(g.value)"
          >
            <span class="goal-icon">{{ g.emoji }}</span>
            <span class="goal-label">{{ g.label }}</span>
          </button>
        </div>
      </div>

      <button class="sheet-save-btn haptic" :disabled="isSaving" @click="saveEdit">
        {{ isSaving ? 'Сохраняем...' : 'Сохранить' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useUser } from '@/composables/useUser'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'
import { showConfirm } from '@/utils/telegram'
import type { Goal } from '@/utils/api'

const navigate = inject<(r: string) => void>('navigate')
const { telegramUser, profile, updateProfile, resetProfile } = useUser()

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

// ── Сброс профиля ──
const handleReset = async () => {
  const confirmed = await showConfirm('Сбросить профиль? Данные рождения и интересы будут удалены.')
  if (!confirmed) return
  try {
    await resetProfile()
    navigate?.('onboarding')
  } catch {}
}

// ── Редактирование профиля ──
const editOpen = ref(false)
const isSaving = ref(false)

const editForm = ref({
  birthDate: '',
  birthTime: '',
  birthCity: '',
  goals: [] as Goal[],
})

const goalOptions: { value: Goal; label: string; emoji: string }[] = [
  { value: 'LOVE',            label: 'Отношения',  emoji: '💕' },
  { value: 'MONEY',           label: 'Деньги',     emoji: '💰' },
  { value: 'CAREER',          label: 'Карьера',    emoji: '🚀' },
  { value: 'HEALTH',          label: 'Энергия',    emoji: '✨' },
  { value: 'SELF_CONFIDENCE', label: 'Самооценка', emoji: '🌟' },
]

function openEdit() {
  const bt = profile.value?.birthTime
  editForm.value = {
    birthDate: profile.value?.birthDate || '',
    birthTime: bt ? `${String(bt.hour).padStart(2,'0')}:${String(bt.minute).padStart(2,'0')}` : '',
    birthCity: profile.value?.birthCity || '',
    goals: [...(profile.value?.goals || [])],
  }
  editOpen.value = true
}

function toggleEditGoal(g: Goal) {
  const i = editForm.value.goals.indexOf(g)
  i === -1 ? editForm.value.goals.push(g) : editForm.value.goals.splice(i, 1)
}

async function saveEdit() {
  if (isSaving.value) return
  isSaving.value = true
  try {
    await updateProfile({
      birthDate: editForm.value.birthDate || undefined,
      birthTime: editForm.value.birthTime ? editForm.value.birthTime + ':00' : undefined,
      birthCity: editForm.value.birthCity || undefined,
      goals: editForm.value.goals.length ? editForm.value.goals : undefined,
    })
    editOpen.value = false
  } catch {
  } finally {
    isSaving.value = false
  }
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

/* Reset */
.reset-btn {
  width: 100%; padding: 14px; border-radius: 14px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(255,100,100,.2);
  color: rgba(255,120,120,.7); font-size: 14px; font-weight: 500;
  font-family: 'Manrope', sans-serif; cursor: pointer;
}

/* Edit bottom sheet */
.sheet-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.55); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.bottom-sheet {
  width: 100%; max-height: 85vh; overflow-y: auto;
  background: #150b2a;
  border-radius: 24px 24px 0 0;
  padding: 16px 20px 40px;
  border-top: 1px solid rgba(255,255,255,.1);
}
.sheet-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.2);
  margin: 0 auto 20px;
}
.sheet-title { font-size: 20px; text-align: center; margin-bottom: 20px; }
.edit-form { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.edit-row { display: flex; flex-direction: column; gap: 7px; }
.edit-label {
  font-size: 11px; font-weight: 600; text-transform: uppercase;
  letter-spacing: .08em; color: rgba(255,255,255,.6);
}
.edit-input {
  width: 100%; padding: 13px 15px; box-sizing: border-box;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px; color: #F5ECFF; font-size: 15px;
  font-family: 'Manrope', sans-serif; outline: none; transition: border-color .2s;
}
.edit-input:focus { border-color: rgba(182,84,255,.5); }
.edit-input::placeholder { color: rgba(255,255,255,.35); }
.goal-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px;
}
.goal-card {
  padding: 14px 10px; border-radius: 14px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
  cursor: pointer; text-align: center; display: flex; flex-direction: column;
  align-items: center; gap: 5px; transition: all .2s; color: #F5ECFF;
}
.goal-card.selected {
  background: linear-gradient(135deg,rgba(182,84,255,.25),rgba(233,74,168,.15));
  border-color: rgba(182,84,255,.5);
}
.goal-icon { font-size: 22px; }
.goal-label { font-size: 12px; font-weight: 500; }
.sheet-save-btn {
  width: 100%; padding: 15px; border-radius: 16px;
  background: linear-gradient(135deg,#b654ff,#e94aa8);
  color: #fff; font-size: 15px; font-weight: 600;
  font-family: 'Manrope', sans-serif; border: none; cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,.4);
}
.sheet-save-btn:disabled { opacity: .5; cursor: not-allowed; }
</style>

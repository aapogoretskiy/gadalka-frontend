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

      <!-- Balance card -->
      <div class="balance-card glass haptic" @click="navigate('payment')">
        <div class="balance-icon">🔮</div>
        <div class="balance-body">
          <div class="balance-label">Баланс гаданий</div>
          <div class="balance-val">
            <span v-if="balance > 0">{{ balance }} {{ balancePluralLabel }}</span>
            <span v-else class="balance-empty">Нет гаданий</span>
          </div>
        </div>
        <div class="balance-action">{{ balance > 0 ? 'Пополнить' : 'Купить' }} →</div>
      </div>

      <!-- Life number -->
      <div class="life-card gradient-card haptic" @click="lifeCardExpanded = !lifeCardExpanded">
        <div class="life-inner">
          <div class="life-num">{{ lifeNumber }}</div>
          <div class="life-text">
            <div class="life-label">Число жизни</div>
            <div class="life-title serif">{{ lifeNumberTitle }}</div>
            <div class="life-sub">Ваш путь предназначения</div>
          </div>
          <div class="life-arrow" :class="{ 'life-arrow--open': lifeCardExpanded }">›</div>
        </div>
        <div v-if="lifeCardExpanded && lifeNumberDescription" class="life-description">
          {{ lifeNumberDescription }}
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

        <button class="menu-item glass haptic" @click="openNotifSheet">
          <div class="menu-icon">🔔</div>
          <div class="menu-body">
            <div class="menu-title">Уведомления</div>
            <div class="menu-sub">{{ notifSubtitle }}</div>
          </div>
          <div class="menu-arrow">›</div>
        </button>

        <button class="menu-item glass haptic menu-item--referral" @click="openReferralSheet">
          <div class="menu-icon">🎁</div>
          <div class="menu-body">
            <div class="menu-title">Пригласи друга</div>
            <div class="menu-sub">+3 знака за каждого нового пользователя</div>
          </div>
          <div class="menu-arrow">›</div>
        </button>

        <button class="menu-item glass haptic" @click="navigate?.('feedback')">
          <div class="menu-icon">💬</div>
          <div class="menu-body">
            <div class="menu-title">Обратная связь</div>
            <div class="menu-sub">Сообщить о проблеме или пожелании</div>
          </div>
          <div class="menu-arrow">›</div>
        </button>
      </div>

      <!-- Referral sheet -->
      <Teleport to="body">
        <div v-if="referralOpen" class="sheet-overlay" @click.self="referralOpen = false">
          <div class="bottom-sheet">
            <div class="sheet-handle"></div>
            <div class="sheet-title serif">Пригласи друга 🎁</div>

            <div class="referral-body">
              <p class="referral-desc">
                Поделись своей ссылкой — когда друг зарегистрируется, ты получишь
                <strong>3 знака</strong> для новых гаданий ✨
              </p>

              <div class="referral-link-block">
                <div class="referral-link-text">{{ referralLink || 'Загрузка...' }}</div>
                <button class="referral-copy-btn haptic" @click="copyReferralLink">
                  {{ copied ? '✓ Скопировано' : 'Копировать' }}
                </button>
              </div>

              <button class="sheet-save-btn haptic" @click="shareReferralLink">
                📤 Поделиться в Telegram
              </button>
            </div>
          </div>
        </div>
      </Teleport>

      <!-- Reset profile -->
      <button class="reset-btn haptic" @click="handleReset">
        Сбросить профиль
      </button>

      <!-- Edit profile bottom sheet -->
      <Teleport to="body">
        <div v-if="editOpen" class="sheet-overlay" @click.self="editOpen = false">
          <div
            ref="sheetEl"
            class="bottom-sheet"
            :style="sheetDragY > 0 ? { transform: `translateY(${sheetDragY}px)`, transition: 'none' } : {}"
            @touchstart="onSheetTouchStart"
            @touchmove="onSheetTouchMove"
            @touchend="onSheetTouchEnd"
          >
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
      </Teleport>

      <!-- Notification settings bottom sheet -->
      <Teleport to="body">
        <div v-if="notifOpen" class="sheet-overlay" @click.self="notifOpen = false">
          <div class="bottom-sheet">
            <div class="sheet-handle"></div>
            <div class="sheet-title serif">Уведомления</div>

            <div class="notif-options">
              <button
                v-for="opt in notifOptions" :key="opt.value"
                class="notif-option haptic"
                :class="{ selected: notifForm === opt.value }"
                @click="notifForm = opt.value"
              >
                <span class="notif-option-icon">{{ opt.icon }}</span>
                <div class="notif-option-text">
                  <div class="notif-option-title">{{ opt.label }}</div>
                  <div class="notif-option-sub">{{ opt.sub }}</div>
                </div>
                <div class="notif-option-check" v-if="notifForm === opt.value">✓</div>
              </button>
            </div>

            <button class="sheet-save-btn haptic" :disabled="isSavingNotif" @click="saveNotif">
              {{ isSavingNotif ? 'Сохраняем...' : 'Сохранить' }}
            </button>
          </div>
        </div>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject, watch, onMounted } from 'vue'
import { useUser } from '@/composables/useUser'
import { useBalance } from '@/composables/useBalance'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'
import { showConfirm } from '@/utils/telegram'
import { api, type Goal, type NotificationTime, type NumerologyTodayResponse } from '@/utils/api'

const navigate = inject<(r: string) => void>('navigate')
const setBackOverride = inject<(fn: (() => void) | null) => void>('setBackOverride')
const { telegramUser, profile, updateProfile, resetProfile } = useUser()
const { balance } = useBalance()

const balancePluralLabel = computed(() => {
  const n = balance.value
  if (n === 1) return 'знак'
  if (n >= 2 && n <= 4) return 'знака'
  return 'знаков'
})

const userName    = computed(() => telegramUser.value?.first_name || 'Мистик')
const userInitial = computed(() => userName.value.charAt(0).toUpperCase())
const userBirthdate = computed(() => {
  if (!profile.value?.birthDate) return ''
  return new Date(profile.value.birthDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
})

const numerologyData        = ref<NumerologyTodayResponse | null>(null)
const lifeCardExpanded      = ref(false)
const lifeNumber            = computed(() => numerologyData.value?.lifePathNumber || '—')
const lifeNumberTitle       = computed(() => numerologyData.value?.lifePathTitle || '')
const lifeNumberDescription = computed(() => numerologyData.value?.lifePathDescription || '')

onMounted(async () => {
  try {
    const res = await api.getNumerologyToday()
    numerologyData.value = res.data
  } catch {
    // Профиль может быть не заполнен — карточка покажет прочерк
  }
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

// Свайп вниз для закрытия шита
const sheetDragY = ref(0)
let swipeStartY = 0
let swipeStartScrollTop = 0
const sheetEl = ref<HTMLElement | null>(null)

function onSheetTouchStart(e: TouchEvent) {
  swipeStartY = e.touches[0].clientY
  swipeStartScrollTop = sheetEl.value?.scrollTop ?? 0
  sheetDragY.value = 0
}
function onSheetTouchMove(e: TouchEvent) {
  const dy = e.touches[0].clientY - swipeStartY
  if (dy > 0 && swipeStartScrollTop === 0) {
    sheetDragY.value = dy
  }
}
function onSheetTouchEnd() {
  if (sheetDragY.value > 90) {
    editOpen.value = false
  }
  sheetDragY.value = 0
}

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

watch(editOpen, (open) => {
  setBackOverride?.(open ? () => { editOpen.value = false } : null)
})

function parseBirthTime(bt: any): string {
  if (!bt) return ''
  if (typeof bt === 'string') return bt.substring(0, 5)
  if (typeof bt === 'object' && bt.hour !== undefined)
    return `${String(bt.hour).padStart(2,'0')}:${String(bt.minute).padStart(2,'0')}`
  return ''
}

function openEdit() {
  editForm.value = {
    birthDate: profile.value?.birthDate || '',
    birthTime: parseBirthTime(profile.value?.birthTime),
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

// ── Настройка уведомлений ──
const notifOpen = ref(false)
const isSavingNotif = ref(false)
const notifForm = ref<NotificationTime>('EVENING')

const notifOptions: { value: NotificationTime; icon: string; label: string; sub: string }[] = [
  { value: 'MORNING', icon: '☀️', label: 'Утром',           sub: 'около 9:00' },
  { value: 'EVENING', icon: '🌙', label: 'Вечером',         sub: 'около 20:00' },
  { value: 'DISABLED', icon: '🔕', label: 'Не получать',    sub: 'можно включить позже' },
]

// Подпись под пунктом меню, отражает текущую настройку
const notifSubtitle = computed(() => {
  const current = profile.value?.notificationTime
  if (current === 'MORNING') return 'Напоминание в 9:00'
  if (current === 'EVENING') return 'Напоминание в 20:00'
  if (current === 'DISABLED') return 'Выключены'
  return 'Настроить напоминания'
})

function openNotifSheet() {
  notifForm.value = profile.value?.notificationTime ?? 'EVENING'
  notifOpen.value = true
}

watch(notifOpen, (open) => {
  setBackOverride?.(open ? () => { notifOpen.value = false } : null)
})

async function saveNotif() {
  if (isSavingNotif.value) return
  isSavingNotif.value = true
  try {
    await updateProfile({ notificationTime: notifForm.value })
    notifOpen.value = false
  } catch {
  } finally {
    isSavingNotif.value = false
  }
}

// ── Реферальная ссылка ──
const referralOpen = ref(false)
const referralLink = ref('')
const copied = ref(false)

async function openReferralSheet() {
  referralOpen.value = true
  setBackOverride?.(() => { referralOpen.value = false })
  if (!referralLink.value) {
    try {
      const res = await api.getReferralLink()
      referralLink.value = res.data.link
    } catch {
      referralLink.value = ''
    }
  }
}

watch(referralOpen, (open) => {
  if (!open) setBackOverride?.(null)
})

async function copyReferralLink() {
  if (!referralLink.value) return
  try {
    await navigator.clipboard.writeText(referralLink.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback для окружений без clipboard API (некоторые старые Android WebView)
    const el = document.createElement('textarea')
    el.value = referralLink.value
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

function shareReferralLink() {
  if (!referralLink.value) return
  const text = encodeURIComponent(
    'Привет! Я пользуюсь приложением Гадалка — расклады Таро, нумерология и многое другое. ' +
    'Заходи по моей ссылке 🔮'
  )
  const url = encodeURIComponent(referralLink.value)
  // Telegram Web App API для шаринга
  const tg = (window as any).Telegram?.WebApp
  if (tg?.openTelegramLink) {
    tg.openTelegramLink(`https://t.me/share/url?url=${url}&text=${text}`)
  } else {
    window.open(`https://t.me/share/url?url=${url}&text=${text}`, '_blank')
  }
}
</script>

<style scoped>
.screen-wrap { min-height: var(--tg-viewport-stable-height, 100vh); padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px)); overflow-y: auto; }
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px; }

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

/* Balance card */
.balance-card {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; margin-bottom: 14px; cursor: pointer;
}
.balance-icon { font-size: 28px; flex-shrink: 0; }
.balance-body { flex: 1; }
.balance-label { font-size: 10px; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.5); font-weight: 600; margin-bottom: 3px; }
.balance-val { font-size: 18px; font-weight: 700; color: #ffc857; }
.balance-empty { color: rgba(255,255,255,.4); font-size: 16px; font-weight: 500; }
.balance-action { font-size: 12px; color: #b654ff; font-weight: 600; white-space: nowrap; }

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
.life-arrow {
  font-size: 22px; color: rgba(255,255,255,.4); line-height: 1; flex-shrink: 0;
  transition: transform .25s ease;
}
.life-arrow--open { transform: rotate(90deg); }
.life-description {
  font-size: 13px; line-height: 1.65; color: rgba(255,255,255,.72);
  margin-top: 14px; padding-top: 14px;
  border-top: 1px solid rgba(255,255,255,.08);
}

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

/* Bottom sheets */
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
  transition: transform 0.25s ease;
  will-change: transform;
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

/* Referral menu item highlight */
.menu-item--referral {
  border-color: rgba(255, 200, 87, 0.2);
  background: linear-gradient(135deg, rgba(255,200,87,0.06), rgba(182,84,255,0.06));
}
.menu-item--referral .menu-title { color: #ffc857; }

/* Referral sheet */
.referral-body {
  display: flex; flex-direction: column; gap: 18px; padding-bottom: 4px;
}
.referral-desc {
  font-size: 14px; line-height: 1.65; color: rgba(255,255,255,.7);
  margin: 0; text-align: center;
}
.referral-desc strong { color: #ffc857; }
.referral-link-block {
  display: flex; gap: 10px; align-items: center;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px; padding: 12px 14px;
}
.referral-link-text {
  flex: 1; font-size: 12px; color: rgba(255,255,255,.55);
  word-break: break-all; line-height: 1.4;
  font-family: monospace;
}
.referral-copy-btn {
  flex-shrink: 0; padding: 8px 14px; border-radius: 10px;
  background: rgba(182,84,255,.2); border: 1px solid rgba(182,84,255,.4);
  color: #c084fc; font-size: 12px; font-weight: 600;
  font-family: 'Manrope', sans-serif; cursor: pointer; white-space: nowrap;
  transition: background .2s;
}
.referral-copy-btn:active { background: rgba(182,84,255,.35); }

/* Notification options */
.notif-options {
  display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;
}
.notif-option {
  display: flex; align-items: center; gap: 14px;
  padding: 16px 18px; border-radius: 16px;
  background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
  cursor: pointer; text-align: left; color: #F5ECFF; transition: all .2s; width: 100%;
}
.notif-option.selected {
  background: linear-gradient(135deg,rgba(182,84,255,.2),rgba(233,74,168,.12));
  border-color: rgba(182,84,255,.5);
  box-shadow: 0 4px 20px rgba(182,84,255,.15);
}
.notif-option-icon { font-size: 28px; flex-shrink: 0; }
.notif-option-text { flex: 1; }
.notif-option-title { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.notif-option-sub { font-size: 12px; color: rgba(255,255,255,.45); }
.notif-option-check {
  width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg,#b654ff,#e94aa8);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: #fff; font-weight: 700; flex-shrink: 0;
}
</style>

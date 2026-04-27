<template>
  <div class="onb-wrap">
    <!-- Step 1: Дата рождения -->
    <div v-if="step === 1" class="onb-screen">
      <div class="onb-hero">
        <div class="onb-icon">🔮</div>
        <h1>Мистика</h1>
        <p class="onb-sub">Откройте тайны своей судьбы</p>
        <div class="progress-dots">
          <div class="dot" :class="{ active: step >= 1 }"></div>
          <div class="dot" :class="{ active: step >= 2 }"></div>
          <div class="dot" :class="{ active: step >= 3 }"></div>
        </div>
      </div>

      <div class="onb-form">
        <!-- Объяснение зачем нужны данные -->
        <div class="data-reason-card">
          <div class="data-reason-header">
            <span class="data-reason-icon">✦</span>
            <span class="data-reason-title">Зачем нам эти данные?</span>
          </div>
          <p class="data-reason-body">
            Дата, время и город рождения — основа ваших персональных расчётов. На их основе мы строим расклады Таро, нумерологический профиль и расчёт совместимости. Чем точнее данные — тем точнее результат.
          </p>
        </div>

        <div class="form-row">
          <label class="input-label">Дата рождения <span class="req">*</span></label>
          <input
            type="date"
            :value="form.birthDate"
            @input="form.birthDate = ($event.target as HTMLInputElement).value"
            @change="form.birthDate = ($event.target as HTMLInputElement).value"
            class="onb-input input-date"
          />
        </div>
        <div class="form-row">
          <label class="input-label">Время рождения <span class="req">*</span></label>
          <input
            type="time"
            :value="form.birthTime"
            @input="form.birthTime = ($event.target as HTMLInputElement).value"
            @change="form.birthTime = ($event.target as HTMLInputElement).value"
            class="onb-input input-date"
          />
        </div>
        <div class="form-row">
          <label class="input-label">Город рождения <span class="req">*</span></label>
          <input v-model="form.birthCity" type="text" placeholder="Например: Москва" class="onb-input" />
        </div>
        <button
          class="onb-btn haptic"
          :disabled="!form.birthDate || !form.birthTime || !form.birthCity.trim()"
          @click="step = 2"
        >
          Далее →
        </button>
      </div>
    </div>

    <!-- Step 2: Цели -->
    <div v-if="step === 2" class="onb-screen">
      <div class="onb-hero" style="padding-top:40px">
        <h2 style="font-size:28px;margin-bottom:8px">Ваши интересы</h2>
        <p class="onb-sub">Выберите, что важно для вас</p>
        <div class="progress-dots">
          <div class="dot active"></div>
          <div class="dot" :class="{ active: step >= 2 }"></div>
          <div class="dot" :class="{ active: step >= 3 }"></div>
        </div>
      </div>

      <div class="onb-form">
        <div class="goal-grid">
          <button
            v-for="g in goalOptions" :key="g.value"
            class="goal-card haptic"
            :class="{ selected: form.goals.includes(g.value) }"
            @click="toggleGoal(g.value)"
          >
            <span class="goal-icon">{{ g.emoji }}</span>
            <span class="goal-label">{{ g.label }}</span>
          </button>
        </div>
        <button class="onb-btn haptic" @click="step = 3">
          Далее →
        </button>
        <button class="onb-skip" @click="step = 3">Пропустить</button>
      </div>
    </div>

    <!-- Step 3: Готово -->
    <div v-if="step === 3" class="onb-screen">
      <div class="onb-hero" style="padding-top:32px">
        <div class="celebrate-icon">✨</div>
        <h2 style="font-size:32px;margin-bottom:8px">Всё готово!</h2>
        <p class="onb-sub">Ваш путь начинается</p>
        <div class="progress-dots">
          <div class="dot active"></div>
          <div class="dot active"></div>
          <div class="dot active"></div>
        </div>
      </div>

      <div class="onb-form">
        <!-- Day code card -->
        <div class="day-code-card gradient-card" style="padding:20px;text-align:center;margin-bottom:20px">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.6);margin-bottom:8px">Ваш код дня</div>
          <div class="day-code-number">{{ lifeNumber }}</div>
          <div class="serif" style="font-size:18px;font-style:italic;margin-top:4px">{{ lifeNumberTitle }}</div>
        </div>
        <!-- Unlocked features -->
        <div class="unlock-list">
          <div class="unlock-item"><span class="check">✓</span> Карта дня и расклады</div>
          <div class="unlock-item"><span class="check">✓</span> Нумерология судьбы</div>
          <div class="unlock-item"><span class="check">✓</span> Расчёт совместимости</div>
        </div>
        <button class="onb-btn haptic" :disabled="isLoading" @click="handleFinish">
          {{ isLoading ? 'Сохраняем...' : 'Начать ✨' }}
        </button>
        <p v-if="errorMsg" class="onb-error">{{ errorMsg }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useUser } from '@/composables/useUser'
import type { Goal } from '@/utils/api'

const navigate = inject<(r: string) => void>('navigate')
const { createProfile, authWithTelegram } = useUser()

const step = ref(1)
const isLoading = ref(false)
const errorMsg = ref('')

const form = ref({
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

const toggleGoal = (g: Goal) => {
  const i = form.value.goals.indexOf(g)
  i === -1 ? form.value.goals.push(g) : form.value.goals.splice(i, 1)
}

function calcLifeNumber(d: string) {
  const digits = d.replace(/-/g, '').split('').map(Number)
  let s = digits.reduce((a, b) => a + b, 0)
  while (s > 9 && s !== 11 && s !== 22 && s !== 33)
    s = String(s).split('').map(Number).reduce((a, b) => a + b, 0)
  return s
}

const lifeNumber = computed(() => form.value.birthDate ? calcLifeNumber(form.value.birthDate) : '?')
const lifeNumberTitle = computed(() => {
  const m: Record<number, string> = {
    1:'Лидер и первопроходец', 2:'Дипломат и миротворец',
    3:'Творец и оптимист',     4:'Строитель и практик',
    5:'Искатель приключений',  6:'Хранитель гармонии',
    7:'Мудрец и аналитик',    8:'Властитель успеха',
    9:'Гуманист и мечтатель', 11:'Мастер интуиции',
    22:'Мастер великих дел',  33:'Духовный учитель',
  }
  return m[lifeNumber.value as number] || ''
})

const handleFinish = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    if (!localStorage.getItem('jwt_token')) {
      const ok = await authWithTelegram()
      if (!ok) {
        errorMsg.value = 'Не удалось авторизоваться. Попробуйте перезапустить приложение.'
        return
      }
    }
    await createProfile({
      birthDate: form.value.birthDate || undefined,
      birthTime: form.value.birthTime ? form.value.birthTime + ':00' : undefined,
      birthCity: form.value.birthCity || undefined,
      goals: form.value.goals.length ? form.value.goals : undefined,
    })
    navigate?.('home')
  } catch (e: any) {
    errorMsg.value = e.response?.data?.message || 'Ошибка. Попробуйте снова.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
.onb-wrap {
  min-height: 100vh;
  display: flex;
  align-items: stretch;
}
.onb-screen {
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 0 24px 40px;
}

/* Hero */
.onb-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding-top: 60px;
  margin-bottom: 32px;
}
.onb-icon {
  width: 110px; height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle, #ffc857 0%, #e94aa8 70%, transparent 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 52px;
  margin-bottom: 24px;
  animation: glow-pulse 3s ease-in-out infinite;
}
.celebrate-icon {
  width: 110px; height: 110px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  display: flex; align-items: center; justify-content: center;
  font-size: 52px;
  margin-bottom: 24px;
  box-shadow: 0 0 60px rgba(182,84,255,0.5);
}
.onb-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.6);
  margin-top: 6px;
  margin-bottom: 20px;
}

/* Progress dots */
.progress-dots { display: flex; gap: 6px; }
.dot {
  width: 6px; height: 6px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  transition: all 0.3s;
}
.dot.active {
  width: 24px;
  background: linear-gradient(90deg, #b654ff, #e94aa8);
  border-radius: 3px;
}

/* Form */
.onb-form { display: flex; flex-direction: column; gap: 0; }
.form-row { margin-bottom: 14px; }
.input-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 8px;
  color: rgba(255,255,255,0.7);
  text-transform: uppercase;
  letter-spacing: .08em;
}
.req  { color: #e94aa8; }

/* Блок с объяснением данных */
.data-reason-card {
  margin-bottom: 20px;
  padding: 14px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(182,84,255,0.1), rgba(233,74,168,0.06));
  border: 1px solid rgba(182,84,255,0.25);
}
.data-reason-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}
.data-reason-icon {
  font-size: 13px;
  color: #b654ff;
  flex-shrink: 0;
}
.data-reason-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: #d89fff;
}
.data-reason-body {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,0.6);
  margin: 0;
}

.onb-input {
  width: 100%;
  padding: 14px 16px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  color: #F5ECFF;
  font-size: 15px;
  font-family: 'Manrope', sans-serif;
  outline: none;
  transition: border-color 0.2s;
}
.onb-input:focus { border-color: rgba(182,84,255,0.5); }
.onb-input::placeholder { color: rgba(255,255,255,0.4); }

/* Goals */
.goal-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 20px;
}
.goal-card {
  padding: 18px 14px;
  border-radius: 16px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  color: #F5ECFF;
}
.goal-card.selected {
  background: linear-gradient(135deg, rgba(182,84,255,0.25), rgba(233,74,168,0.15));
  border-color: rgba(182,84,255,0.5);
  box-shadow: 0 4px 20px rgba(182,84,255,0.2);
}
.goal-icon { font-size: 26px; }
.goal-label { font-size: 13px; font-weight: 500; }

/* Buttons */
.onb-btn {
  width: 100%;
  padding: 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #b654ff 0%, #e94aa8 100%);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,0.4);
  margin-top: 8px;
}
.onb-btn:disabled { opacity: 0.45; cursor: not-allowed; }
.onb-skip {
  background: none; border: none; color: rgba(255,255,255,0.45);
  font-size: 13px; cursor: pointer; margin-top: 12px; font-family: 'Manrope', sans-serif;
}
.onb-error { color: #ff6b6b; font-size: 13px; text-align: center; margin-top: 8px; }

/* Day code */
.day-code-number {
  font-family: 'Cormorant Garamond', serif;
  font-size: 72px;
  font-weight: 500;
  line-height: 1;
  background: linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.unlock-list { margin-bottom: 20px; }
.unlock-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 0;
  font-size: 14px;
  color: rgba(255,255,255,0.8);
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.check {
  width: 22px; height: 22px;
  border-radius: 50%;
  background: linear-gradient(135deg, #70e0a8, #47b896);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px;
  color: #0a3a2a;
  font-weight: 700;
  flex-shrink: 0;
}
</style>

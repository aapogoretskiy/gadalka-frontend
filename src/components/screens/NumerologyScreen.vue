<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <button class="back-btn haptic" @click="navigate('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="header-title serif">Нумерология</div>
        <div style="width:36px"></div>
      </div>

      <!-- Number hero -->
      <div class="num-hero gradient-card">
        <div class="num-mega">{{ lifeNumber }}</div>
        <div class="num-label">Код дня</div>
        <div class="num-short serif">{{ lifeNumberTitle }}</div>
      </div>

      <!-- Day strip -->
      <div class="day-strip glass">
        <div class="day-strip-item">
          <div class="strip-icon">🌙</div>
          <div class="strip-label">Луна</div>
          <div class="strip-val">Убывающая</div>
        </div>
        <div class="strip-divider"></div>
        <div class="day-strip-item">
          <div class="strip-icon">♈</div>
          <div class="strip-label">Знак</div>
          <div class="strip-val">{{ zodiacSign }}</div>
        </div>
        <div class="strip-divider"></div>
        <div class="day-strip-item">
          <div class="strip-icon">⏰</div>
          <div class="strip-label">Лучшее время</div>
          <div class="strip-val">10:00–14:00</div>
        </div>
      </div>

      <!-- Detail cards -->
      <div class="detail-card glass" v-for="d in details" :key="d.title">
        <h4 class="serif detail-title">{{ d.title }}</h4>
        <p class="detail-body">{{ d.text }}</p>
      </div>

      <!-- Affirmation -->
      <div class="affirmation-card gradient-card">
        <div class="aff-label">✦ Аффирмация дня</div>
        <div class="aff-text serif">"{{ affirmation }}"</div>
      </div>

      <!-- Deep analysis section -->
      <div class="section-header">
        <div class="section-title serif">А теперь глубже</div>
      </div>

      <div class="period-grid">
        <div
          v-for="p in periods" :key="p.label"
          class="period-card haptic"
          :class="{ selected: selectedPeriod === p.label }"
          @click="selectedPeriod = p.label"
        >
          <div v-if="p.popular" class="period-badge">ХИТ</div>
          <div class="period-icon">{{ p.icon }}</div>
          <div class="period-title serif">{{ p.label }}</div>
          <div class="period-desc">{{ p.desc }}</div>
          <div class="period-price">{{ p.price }}</div>
        </div>
      </div>

      <button class="action-btn action-btn--disabled" disabled>
        <span>Получить глубокий анализ</span>
        <ComingSoonBadge />
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { useUser } from '@/composables/useUser'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'

const navigate = inject<(r: string) => void>('navigate')
const { profile } = useUser()

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
    1:'Лидер', 2:'Дипломат', 3:'Творец', 4:'Строитель', 5:'Искатель',
    6:'Хранитель', 7:'Мудрец', 8:'Властитель', 9:'Гуманист',
    11:'Интуит', 22:'Созидатель', 33:'Учитель',
  }
  return m[lifeNumber.value] || 'Мудрость'
})

const zodiacSigns = ['Козерог','Водолей','Рыбы','Овен','Телец','Близнецы','Рак','Лев','Дева','Весы','Скорпион','Стрелец']
const zodiacSign = computed(() => {
  const m = new Date().getMonth()
  return zodiacSigns[m]
})

const details = computed(() => [
  { title: '⚡ Энергия дня', text: `День числа ${lifeNumber.value} несёт энергию трансформации и внутреннего роста. Прислушайтесь к интуиции.` },
  { title: '✅ Что делать', text: 'Планировать важные встречи, заниматься творчеством, общаться с близкими.' },
  { title: '⚠️ Чего избегать', text: 'Конфликтов, непродуманных решений и чрезмерных трат.' },
  { title: '🌟 Астро-событие', text: 'Меркурий входит в Близнецов — усиливается коммуникация и интеллект.' },
])

const affirmation = computed(() => {
  const affs = [
    'Я открыт к новым возможностям и принимаю изменения с радостью',
    'Моя интуиция ведёт меня по верному пути',
    'Я создаю свою реальность силой мысли и намерения',
    'Успех и процветание — моё естественное состояние',
  ]
  return affs[lifeNumber.value % affs.length]
})

const selectedPeriod = ref('Месяц')
const periods = [
  { label: 'Неделя', icon: '🌱', desc: 'Прогноз на 7 дней', price: '149 ₽', popular: false },
  { label: 'Месяц',  icon: '🌙', desc: 'Детальный анализ', price: '349 ₽', popular: true  },
  { label: 'Год',    icon: '⭐', desc: 'Стратегия судьбы', price: '1290 ₽', popular: false },
]
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 90px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
.back-btn {
  width:36px; height:36px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1);
  display:flex; align-items:center; justify-content:center; cursor:pointer; color:#F5ECFF;
}
.header-title { font-size:18px; }

/* Number hero */
.num-hero { padding: 28px 22px; text-align: center; margin-bottom: 14px; }
.num-mega {
  font-family: 'Cormorant Garamond', serif;
  font-size: 96px; font-weight: 500; line-height: 1;
  background: linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  letter-spacing: -.05em; position: relative;
}
.num-label {
  font-size: 11px; text-transform: uppercase; letter-spacing: .12em;
  color: rgba(255,255,255,.6); font-weight: 600; margin-top: 4px; position: relative;
}
.num-short { font-size: 22px; margin-top: 14px; position: relative; font-style: italic; }

/* Day strip */
.day-strip {
  display: flex; align-items: center; justify-content: space-around;
  padding: 14px; margin-bottom: 12px;
}
.day-strip-item { flex: 1; text-align: center; }
.strip-icon  { font-size: 20px; margin-bottom: 4px; }
.strip-label { font-size: 10px; color: rgba(255,255,255,.5); text-transform: uppercase; letter-spacing:.06em; font-weight:600; }
.strip-val   { font-size: 12px; font-weight: 500; margin-top: 2px; }
.strip-divider { width: 1px; height: 36px; background: rgba(255,255,255,.08); }

/* Detail cards */
.detail-card { padding: 18px 20px; margin-bottom: 10px; }
.detail-title { font-size: 17px; margin-bottom: 7px; color: #ffc857; }
.detail-body  { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,.75); }

/* Affirmation */
.affirmation-card { padding: 20px; margin-bottom: 20px; }
.aff-label { font-size:10px; text-transform:uppercase; letter-spacing:.1em; color:#ffc857; font-weight:600; margin-bottom:8px; }
.aff-text  { font-size:18px; line-height:1.4; font-style:italic; color:rgba(255,255,255,.9); }

/* Section */
.section-header { display:flex; justify-content:space-between; margin-bottom:12px; padding-top:8px; }
.section-title  { font-size:20px; }

/* Period grid */
.period-grid { display:grid; grid-template-columns:1fr 1fr 1fr; gap:8px; margin-bottom:16px; }
.period-card {
  padding:14px 8px; text-align:center; cursor:pointer;
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
  border-radius:14px; transition:all .2s; position:relative; overflow:hidden;
}
.period-card.selected {
  background: linear-gradient(135deg, rgba(255,200,87,.2), rgba(233,74,168,.1));
  border-color: rgba(255,200,87,.4);
}
.period-badge {
  position:absolute; top:5px; right:5px;
  background:#ffc857; color:#1a0529; font-size:7px; font-weight:700;
  padding:1px 5px; border-radius:4px; letter-spacing:.04em; text-transform:uppercase;
}
.period-icon  { font-size:20px; margin-bottom:4px; }
.period-title { font-size:14px; margin-bottom:2px; }
.period-desc  { font-size:9.5px; color:rgba(255,255,255,.5); margin-bottom:6px; line-height:1.3; }
.period-price { font-size:12px; font-weight:700; color:#ffc857; }

/* Button */
.action-btn {
  width:100%; padding:15px; border-radius:16px;
  background:linear-gradient(135deg,#b654ff,#e94aa8);
  color:#fff; font-size:15px; font-weight:600;
  font-family:'Manrope',sans-serif; border:none; cursor:pointer;
  box-shadow:0 8px 24px rgba(182,84,255,.4);
  display:flex; align-items:center; justify-content:center; gap:10px;
}
.action-btn--disabled {
  opacity: 0.45;
  cursor: not-allowed;
  box-shadow: none;
}
</style>

<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">История</div>
        <div style="width:36px"></div>
      </div>

      <!-- Filter tabs -->
      <div class="filter-tabs scrollbar-hide">
        <button
          v-for="tab in tabs"
          :key="tab.value"
          class="filter-tab haptic"
          :class="{ active: activeTab === tab.value }"
          @click="activeTab = tab.value"
        >{{ tab.label }}</button>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">Загружаем историю...</div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-state glass">
        <div>{{ error }}</div>
        <button class="retry-btn haptic" @click="loadAll">Повторить</button>
      </div>

      <!-- Empty state -->
      <div v-else-if="filteredEntries.length === 0" class="empty-state">
        <div class="empty-icon">📜</div>
        <div class="empty-title serif">Пусто</div>
        <div class="empty-sub">Здесь появятся ваши расклады и расчёты</div>
        <button
          v-if="activeTab === 'COMPATIBILITY'"
          class="empty-btn haptic"
          @click="navigate('compatibility')"
        >
          Рассчитать совместимость →
        </button>
        <button
          v-else
          class="empty-btn haptic"
          @click="navigate('fortune')"
        >
          Сделать расклад →
        </button>
      </div>

      <!-- Entries -->
      <div v-else class="diary-list">
        <div
          v-for="entry in filteredEntries"
          :key="entry.id"
          class="diary-card glass haptic"
          @click="openEntry(entry)"
        >
          <div class="diary-card-mini" :style="{ background: entryBg(entry) }">
            <div class="mini-icon">{{ entryIcon(entry) }}</div>
          </div>
          <div class="diary-body">
            <div class="diary-head">
              <div class="diary-name serif">{{ entryTitle(entry) }}</div>
              <div class="diary-date">{{ formatDate(entry.createdAt) }}</div>
            </div>
            <div class="diary-keywords">
              <span v-for="kw in entryKeywords(entry)" :key="kw" class="diary-kw">{{ kw }}</span>
            </div>
            <div class="diary-note">{{ entryNote(entry) }}</div>
          </div>
          <div class="diary-arrow">›</div>
        </div>
      </div>

    </div>

    <!-- Detail modal (inline, no Teleport — keeps single root for <Transition>) -->
    <div v-if="selected" class="modal-overlay" @click.self="selected = null">
      <div class="modal-sheet">
        <div class="modal-handle"></div>
        <button class="modal-close haptic" @click="selected = null">✕</button>

        <!-- DAILY_CARD -->
        <template v-if="selected.featureType === 'DAILY_CARD'">
          <div class="modal-type-label">✨ Карта дня</div>
          <div class="modal-date">{{ formatDate(selected.createdAt) }}</div>
          <div class="modal-title serif">{{ selected.data?.name }}</div>
          <div class="modal-section">
            <div class="modal-section-label">✦ Значение</div>
            <div class="modal-section-body">{{ selected.data?.meaning }}</div>
          </div>
          <div v-if="selected.data?.advice" class="modal-section">
            <div class="modal-section-label">💡 Совет</div>
            <div class="modal-section-body">{{ selected.data.advice }}</div>
          </div>
        </template>

        <!-- THREE_CARD / HORSESHOE / CELTIC_CROSS -->
        <template v-if="['THREE_CARD', 'HORSESHOE', 'CELTIC_CROSS'].includes(selected.featureType)">
          <div class="modal-type-label">🔮 Расклад «{{ SPREAD_LABELS[selected.featureType] ?? selected.featureType }}»</div>
          <div class="modal-date">{{ formatDate(selected.createdAt) }}</div>
          <!-- Вопрос, на который делался расклад -->
          <div v-if="selected.data?.question" class="modal-question-pill">
            <span class="modal-question-icon">💬</span>
            <span class="modal-question-text">{{ selected.data.question }}</span>
          </div>
          <div
            v-for="card in (selected.data?.cards ?? [])"
            :key="card.id"
            class="modal-card-block"
            :class="`modal-card-block--${card.cardPosition?.toLowerCase()}`"
          >
            <div class="modal-card-pos-row">
              <span class="modal-card-pos-icon">{{ posIcon(card.cardPosition) }}</span>
              <span class="modal-card-pos-label">{{ posLabel(card.cardPosition) }}</span>
            </div>
            <div class="modal-card-name serif">{{ card.name }}</div>
            <div v-if="card.interpretation" class="modal-card-interp">{{ card.interpretation }}</div>
            <div v-if="card.meaning" class="modal-card-meaning">{{ card.meaning }}</div>
          </div>
          <div v-if="selected.data?.interpretation" class="modal-section modal-section--summary">
            <div class="modal-section-label">✦ Общий вывод</div>
            <div class="modal-section-body">{{ selected.data.interpretation }}</div>
          </div>
        </template>

        <!-- NUMEROLOGY_DAY -->
        <template v-if="selected.featureType === 'NUMEROLOGY_DAY'">
          <div class="modal-type-label">🔢 Число дня</div>
          <div class="modal-date">{{ formatDate(selected.createdAt) }}</div>
          <div class="modal-numerology-hero">
            <div class="modal-day-code">{{ selected.data?.dayCode }}</div>
            <div class="modal-day-title serif">{{ selected.data?.dayCodeTitle }}</div>
          </div>
          <div class="modal-numerology-strip">
            <div class="modal-num-pill">🌙 {{ selected.data?.moonPhase }}</div>
            <div class="modal-num-pill">✨ {{ selected.data?.zodiacSign }}</div>
            <div class="modal-num-pill">⏰ {{ selected.data?.bestTime }}</div>
          </div>
          <div v-if="selected.data?.energyOfDay" class="modal-section">
            <div class="modal-section-label">⚡ Энергия дня</div>
            <div class="modal-section-body">{{ selected.data.energyOfDay }}</div>
          </div>
          <div v-if="selected.data?.whatToDo" class="modal-section">
            <div class="modal-section-label">✅ Что делать</div>
            <div class="modal-section-body">{{ selected.data.whatToDo }}</div>
          </div>
          <div v-if="selected.data?.whatToAvoid" class="modal-section">
            <div class="modal-section-label">⚠️ Чего избегать</div>
            <div class="modal-section-body">{{ selected.data.whatToAvoid }}</div>
          </div>
          <div v-if="selected.data?.affirmation" class="modal-section modal-section--affirmation">
            <div class="modal-section-label">✦ Аффирмация</div>
            <div class="modal-section-body modal-affirmation-text serif">"{{ selected.data.affirmation }}"</div>
          </div>
        </template>

        <!-- COMPATIBILITY -->
        <template v-if="selected.featureType === 'COMPATIBILITY'">
          <div class="modal-type-label">💕 Совместимость</div>
          <div class="modal-date">{{ formatDate(selected.createdAt) }}</div>
          <div v-if="selected.data?.persons?.length === 2" class="modal-compat-names">
            <span class="modal-name-chip">{{ selected.data.persons[0].name }}</span>
            <span class="modal-name-sep">💕</span>
            <span class="modal-name-chip">{{ selected.data.persons[1].name }}</span>
          </div>
          <div class="modal-score-row">
            <div class="modal-score-num">{{ selected.data?.compatibilityScore }}%</div>
            <div class="modal-score-label serif">{{ selected.data?.label }}</div>
          </div>

          <!-- Платный контент — закрыт paywall пока не разблокирован -->
          <div class="modal-paywall-wrap" :class="{ 'modal-paywall-wrap--unlocked': isCompatUnlocked(selected) }">
            <div class="modal-paywall-content">
              <template v-if="isCompatUnlocked(selected)">
                <!-- Реальные данные после разблокировки -->
                <div v-if="selected.data?.interpretation" class="modal-section">
                  <div class="modal-section-label">✦ Интерпретация</div>
                  <div class="modal-section-body">{{ selected.data.interpretation }}</div>
                </div>
                <div v-if="selected.data?.categories?.length" class="modal-categories">
                  <div v-for="cat in selected.data.categories" :key="cat.name" class="modal-cat-row">
                    <div class="modal-cat-label">{{ cat.name }}</div>
                    <div class="modal-cat-bar-wrap">
                      <div class="modal-cat-bar" :style="{ width: cat.score + '%' }"></div>
                    </div>
                    <div class="modal-cat-pct">{{ cat.score }}%</div>
                  </div>
                </div>
              </template>
              <template v-else>
                <!-- Фейковый preview под блюром -->
                <div class="modal-section">
                  <div class="modal-section-label">✦ Интерпретация</div>
                  <div class="modal-section-body">Глубокий анализ показывает сильную эмоциональную связь и взаимное притяжение. Ваши числа создают гармоничный союз...</div>
                </div>
                <div class="modal-categories">
                  <div v-for="fake in [{name:'Любовь',score:78},{name:'Доверие',score:85},{name:'Общение',score:72},{name:'Ценности',score:90},{name:'Перспектива',score:68}]" :key="fake.name" class="modal-cat-row">
                    <div class="modal-cat-label">{{ fake.name }}</div>
                    <div class="modal-cat-bar-wrap"><div class="modal-cat-bar" :style="{ width: fake.score + '%' }"></div></div>
                    <div class="modal-cat-pct">{{ fake.score }}%</div>
                  </div>
                </div>
              </template>
            </div>

            <div v-if="!isCompatUnlocked(selected)" class="modal-paywall-overlay">
              <div class="modal-paywall-lock">🔒</div>
              <div class="modal-paywall-title serif">Полный анализ</div>
              <div class="modal-paywall-sub">Интерпретация и разбор по 5 категориям</div>

              <!-- Есть гадания — разблокировать прямо здесь -->
              <button
                v-if="selected.data?.id && (hasCredits || isDev)"
                class="modal-paywall-btn haptic"
                :disabled="isUnlocking"
                @click="unlockFromDiary"
              >
                <span v-if="isUnlocking">Открываем...</span>
                <span v-else>🔮 Открыть за 1 гадание</span>
              </button>

              <!-- Нет гаданий или нет id — перейти в раздел -->
              <button
                v-else
                class="modal-paywall-btn modal-paywall-btn--nav haptic"
                @click="selected = null; navigate('compatibility')"
              >
                {{ !selected.data?.id ? 'Перейти к Совместимости →' : 'Купить гадания →' }}
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import { api, type DiaryEntryDto, type FeatureType } from '@/utils/api'
import { useBalance } from '@/composables/useBalance'
import { useDevMode } from '@/composables/useDevMode'
import { useToast } from '@/composables/useToast'
import { hapticFeedback } from '@/utils/telegram'

const navigate = inject<(r: string) => void>('navigate')
const { hasCredits, refreshBalance } = useBalance()
const { isDev } = useDevMode()
const { addToast } = useToast()

const isUnlocking = ref(false)
const unlockedIds = ref(new Set<number>())

async function unlockFromDiary() {
  const id = selected.value?.data?.id
  if (!id || isUnlocking.value) return
  isUnlocking.value = true
  try {
    const res = await api.unlockCompatibility(id)
    // Обновляем данные в открытой записи
    if (selected.value) {
      selected.value = {
        ...selected.value,
        data: {
          ...selected.value.data,
          interpretation: res.data.interpretation,
          categories: res.data.categories,
        }
      }
    }
    unlockedIds.value = new Set([...unlockedIds.value, id])
    await refreshBalance()
    hapticFeedback.success()
  } catch {
    addToast('Не удалось списать гадание. Попробуйте ещё раз.')
  } finally {
    isUnlocking.value = false
  }
}

function isCompatUnlocked(entry: DiaryEntryDto | null): boolean {
  if (!entry || entry.featureType !== 'COMPATIBILITY') return false
  return isDev.value || unlockedIds.value.has(entry.data?.id)
}

const isLoading = ref(false)
const error = ref('')
const allEntries = ref<DiaryEntryDto[]>([])
type TabValue = FeatureType | 'ALL' | 'FORTUNE'
const activeTab = ref<TabValue>('ALL')
const selected = ref<DiaryEntryDto | null>(null)

const tabs: { value: TabValue; label: string }[] = [
  { value: 'ALL',            label: 'Все' },
  { value: 'FORTUNE',        label: 'Гадание' },
  { value: 'DAILY_CARD',     label: 'Карта дня' },
  { value: 'COMPATIBILITY',  label: 'Совместимость' },
  { value: 'NUMEROLOGY_DAY', label: 'Числа' },
]

const FORTUNE_TYPES: FeatureType[] = ['THREE_CARD', 'HORSESHOE', 'CELTIC_CROSS']

const filteredEntries = computed(() => {
  if (activeTab.value === 'ALL')     return allEntries.value
  if (activeTab.value === 'FORTUNE') return allEntries.value.filter(e => FORTUNE_TYPES.includes(e.featureType))
  return allEntries.value.filter(e => e.featureType === (activeTab.value as FeatureType))
})

function dateRange() {
  const to = new Date()
  const from = new Date()
  from.setFullYear(from.getFullYear() - 1)
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) }
}

async function loadAll() {
  isLoading.value = true
  error.value = ''
  const { from, to } = dateRange()
  try {
    const [r1, r2, r3, r4, r5, r6] = await Promise.allSettled([
      api.getDiaryHistory('THREE_CARD', from, to),
      api.getDiaryHistory('HORSESHOE', from, to),
      api.getDiaryHistory('CELTIC_CROSS', from, to),
      api.getDiaryHistory('COMPATIBILITY', from, to),
      api.getDiaryHistory('DAILY_CARD', from, to),
      api.getDiaryHistory('NUMEROLOGY_DAY', from, to),
    ])
    const entries: DiaryEntryDto[] = []
    for (const r of [r1, r2, r3, r4, r5, r6]) {
      if (r.status === 'fulfilled') entries.push(...r.value.data.entries)
    }
    entries.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    allEntries.value = entries
  } catch {
    error.value = 'Не удалось загрузить историю'
  } finally {
    isLoading.value = false
  }
}

const openEntry = (entry: DiaryEntryDto) => { selected.value = entry }

function entryIcon(entry: DiaryEntryDto): string {
  if (entry.featureType === 'DAILY_CARD')     return '✨'
  if (entry.featureType === 'COMPATIBILITY')  return '💕'
  if (entry.featureType === 'NUMEROLOGY_DAY') return '🔢'
  return '🔮'
}

function entryBg(entry: DiaryEntryDto): string {
  if (entry.featureType === 'DAILY_CARD')     return 'linear-gradient(135deg, #0a1a4e, #1a2b6e)'
  if (entry.featureType === 'COMPATIBILITY')  return 'linear-gradient(135deg, #4e0a2e, #6e1a4a)'
  if (entry.featureType === 'NUMEROLOGY_DAY') return 'linear-gradient(135deg, #2a1a00, #4a3200)'
  return 'linear-gradient(135deg, #3a1b6e, #1a0b2e)'
}

const SPREAD_LABELS: Record<string, string> = {
  THREE_CARD:   '3 карты',
  HORSESHOE:    'Подкова',
  CELTIC_CROSS: 'Кельтский крест',
}

function entryTitle(entry: DiaryEntryDto): string {
  const d = entry.data
  if (!d) return '—'
  if (entry.featureType === 'DAILY_CARD') return d.name || 'Карта дня'
  if (entry.featureType === 'COMPATIBILITY') {
    const persons = d.persons as Array<{ name: string }>
    return persons?.length === 2 ? `${persons[0].name} & ${persons[1].name}` : 'Совместимость'
  }
  if (entry.featureType === 'NUMEROLOGY_DAY') {
    return d.dayCode != null ? `Код дня — ${d.dayCode}` : 'Число дня'
  }
  // Все расклады (THREE_CARD, HORSESHOE, CELTIC_CROSS): показываем вопрос
  if (d.question) return truncate(d.question, 60)
  const cards = d.cards as Array<{ name: string }>
  const label = SPREAD_LABELS[entry.featureType] ?? 'Расклад'
  return cards?.length ? cards.map((c: { name: string }) => c.name).join(' · ') : label
}

function entryKeywords(entry: DiaryEntryDto): string[] {
  const d = entry.data
  if (!d) return []
  if (entry.featureType === 'COMPATIBILITY') return d.compatibilityScore != null ? [`${d.compatibilityScore}%`] : []
  if (FORTUNE_TYPES.includes(entry.featureType)) {
    const label = SPREAD_LABELS[entry.featureType]
    const cards = d.cards as Array<{ cardPosition: string }>
    const positions = cards?.slice(0, 3).map((c: { cardPosition: string }) => posLabel(c.cardPosition)) ?? []
    return label ? [label, ...positions] : positions
  }
  if (entry.featureType === 'NUMEROLOGY_DAY') {
    const kws: string[] = []
    if (d.dayCodeTitle) kws.push(d.dayCodeTitle)
    if (d.zodiacSign)   kws.push(d.zodiacSign)
    if (d.moonPhase)    kws.push(d.moonPhase)
    return kws
  }
  return []
}

function entryNote(entry: DiaryEntryDto): string {
  const d = entry.data
  if (!d) return ''
  if (entry.featureType === 'DAILY_CARD')     return truncate(d.meaning || d.advice || '', 100)
  if (entry.featureType === 'COMPATIBILITY')  return truncate(d.label || '', 100)
  if (entry.featureType === 'NUMEROLOGY_DAY') return truncate(d.energyOfDay || '', 100)
  // Все расклады: если заголовок уже показывает вопрос — в note показываем карты; иначе — интерпретацию
  if (d.question) {
    const cards = d.cards as Array<{ name: string }>
    return cards?.length ? cards.map((c: { name: string }) => c.name).join(' · ') : truncate(d.interpretation || '', 100)
  }
  return truncate(d.interpretation || '', 100)
}

const posLabel = (p: string): string => ({
  PAST: 'Прошлое', PRESENT: 'Настоящее', FUTURE: 'Будущее',
  HORSESHOE_PAST: 'Прошлое', HORSESHOE_PRESENT: 'Настоящее',
  HORSESHOE_HIDDEN: 'Скрытые влияния', HORSESHOE_OBSTACLES: 'Препятствия',
  HORSESHOE_EXTERNAL: 'Внешние влияния', HORSESHOE_ADVICE: 'Совет', HORSESHOE_OUTCOME: 'Итог',
  CELTIC_HEART: 'Суть вопроса', CELTIC_CROSS: 'Что мешает',
  CELTIC_FOUNDATION: 'Основа', CELTIC_PAST: 'Прошлое',
  CELTIC_POSSIBLE_FUTURE: 'Возможное будущее', CELTIC_NEAR_FUTURE: 'Ближайшее будущее',
  CELTIC_SELF: 'Ваша позиция', CELTIC_EXTERNAL: 'Внешние влияния',
  CELTIC_HOPES_FEARS: 'Надежды и страхи', CELTIC_OUTCOME: 'Итог',
} as Record<string, string>)[p] ?? p

const posIcon = (p: string): string => ({
  PAST: '🌑', PRESENT: '🌕', FUTURE: '⭐',
  HORSESHOE_PAST: '🌑', HORSESHOE_PRESENT: '🌕', HORSESHOE_HIDDEN: '🌙',
  HORSESHOE_OBSTACLES: '⚡', HORSESHOE_EXTERNAL: '🌊', HORSESHOE_ADVICE: '💡', HORSESHOE_OUTCOME: '🎯',
  CELTIC_HEART: '💫', CELTIC_CROSS: '✚', CELTIC_FOUNDATION: '🏛',
  CELTIC_PAST: '🌑', CELTIC_POSSIBLE_FUTURE: '🌠', CELTIC_NEAR_FUTURE: '⭐',
  CELTIC_SELF: '🪞', CELTIC_EXTERNAL: '🌊', CELTIC_HOPES_FEARS: '🌙', CELTIC_OUTCOME: '🎯',
} as Record<string, string>)[p] ?? '🔮'

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(loadAll)
</script>

<style scoped>
.screen-wrap { min-height: var(--tg-viewport-stable-height, 100vh); padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px)); overflow-y: auto; }
.content { padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.header-title { font-size:18px; text-align:center; }

/* Filter tabs */
.filter-tabs { display:flex; gap:8px; overflow-x:auto; padding-bottom:4px; margin-bottom:18px; }
.filter-tab {
  padding:7px 16px; border-radius:100px; white-space:nowrap; flex-shrink:0;
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
  color:rgba(255,255,255,.6); font-size:12px; font-weight:600;
  font-family:'Manrope',sans-serif; cursor:pointer; transition:all .2s;
}
.filter-tab.active {
  background:linear-gradient(135deg, rgba(182,84,255,.3), rgba(233,74,168,.2));
  border-color:rgba(182,84,255,.5); color:#F5ECFF;
}

/* Loading */
.loading-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 0; }
.loading-spinner {
  width:32px; height:32px; border-radius:50%;
  border:3px solid rgba(255,255,255,.1); border-top-color:#b654ff;
  animation:spin .8s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }
.loading-text { font-size:13px; color:rgba(255,255,255,.5); }

/* Error */
.error-state { padding:20px; text-align:center; font-size:13px; color:rgba(255,255,255,.7); display:flex; flex-direction:column; gap:12px; align-items:center; }
.retry-btn {
  padding:10px 20px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.15);
  color:#F5ECFF; font-size:13px; font-weight:600; font-family:'Manrope',sans-serif; cursor:pointer;
}

/* Empty */
.empty-state { display:flex; flex-direction:column; align-items:center; text-align:center; padding:60px 20px 0; }
.empty-icon  { font-size:56px; margin-bottom:16px; }
.empty-title { font-size:24px; margin-bottom:10px; }
.empty-sub   { font-size:14px; color:rgba(255,255,255,.55); line-height:1.6; margin-bottom:24px; max-width:260px; }
.empty-btn {
  padding:14px 28px; border-radius:14px;
  background:linear-gradient(135deg, #b654ff, #e94aa8);
  color:#fff; font-size:14px; font-weight:600; font-family:'Manrope',sans-serif; border:none; cursor:pointer;
  box-shadow:0 6px 20px rgba(182,84,255,.4);
}

/* Diary list */
.diary-list { display:flex; flex-direction:column; gap:12px; }
.diary-card {
  display:flex; align-items:center; gap:14px; padding:14px; border-radius:16px; cursor:pointer;
  transition:background .15s;
}
.diary-card:active { background:rgba(255,255,255,.06); }
.diary-card-mini {
  width:52px; height:68px; flex-shrink:0; border-radius:10px;
  display:flex; align-items:center; justify-content:center;
  border:1px solid rgba(255,200,87,.2);
}
.mini-icon { font-size:22px; }
.diary-body { flex:1; min-width:0; }
.diary-head { display:flex; justify-content:space-between; align-items:baseline; gap:8px; margin-bottom:6px; }
.diary-name { font-size:15px; line-height:1.3; }
.diary-date { font-size:11px; color:rgba(255,255,255,.4); flex-shrink:0; }
.diary-keywords { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:6px; }
.diary-kw {
  font-size:10px; text-transform:uppercase; letter-spacing:.06em;
  color:rgba(255,200,87,.8); font-weight:600;
  padding:2px 8px; border-radius:100px;
  background:rgba(255,200,87,.1); border:1px solid rgba(255,200,87,.2);
}
.diary-note { font-size:12px; color:rgba(255,255,255,.55); line-height:1.4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.diary-arrow { font-size:22px; color:rgba(255,255,255,.25); flex-shrink:0; }

/* ── Modal ── */
.modal-overlay {
  position:fixed; inset:0; z-index:100;
  background:rgba(5,2,20,.7); backdrop-filter:blur(4px);
  display:flex; align-items:flex-end;
}
.modal-sheet {
  width:100%; max-height:90vh; overflow-y:auto;
  background:linear-gradient(180deg, #1a0b3e 0%, #0d0620 100%);
  border-top:1px solid rgba(255,255,255,.1);
  border-radius:22px 22px 0 0;
  padding:12px 20px calc(40px + var(--tg-safe-area-inset-bottom, 0px));
  position:relative;
}
.modal-handle {
  width:40px; height:4px; border-radius:2px;
  background:rgba(255,255,255,.2); margin:0 auto 18px;
}
.modal-close {
  position:absolute; top:14px; right:18px;
  width:30px; height:30px; border-radius:50%;
  background:rgba(255,255,255,.08); border:none;
  color:rgba(255,255,255,.5); font-size:12px; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
}
.modal-type-label {
  font-size:11px; text-transform:uppercase; letter-spacing:.1em;
  color:rgba(255,255,255,.45); font-weight:600; margin-bottom:4px;
}
.modal-date {
  font-size:11px; color:rgba(255,255,255,.35); margin-bottom:10px;
}
.modal-title {
  font-size:28px; color:#F5ECFF; margin-bottom:18px; line-height:1.2;
}

/* Sections */
.modal-section { margin-bottom:16px; }
.modal-section--summary {
  background:linear-gradient(135deg, rgba(182,84,255,.08), rgba(233,74,168,.04));
  border:1px solid rgba(182,84,255,.2);
  border-radius:14px; padding:14px 16px;
}
.modal-section-label {
  font-size:10px; text-transform:uppercase; letter-spacing:.12em;
  color:#b654ff; font-weight:700; margin-bottom:8px;
}
.modal-section-body {
  font-size:14px; line-height:1.65; color:rgba(255,255,255,.8);
}

/* Вопрос расклада */
.modal-question-pill {
  display:flex; align-items:flex-start; gap:8px;
  padding:10px 14px; margin-bottom:14px;
  background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.09);
  border-radius:12px;
}
.modal-question-icon { font-size:14px; flex-shrink:0; margin-top:1px; }
.modal-question-text { font-size:13px; color:rgba(255,255,255,.75); line-height:1.5; font-style:italic; }

/* THREE_CARD card blocks */
.modal-card-block {
  border-radius:14px; padding:14px 16px; margin-bottom:10px;
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.07);
  border-left-width:3px;
}
.modal-card-block--past    { border-left-color:#b39ddb; }
.modal-card-block--present { border-left-color:#ffc857; }
.modal-card-block--future  { border-left-color:#70e0a8; }
.modal-card-pos-row { display:flex; align-items:center; gap:6px; margin-bottom:6px; }
.modal-card-pos-icon { font-size:13px; }
.modal-card-pos-label {
  font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.1em;
}
.modal-card-block--past    .modal-card-pos-label { color:#b39ddb; }
.modal-card-block--present .modal-card-pos-label { color:#ffc857; }
.modal-card-block--future  .modal-card-pos-label { color:#70e0a8; }
.modal-card-name { font-size:18px; color:#F5ECFF; margin-bottom:8px; }
.modal-card-interp { font-size:13px; line-height:1.6; color:rgba(255,255,255,.8); margin-bottom:6px; }
.modal-card-meaning { font-size:12px; line-height:1.55; color:rgba(255,255,255,.5); padding-top:6px; border-top:1px solid rgba(255,255,255,.06); }

/* COMPATIBILITY */
.modal-compat-names { display:flex; align-items:center; gap:8px; margin-bottom:14px; flex-wrap:wrap; }
.modal-name-chip {
  padding:6px 14px; border-radius:100px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.12);
  font-size:14px; font-weight:600; color:#F5ECFF;
}
.modal-name-sep { font-size:16px; }
.modal-score-row { display:flex; align-items:baseline; gap:10px; margin-bottom:16px; }
.modal-score-num {
  font-family:'Cormorant Garamond',serif; font-size:48px; font-weight:600; color:#ffc857; line-height:1;
}
.modal-score-label { font-size:20px; color:#F5ECFF; }
.modal-categories { display:flex; flex-direction:column; gap:12px; margin-top:4px; }
.modal-cat-row { display:flex; align-items:center; gap:10px; }
.modal-cat-label { font-size:12px; width:90px; flex-shrink:0; color:rgba(255,255,255,.7); }
.modal-cat-bar-wrap { flex:1; height:6px; border-radius:3px; background:rgba(255,255,255,.08); overflow:hidden; }
.modal-cat-bar {
  height:100%; border-radius:3px;
  background:linear-gradient(90deg, #b654ff, #e94aa8);
  transition:width 1s ease;
}
.modal-cat-pct { font-size:11px; font-weight:600; color:#ffc857; width:30px; text-align:right; flex-shrink:0; }

/* NUMEROLOGY_DAY */
.modal-numerology-hero { text-align:center; margin-bottom:16px; }
.modal-day-code {
  font-family:'Cormorant Garamond',serif;
  font-size:72px; font-weight:500; line-height:1;
  background:linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  -webkit-background-clip:text; background-clip:text; color:transparent;
}
.modal-day-title { font-size:22px; margin-top:6px; font-style:italic; color:#F5ECFF; }
.modal-numerology-strip { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; margin-bottom:20px; }
.modal-num-pill {
  padding:5px 12px; border-radius:100px; font-size:12px; font-weight:500;
  background:rgba(255,200,87,.1); border:1px solid rgba(255,200,87,.2); color:rgba(255,255,255,.8);
}
.modal-section--affirmation {
  background:linear-gradient(135deg, rgba(255,200,87,.08), rgba(233,74,168,.04));
  border:1px solid rgba(255,200,87,.2);
  border-radius:14px; padding:14px 16px;
}
.modal-affirmation-text { font-size:16px; font-style:italic; color:rgba(255,255,255,.9); line-height:1.5; }

/* Paywall в модалке совместимости */
.modal-paywall-wrap {
  position:relative; margin-top:4px;
}
.modal-paywall-content {
  filter:blur(6px);
  pointer-events:none;
  user-select:none;
}
.modal-paywall-overlay {
  position:absolute; inset:0;
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  gap:8px;
  background:rgba(10,5,20,.55);
  backdrop-filter:blur(2px);
  border-radius:14px;
  padding:24px 20px;
}
.modal-paywall-lock { font-size:28px; }
.modal-paywall-title { font-size:18px; color:#F5ECFF; text-align:center; }
.modal-paywall-sub { font-size:12px; color:rgba(255,255,255,.5); text-align:center; line-height:1.5; margin-bottom:4px; }
.modal-paywall-btn {
  padding:12px 24px; border-radius:14px;
  background:linear-gradient(135deg, #b654ff, #e94aa8);
  color:#fff; font-size:14px; font-weight:700;
  font-family:'Manrope',sans-serif; border:none; cursor:pointer;
  box-shadow:0 6px 20px rgba(182,84,255,.45);
  margin-top:4px;
}
.modal-paywall-btn:disabled { opacity:.6; cursor:default; }
.modal-paywall-btn--nav {
  background:rgba(255,255,255,.08);
  border:1px solid rgba(255,255,255,.15);
  color:#F5ECFF;
  box-shadow:none;
}
.modal-paywall-wrap--unlocked .modal-paywall-content {
  filter:none;
  pointer-events:auto;
  user-select:auto;
}
</style>

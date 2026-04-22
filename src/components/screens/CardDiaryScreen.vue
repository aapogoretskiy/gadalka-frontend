<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <button class="back-btn haptic" @click="navigate('profile')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
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
        <button class="empty-btn haptic" @click="navigate('fortune')">
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

        <!-- THREE_CARD -->
        <template v-if="selected.featureType === 'THREE_CARD'">
          <div class="modal-type-label">🔮 Расклад 3 карты</div>
          <div class="modal-date">{{ formatDate(selected.createdAt) }}</div>
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
          <div v-if="selected.data?.interpretation" class="modal-section">
            <div class="modal-section-label">✦ Интерпретация</div>
            <div class="modal-section-body">{{ selected.data.interpretation }}</div>
          </div>
          <div v-if="selected.data?.categories?.length" class="modal-categories">
            <div
              v-for="cat in selected.data.categories"
              :key="cat.name"
              class="modal-cat-row"
            >
              <div class="modal-cat-label">{{ cat.name }}</div>
              <div class="modal-cat-bar-wrap">
                <div class="modal-cat-bar" :style="{ width: cat.score + '%' }"></div>
              </div>
              <div class="modal-cat-pct">{{ cat.score }}%</div>
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

const navigate = inject<(r: string) => void>('navigate')

const isLoading = ref(false)
const error = ref('')
const allEntries = ref<DiaryEntryDto[]>([])
const activeTab = ref<FeatureType | 'ALL'>('ALL')
const selected = ref<DiaryEntryDto | null>(null)

const tabs = [
  { value: 'ALL' as const,           label: 'Все' },
  { value: 'DAILY_CARD' as const,    label: 'Карта дня' },
  { value: 'THREE_CARD' as const,    label: '3 карты' },
  { value: 'COMPATIBILITY' as const, label: 'Совместимость' },
]

const filteredEntries = computed(() =>
  activeTab.value === 'ALL'
    ? allEntries.value
    : allEntries.value.filter(e => e.featureType === activeTab.value)
)

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
    const [r1, r2, r3] = await Promise.allSettled([
      api.getDiaryHistory('THREE_CARD', from, to),
      api.getDiaryHistory('COMPATIBILITY', from, to),
      api.getDiaryHistory('DAILY_CARD', from, to),
    ])
    const entries: DiaryEntryDto[] = []
    for (const r of [r1, r2, r3]) {
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
  if (entry.featureType === 'DAILY_CARD') return '✨'
  if (entry.featureType === 'COMPATIBILITY') return '💕'
  return '🔮'
}

function entryBg(entry: DiaryEntryDto): string {
  if (entry.featureType === 'DAILY_CARD') return 'linear-gradient(135deg, #0a1a4e, #1a2b6e)'
  if (entry.featureType === 'COMPATIBILITY') return 'linear-gradient(135deg, #4e0a2e, #6e1a4a)'
  return 'linear-gradient(135deg, #3a1b6e, #1a0b2e)'
}

function entryTitle(entry: DiaryEntryDto): string {
  const d = entry.data
  if (!d) return '—'
  if (entry.featureType === 'DAILY_CARD') return d.name || 'Карта дня'
  if (entry.featureType === 'COMPATIBILITY') {
    const persons = d.persons as Array<{ name: string }>
    return persons?.length === 2 ? `${persons[0].name} & ${persons[1].name}` : 'Совместимость'
  }
  const cards = d.cards as Array<{ name: string }>
  return cards?.length ? cards.map((c: { name: string }) => c.name).join(' · ') : 'Расклад 3 карты'
}

function entryKeywords(entry: DiaryEntryDto): string[] {
  const d = entry.data
  if (!d) return []
  if (entry.featureType === 'COMPATIBILITY') return d.compatibilityScore != null ? [`${d.compatibilityScore}%`] : []
  if (entry.featureType === 'THREE_CARD') {
    const cards = d.cards as Array<{ cardPosition: string }>
    return cards?.slice(0, 3).map((c: { cardPosition: string }) => posLabel(c.cardPosition)) ?? []
  }
  return []
}

function entryNote(entry: DiaryEntryDto): string {
  const d = entry.data
  if (!d) return ''
  if (entry.featureType === 'DAILY_CARD') return truncate(d.meaning || d.advice || '', 100)
  if (entry.featureType === 'COMPATIBILITY') return truncate(d.label ? `${d.label}. ${d.interpretation || ''}` : (d.interpretation || ''), 100)
  return truncate(d.interpretation || '', 100)
}

const posLabel = (p: string) => ({ PAST: 'Прошлое', PRESENT: 'Настоящее', FUTURE: 'Будущее' } as Record<string, string>)[p] ?? p
const posIcon  = (p: string) => ({ PAST: '🌑', PRESENT: '🌕', FUTURE: '⭐' } as Record<string, string>)[p] ?? '🔮'

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '…' : s
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}

onMounted(loadAll)
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 90px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.back-btn {
  width:36px; height:36px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1);
  display:flex; align-items:center; justify-content:center; cursor:pointer; color:#F5ECFF;
}
.header-title { font-size:18px; }

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
  padding:12px 20px 40px;
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
</style>

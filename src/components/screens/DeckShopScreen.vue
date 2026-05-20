<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Магазин колод</div>
        <div style="width:36px"></div>
      </div>

      <!-- Hero -->
      <div class="shop-hero gradient-card">
        <div class="hero-emoji">🃏</div>
        <div class="hero-text">
          <div class="hero-title serif">Коллекция колод</div>
          <div class="hero-sub">Выберите свою тему</div>
        </div>
        <div class="hero-count">{{ themes.length }} тем</div>
      </div>

      <!-- Filter chips -->
      <div class="filter-row">
        <button
          v-for="f in availableFilters" :key="f"
          class="filter-chip haptic"
          :class="{ active: activeFilter === f }"
          @click="activeFilter = f"
        >{{ f }}</button>
      </div>

      <!-- Состояние загрузки — скелетон-карточки -->
      <div v-if="isLoading" class="deck-grid">
        <div v-for="i in 4" :key="i" class="deck-card glass">
          <div class="skeleton" style="height:110px"></div>
          <div style="padding:12px 14px 14px">
            <div class="skeleton" style="height:16px;width:70%;margin-bottom:8px;border-radius:4px"></div>
            <div class="skeleton" style="height:11px;width:90%;margin-bottom:8px;border-radius:4px"></div>
            <div class="skeleton" style="height:13px;width:40%;border-radius:4px"></div>
          </div>
        </div>
      </div>

      <!-- Ошибка загрузки -->
      <div v-else-if="loadError" class="error-state glass">
        <div class="error-icon">⚠️</div>
        <div class="error-text">Не удалось загрузить темы</div>
        <button class="retry-btn haptic" @click="loadThemes">Попробовать снова</button>
      </div>

      <!-- Deck grid -->
      <div v-else class="deck-grid">
        <div
          v-for="theme in filteredThemes" :key="theme.id"
          class="deck-card glass haptic"
          :class="{ owned: theme.owned, disabled: !theme.enabled }"
          @click="openSheet(theme)"
        >
          <!-- Бейджи -->
          <template v-if="!theme.enabled">
            <div class="deck-badge-coming-soon">
              <ComingSoonBadge />
            </div>
          </template>
          <template v-else>
            <div v-if="visuals(theme.slug).popular" class="deck-badge">ХИТ</div>
            <div v-if="theme.owned && theme.active" class="deck-active-badge">✓</div>
          </template>

          <div class="deck-preview" :style="{ background: visuals(theme.slug).bg }">
            <div class="deck-emoji">{{ visuals(theme.slug).icon }}</div>
          </div>

          <div class="deck-info">
            <div class="deck-name serif">{{ theme.name }}</div>
            <div class="deck-desc">{{ theme.description }}</div>
            <div class="deck-price-row">
              <div v-if="!theme.enabled"><!-- пусто для Coming Soon --></div>
              <div v-else-if="theme.owned" class="deck-owned">
                <span v-if="theme.active" class="owned-active">Активна</span>
                <span v-else class="owned-label">Куплена</span>
              </div>
              <div v-else class="deck-price">
                {{ theme.free ? 'Бесплатно' : theme.price + ' гаданий' }}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Bottom sheet для выбранной темы -->
    <Transition name="sheet">
      <div v-if="selected" class="sheet-overlay" @click.self="selected = null">
        <div class="bottom-sheet">
          <div class="sheet-handle"></div>

          <div class="sheet-preview" :style="{ background: visuals(selected.slug).bg }">
            <div class="sheet-emoji">{{ visuals(selected.slug).icon }}</div>
          </div>

          <div class="sheet-title serif">{{ selected.name }}</div>
          <div class="sheet-desc">{{ selected.description }}</div>

          <div class="sheet-features">
            <div class="feature" v-for="f in visuals(selected.slug).features" :key="f">
              <span class="feature-check">✓</span> {{ f }}
            </div>
          </div>

          <!-- Кнопки действий -->
          <div style="width:100%;display:flex;flex-direction:column;gap:10px">

            <!-- Тема уже активна -->
            <button v-if="selected.active" class="sheet-btn active-state" disabled>
              Активна ✓
            </button>

            <!-- Тема owned, но не активна — кнопка активации -->
            <template v-else-if="selected.owned">
              <button class="sheet-btn primary haptic" @click="handleActivate(selected)">
                Активировать колоду
              </button>
            </template>

            <!-- Тема не куплена — кнопка покупки -->
            <template v-else>
              <button
                class="sheet-btn primary haptic"
                :disabled="isPurchasing"
                @click="handlePurchase(selected)"
              >
                <span v-if="isPurchasing" class="btn-spinner"></span>
                <span v-else>
                  {{ selected.free ? 'Получить бесплатно' : 'Купить за ' + selected.price + ' гаданий' }}
                </span>
              </button>
            </template>

            <button class="sheet-btn secondary haptic" @click="selected = null">
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTheme } from '@/composables/useTheme'
import { type ThemeDto } from '@/utils/api'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'

// ── Визуальные данные тем (slug → иконка, градиент, категория, фичи) ────────
// Бэкенд отвечает за бизнес-логику (цена, owned, active).
// Фронтенд отвечает за визуальную подачу (цвета, иконки).
// При добавлении новой темы на бэке — добавьте её slug сюда.
interface ThemeVisuals {
  icon: string
  bg: string
  category: string
  features: string[]
  popular?: boolean
}

const THEME_VISUALS: Record<string, ThemeVisuals> = {
  classic: {
    icon: '📜',
    bg: 'linear-gradient(135deg, #3a1b0e, #6b3a1f)',
    category: 'Классика',
    features: ['78 карт', 'Традиционный стиль', 'Классическая символика'],
  },
  cosmic: {
    icon: '🌌',
    bg: 'linear-gradient(135deg, #0a1a4e, #1a2b8e)',
    category: 'Мистика',
    features: ['78 карт', 'Звёздные фоны', 'Небесные архетипы'],
    popular: true,
  },
  gothic: {
    icon: '🦇',
    bg: 'linear-gradient(135deg, #1a0a2e, #2a1a3e)',
    category: 'Мистика',
    features: ['78 карт', 'Тёмная палитра', 'Мрачные образы'],
  },
  nature: {
    icon: '🌿',
    bg: 'linear-gradient(135deg, #0a2e1a, #1a4e2a)',
    category: 'Стихии',
    features: ['78 карт', 'Природные мотивы', 'Зелёная палитра'],
  },
  crystal: {
    icon: '💎',
    bg: 'linear-gradient(135deg, #0a2a4e, #1a3a6e)',
    category: 'Мистика',
    features: ['78 карт', 'Кристаллические текстуры', 'Пастельные оттенки'],
  },
  sakura: {
    icon: '🌸',
    bg: 'linear-gradient(135deg, #4e0a2a, #6e1a3a)',
    category: 'Стихии',
    features: ['78 карт', 'Японский стиль', 'Цветочные узоры'],
  },
}

// Fallback для тем, slug которых ещё не добавлен в THEME_VISUALS
const FALLBACK_VISUALS: ThemeVisuals = {
  icon: '🃏',
  bg: 'linear-gradient(135deg, #1a0529, #2a1040)',
  category: 'Другие',
  features: ['78 карт'],
}

const visuals = (slug: string): ThemeVisuals =>
  THEME_VISUALS[slug] ?? FALLBACK_VISUALS

// ── Composable ───────────────────────────────────────────────────────────────
const { themes, isLoading, isPurchasing, fetchThemes, activateTheme, purchaseTheme } = useTheme()

// ── Локальное состояние ──────────────────────────────────────────────────────
const loadError    = ref(false)
const activeFilter = ref('Все')
const selected     = ref<ThemeDto | null>(null)

// Список категорий формируем динамически из загруженных тем
const availableFilters = computed(() => {
  const cats = themes.value
    .map(t => visuals(t.slug).category)
    .filter((c, i, arr) => arr.indexOf(c) === i)
  return ['Все', ...cats]
})

const filteredThemes = computed(() => {
  if (activeFilter.value === 'Все') return themes.value
  return themes.value.filter(t => visuals(t.slug).category === activeFilter.value)
})

// ── Обработчики ──────────────────────────────────────────────────────────────

const openSheet = (theme: ThemeDto) => {
  if (!theme.enabled) return
  selected.value = theme
}

const handleActivate = async (theme: ThemeDto) => {
  await activateTheme(theme.id)
  selected.value = null
}

// После покупки обновляем selected, чтобы сразу показать кнопку "Активировать"
const handlePurchase = async (theme: ThemeDto) => {
  const success = await purchaseTheme(theme.id)
  if (success) {
    const updated = themes.value.find(t => t.id === theme.id)
    if (updated) selected.value = { ...updated }
  }
}

// ── Загрузка ─────────────────────────────────────────────────────────────────
const loadThemes = async () => {
  loadError.value = false
  try {
    await fetchThemes()
  } catch {
    loadError.value = true
  }
}

onMounted(() => {
  loadThemes()
})
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
}
.content {
  padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px;
}

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
.header-title { font-size:18px; text-align:center; }

.shop-hero {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 20px; margin-bottom: 16px;
}
.hero-emoji { font-size: 32px; }
.hero-text  { flex: 1; }
.hero-title { font-size: 20px; margin-bottom: 2px; }
.hero-sub   { font-size: 12px; color: rgba(255,255,255,.6); }
.hero-count {
  padding: 6px 12px; border-radius: 100px;
  background: rgba(255,200,87,.15); border: 1px solid rgba(255,200,87,.3);
  font-size: 12px; font-weight: 700; color: #ffc857; white-space: nowrap;
}

.filter-row {
  display: flex; gap: 8px; margin-bottom: 16px;
  overflow-x: auto; padding-bottom: 2px;
}
.filter-chip {
  padding: 7px 14px; border-radius: 100px; white-space: nowrap;
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
  font-size: 12px; font-weight: 600; color: rgba(255,255,255,.6);
  cursor: pointer; transition: all .2s; font-family: 'Manrope', sans-serif;
}
.filter-chip.active {
  background: linear-gradient(135deg, rgba(182,84,255,.25), rgba(233,74,168,.15));
  border-color: rgba(182,84,255,.5); color: #F5ECFF;
}

.error-state {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; padding: 32px 20px; text-align: center;
}
.error-icon { font-size: 32px; }
.error-text { font-size: 14px; color: rgba(255,255,255,.6); }
.retry-btn {
  padding: 10px 24px; border-radius: 100px;
  background: rgba(182,84,255,.15); border: 1px solid rgba(182,84,255,.3);
  color: #b654ff; font-size: 13px; font-weight: 600;
  font-family: 'Manrope', sans-serif; cursor: pointer;
}

.deck-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.deck-card {
  padding: 0; border-radius: 16px; overflow: hidden;
  cursor: pointer; position: relative; transition: opacity .2s;
}
.deck-card.disabled { opacity: 0.55; cursor: default; }
.deck-card.disabled:active { transform: none; }

.deck-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2;
  background: #ffc857; color: #1a0529;
  font-size: 8px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
  letter-spacing: .06em; text-transform: uppercase;
}
.deck-badge-coming-soon { position: absolute; top: 8px; left: 8px; z-index: 2; }
.deck-active-badge {
  position: absolute; top: 8px; right: 8px; z-index: 2;
  width: 20px; height: 20px; border-radius: 50%;
  background: linear-gradient(135deg, #70e0a8, #47b896);
  display: flex; align-items: center; justify-content: center;
  font-size: 10px; font-weight: 700; color: #0a3a2a;
}

.deck-preview {
  height: 110px;
  display: flex; align-items: center; justify-content: center;
}
.deck-emoji { font-size: 40px; filter: drop-shadow(0 4px 12px rgba(0,0,0,.5)); }

.deck-info { padding: 12px 14px 14px; }
.deck-name  { font-size: 16px; margin-bottom: 3px; }
.deck-desc  { font-size: 11px; color: rgba(255,255,255,.55); line-height: 1.4; margin-bottom: 8px; }
.deck-price { font-size: 13px; font-weight: 700; color: #ffc857; }
.owned-active { font-size: 11px; font-weight: 700; color: #70e0a8; }
.owned-label  { font-size: 11px; color: rgba(255,255,255,.5); }

.sheet-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.bottom-sheet {
  width: 100%; max-height: 85vh;
  background: #15062a;
  border-top: 1px solid rgba(255,255,255,.12);
  border-radius: 24px 24px 0 0;
  padding: 12px 24px calc(32px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
  display: flex; flex-direction: column; align-items: center; gap: 16px;
}
.sheet-handle {
  width: 36px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.2); margin-bottom: 4px;
}
.sheet-preview {
  width: 100%; height: 140px; border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
}
.sheet-emoji { font-size: 56px; filter: drop-shadow(0 4px 16px rgba(0,0,0,.6)); }
.sheet-title { font-size: 26px; text-align: center; }
.sheet-desc  { font-size: 14px; color: rgba(255,255,255,.65); text-align: center; line-height: 1.5; }

.sheet-features { width: 100%; display: flex; flex-direction: column; gap: 8px; }
.feature {
  font-size: 13px; color: rgba(255,255,255,.75);
  display: flex; align-items: center; gap: 8px;
}
.feature-check {
  width: 18px; height: 18px; border-radius: 50%;
  background: linear-gradient(135deg, #70e0a8, #47b896);
  display: flex; align-items: center; justify-content: center;
  font-size: 9px; color: #0a3a2a; font-weight: 700; flex-shrink: 0;
}

.sheet-btn {
  width: 100%; padding: 15px; border-radius: 16px;
  font-size: 15px; font-weight: 600; font-family: 'Manrope', sans-serif;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.sheet-btn.primary {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; box-shadow: 0 8px 24px rgba(182,84,255,.4);
}
.sheet-btn.primary:disabled { opacity: 0.7; cursor: default; }
.sheet-btn.secondary {
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); color: #F5ECFF;
}
.sheet-btn.active-state {
  background: rgba(112,224,168,.15); border: 1px solid rgba(112,224,168,.3);
  color: #70e0a8; cursor: default;
}

.btn-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  animation: spin 0.7s linear infinite; flex-shrink: 0;
}
@keyframes spin { to { transform: rotate(360deg); } }

.sheet-enter-active,
.sheet-leave-active { transition: opacity 0.25s ease; }
.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
.sheet-enter-active .bottom-sheet,
.sheet-leave-active .bottom-sheet { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.sheet-enter-from .bottom-sheet { transform: translateY(100%); }
.sheet-leave-to   .bottom-sheet { transform: translateY(100%); }
</style>

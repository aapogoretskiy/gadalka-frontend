<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <button class="back-btn haptic" @click="navigate('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
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
        <div class="hero-count">{{ decks.length }} тем</div>
      </div>

      <!-- Filter chips -->
      <div class="filter-row">
        <button
          v-for="f in filters" :key="f"
          class="filter-chip haptic"
          :class="{ active: activeFilter === f }"
          @click="activeFilter = f"
        >{{ f }}</button>
      </div>

      <!-- Deck grid -->
      <div class="deck-grid">
        <div
          v-for="deck in filteredDecks" :key="deck.id"
          class="deck-card glass haptic"
          :class="{ owned: deck.owned, disabled: deck.disabled }"
          @click="selectDeck(deck)"
        >
          <!-- Badges: disabled decks show only coming-soon, enabled show hit/active -->
          <template v-if="deck.disabled">
            <div class="deck-badge-coming-soon"><ComingSoonBadge /></div>
          </template>
          <template v-else>
            <div v-if="deck.popular" class="deck-badge">ХИТ</div>
            <div v-if="deck.owned && deck.active" class="deck-active-badge">✓</div>
          </template>

          <div class="deck-preview" :style="{ background: deck.bg }">
            <div class="deck-emoji">{{ deck.icon }}</div>
          </div>

          <div class="deck-info">
            <div class="deck-name serif">{{ deck.name }}</div>
            <div class="deck-desc">{{ deck.description }}</div>
            <div class="deck-price-row">
              <div v-if="deck.disabled">
                <!-- price row intentionally empty for disabled — badge is at top -->
              </div>
              <div v-else-if="deck.owned" class="deck-owned">
                <span v-if="deck.active" class="owned-active">Активна</span>
                <span v-else class="owned-label">Куплена</span>
              </div>
              <div v-else class="deck-price">{{ deck.price === 0 ? 'Бесплатно' : deck.price + ' ⭐' }}</div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Bottom sheet for selected deck -->
    <div v-if="selected" class="sheet-overlay" @click.self="selected = null">
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>

        <div class="sheet-preview" :style="{ background: selected.bg }">
          <div class="sheet-emoji">{{ selected.icon }}</div>
        </div>

        <div class="sheet-title serif">{{ selected.name }}</div>
        <div class="sheet-desc">{{ selected.description }}</div>

        <div class="sheet-features">
          <div class="feature" v-for="f in selected.features" :key="f">
            <span class="feature-check">✓</span> {{ f }}
          </div>
        </div>

        <div v-if="selected.owned">
          <button
            v-if="!selected.active"
            class="sheet-btn primary haptic"
            @click="activateDeck(selected)"
          >Активировать колоду</button>
          <button v-else class="sheet-btn disabled" disabled>Уже активна ✓</button>
        </div>
        <div v-else style="display:flex;flex-direction:column;gap:10px">
          <button class="sheet-btn primary haptic" @click="purchaseDeck(selected)">
            {{ selected.price === 0 ? 'Получить бесплатно' : 'Купить за ' + selected.price + ' ⭐' }}
          </button>
          <button class="sheet-btn secondary haptic" @click="selected = null">Отмена</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import ComingSoonBadge from '@/components/ui/ComingSoonBadge.vue'

const navigate = inject<(r: string) => void>('navigate')

interface Deck {
  id: string
  name: string
  description: string
  icon: string
  bg: string
  price: number
  owned: boolean
  active: boolean
  popular?: boolean
  disabled?: boolean
  category: string
  features: string[]
}

const decks = ref<Deck[]>([
  {
    id: 'classic', name: 'Классическая', description: 'Традиционная колода Райдера-Уэйта',
    icon: '📜', bg: 'linear-gradient(135deg, #3a1b0e, #6b3a1f)',
    price: 0, owned: true, active: true, category: 'Классика',
    features: ['78 карт', 'Традиционный стиль', 'Классическая символика'],
  },
  {
    id: 'cosmic', name: 'Космическая', description: 'Звёздная магия и вселенная',
    icon: '🌌', bg: 'linear-gradient(135deg, #0a1a4e, #1a2b8e)',
    price: 349, owned: false, active: false, popular: true, disabled: true, category: 'Мистика',
    features: ['78 карт', 'Звёздные фоны', 'Небесные архетипы'],
  },
  {
    id: 'gothic', name: 'Готическая', description: 'Тёмная эстетика и мистика',
    icon: '🦇', bg: 'linear-gradient(135deg, #1a0a2e, #2a1a3e)',
    price: 349, owned: false, active: false, disabled: true, category: 'Мистика',
    features: ['78 карт', 'Тёмная палитра', 'Мрачные образы'],
  },
  {
    id: 'nature', name: 'Природная', description: 'Сила стихий и природы',
    icon: '🌿', bg: 'linear-gradient(135deg, #0a2e1a, #1a4e2a)',
    price: 249, owned: false, active: false, disabled: true, category: 'Стихии',
    features: ['78 карт', 'Природные мотивы', 'Зелёная палитра'],
  },
  {
    id: 'crystal', name: 'Кристальная', description: 'Магия кристаллов',
    icon: '💎', bg: 'linear-gradient(135deg, #0a2a4e, #1a3a6e)',
    price: 399, owned: false, active: false, popular: true, disabled: true, category: 'Мистика',
    features: ['78 карт', 'Кристаллические текстуры', 'Пастельные оттенки'],
  },
  {
    id: 'sakura', name: 'Сакура', description: 'Японская эстетика',
    icon: '🌸', bg: 'linear-gradient(135deg, #4e0a2a, #6e1a3a)',
    price: 349, owned: false, active: false, disabled: true, category: 'Стихии',
    features: ['78 карт', 'Японский стиль', 'Цветочные узоры'],
  },
])

const filters = ['Все', 'Классика', 'Мистика', 'Стихии']
const activeFilter = ref('Все')

const filteredDecks = computed(() =>
  activeFilter.value === 'Все' ? decks.value : decks.value.filter(d => d.category === activeFilter.value)
)

const selected = ref<Deck | null>(null)

const selectDeck = (deck: Deck) => { if (!deck.disabled) selected.value = deck }

const activateDeck = (deck: Deck) => {
  decks.value.forEach(d => { d.active = false })
  const found = decks.value.find(d => d.id === deck.id)
  if (found) found.active = true
  selected.value = null
}

const purchaseDeck = (deck: Deck) => {
  // TODO: Telegram Stars payment
  console.log('Purchase:', deck.id)
  selected.value = null
}
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

/* Shop hero */
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
  font-size: 12px; font-weight: 700; color: #ffc857;
}

/* Filter row */
.filter-row { display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 2px; }
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

/* Deck grid */
.deck-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.deck-card { padding: 0; border-radius: 16px; overflow: hidden; cursor: pointer; position: relative; transition: opacity .2s; }
.deck-card.disabled { opacity: 0.55; cursor: default; }
.deck-card.disabled:active { transform: none; }

.deck-badge {
  position: absolute; top: 8px; left: 8px; z-index: 2;
  background: #ffc857; color: #1a0529;
  font-size: 8px; font-weight: 700; padding: 2px 6px; border-radius: 4px;
  letter-spacing: .06em; text-transform: uppercase;
}
.deck-badge-coming-soon {
  position: absolute; top: 8px; left: 8px; z-index: 2;
}
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
.deck-price-row { }
.deck-price { font-size: 13px; font-weight: 700; color: #ffc857; }
.deck-owned { }
.owned-active { font-size: 11px; font-weight: 700; color: #70e0a8; }
.owned-label  { font-size: 11px; color: rgba(255,255,255,.5); }

/* Bottom sheet */
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
  padding: 12px 24px 40px;
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
.feature { font-size: 13px; color: rgba(255,255,255,.75); display: flex; align-items: center; gap: 8px; }
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
}
.sheet-btn.primary {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff; box-shadow: 0 8px 24px rgba(182,84,255,.4);
}
.sheet-btn.secondary {
  background: rgba(255,255,255,.07); border: 1px solid rgba(255,255,255,.1); color: #F5ECFF;
}
.sheet-btn.disabled {
  background: rgba(112,224,168,.15); border: 1px solid rgba(112,224,168,.3);
  color: #70e0a8; cursor: default;
}
</style>

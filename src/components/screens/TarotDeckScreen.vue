<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <button class="back-btn haptic" @click="navigate('home')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="header-title serif">Колода Таро</div>
        <div class="card-count">{{ filteredCards.length }} карт</div>
      </div>

      <!-- Filter chips -->
      <div class="filter-row">
        <button
          v-for="suit in suits" :key="suit.id"
          class="filter-chip haptic"
          :class="{ active: selectedSuit === suit.id }"
          @click="selectedSuit = suit.id"
        >{{ suit.label }}</button>
      </div>

      <!-- Card grid -->
      <div class="cards-grid">
        <button
          v-for="card in filteredCards" :key="card.id"
          class="card-cell haptic"
          @click="selectCard(card)"
        >
          <div class="cell-inner">
            <div class="cell-back">
              <svg viewBox="0 0 60 80" fill="none" opacity="0.6" style="width:55%">
                <rect x="4" y="4" width="52" height="72" rx="4" stroke="#ffc857" stroke-width="1"/>
                <circle cx="30" cy="40" r="16" stroke="#ffc857" stroke-width="0.8"/>
                <path d="M30 24 L30 56 M14 40 L46 40" stroke="#ffc857" stroke-width="0.6"/>
              </svg>
            </div>
            <div class="cell-name serif">{{ card.nameRu }}</div>
          </div>
        </button>
      </div>

    </div>

    <!-- Card modal -->
    <Transition name="modal">
      <div v-if="selectedCard" class="modal-overlay" @click.self="selectedCard = null">
        <div class="modal-box">
          <button class="modal-close haptic" @click="selectedCard = null">✕</button>

          <div class="modal-card-preview">
            <div class="modal-roman">{{ romanNumeral }}</div>
            <div class="modal-emoji">🌟</div>
            <div class="modal-card-name serif">{{ selectedCard.nameRu }}</div>
          </div>

          <div class="modal-body scrollbar-hide">
            <div class="modal-section">
              <div class="modal-section-label">Значение</div>
              <div class="modal-section-text">{{ selectedCard.meaning }}</div>
            </div>
            <div class="modal-section">
              <div class="modal-section-label">Перевёрнутая</div>
              <div class="modal-section-text">{{ selectedCard.reversed }}</div>
            </div>
            <div class="modal-section">
              <div class="modal-section-label">Ключевые слова</div>
              <div class="keywords">
                <span v-for="kw in selectedCard.keywords" :key="kw" class="kw">{{ kw }}</span>
              </div>
            </div>

            <button class="add-btn haptic" @click="addToDiary">
              Добавить в дневник
            </button>
          </div>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import tarotDeck, { type TarotCard } from '@/data/tarotDeck'
import { hapticFeedback } from '@/utils/telegram'

const navigate = inject<(r: string) => void>('navigate')

const selectedSuit = ref('all')
const selectedCard = ref<TarotCard | null>(null)

const suits = [
  { id: 'all',       label: 'Все' },
  { id: 'major',     label: 'Старшие' },
  { id: 'wands',     label: 'Жезлы' },
  { id: 'cups',      label: 'Кубки' },
  { id: 'swords',    label: 'Мечи' },
  { id: 'pentacles', label: 'Пентакли' },
]

const filteredCards = computed(() =>
  selectedSuit.value === 'all' ? tarotDeck : tarotDeck.filter(c => c.suit === selectedSuit.value)
)

const romanNumerals = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
  'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI']
const romanNumeral = computed(() => selectedCard.value ? (romanNumerals[selectedCard.value.number] || '') : '')

const selectCard = (card: TarotCard) => {
  selectedCard.value = card
  hapticFeedback.medium()
}

const addToDiary = () => {
  hapticFeedback.success()
  selectedCard.value = null
  navigate?.('diary')
}
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 90px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:18px; }
.back-btn {
  width:36px; height:36px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1);
  display:flex; align-items:center; justify-content:center; cursor:pointer; color:#F5ECFF;
}
.header-title { font-size:18px; }
.card-count {
  padding:5px 10px; border-radius:100px;
  background:rgba(255,200,87,.12); border:1px solid rgba(255,200,87,.25);
  font-size:11px; font-weight:700; color:#ffc857;
}

/* Filter */
.filter-row { display:flex; gap:8px; margin-bottom:16px; overflow-x:auto; padding-bottom:2px; }
.filter-chip {
  padding:7px 14px; border-radius:100px; white-space:nowrap;
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
  font-size:12px; font-weight:600; color:rgba(255,255,255,.6);
  cursor:pointer; transition:all .2s; font-family:'Manrope',sans-serif;
}
.filter-chip.active {
  background:linear-gradient(135deg, rgba(182,84,255,.25), rgba(233,74,168,.15));
  border-color:rgba(182,84,255,.5); color:#F5ECFF;
}

/* Cards grid */
.cards-grid { display:grid; grid-template-columns:repeat(3, 1fr); gap:10px; }
.card-cell {
  aspect-ratio: 2/3; border-radius:12px; overflow:hidden;
  background:rgba(255,255,255,.04); border:1px solid rgba(255,255,255,.08);
  cursor:pointer; padding:0; transition:all .2s;
  display:flex;
}
.card-cell:active { transform:scale(.95); border-color:rgba(255,200,87,.4); }
.cell-inner {
  flex:1; display:flex; flex-direction:column; align-items:center; justify-content:space-between;
  padding:12px 8px;
  background:linear-gradient(160deg, #3a1b6e 0%, #1a0b2e 100%);
}
.cell-back {
  flex:1; display:flex; align-items:center; justify-content:center;
}
.cell-name {
  font-size:10px; text-align:center; color:rgba(255,255,255,.85);
  line-height:1.3; padding:0 4px;
}

/* Modal */
.modal-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.7); backdrop-filter: blur(6px);
  display: flex; align-items: flex-end;
}
.modal-box {
  width: 100%; max-height: 88vh;
  background: #15062a;
  border-top: 1px solid rgba(255,255,255,.12);
  border-radius: 24px 24px 0 0;
  overflow: hidden;
  display: flex; flex-direction: column;
}
.modal-close {
  position: absolute; top: 16px; right: 16px;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,.1); border: none;
  color: #F5ECFF; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.modal-card-preview {
  display: flex; flex-direction: column; align-items: center; justify-content: space-between;
  padding: 24px 20px 20px;
  background: linear-gradient(160deg, #3a1b6e 0%, #1a0b2e 100%);
  border-bottom: 1px solid rgba(255,200,87,.15);
  position: relative;
}
.modal-roman { font-family:'Cormorant Garamond',serif; font-size:16px; color:#ffc857; letter-spacing:.2em; }
.modal-emoji { font-size:52px; margin:8px 0; }
.modal-card-name { font-size:24px; color:#fff; }

.modal-body { flex:1; overflow-y:auto; padding:20px; display:flex; flex-direction:column; gap:16px; }
.modal-section { }
.modal-section-label {
  font-size:10px; text-transform:uppercase; letter-spacing:.1em;
  color:#ffc857; font-weight:600; margin-bottom:8px;
}
.modal-section-text { font-size:14px; line-height:1.65; color:rgba(255,255,255,.75); }

.keywords { display:flex; flex-wrap:wrap; gap:6px; }
.kw {
  font-size:11px; text-transform:uppercase; letter-spacing:.08em;
  color:rgba(255,200,87,.8); font-weight:600;
  padding:3px 10px; border-radius:100px;
  background:rgba(255,200,87,.1); border:1px solid rgba(255,200,87,.2);
}

.add-btn {
  width:100%; padding:15px; border-radius:16px; margin-top:4px;
  background:linear-gradient(135deg, #b654ff, #e94aa8);
  color:#fff; font-size:15px; font-weight:600;
  font-family:'Manrope',sans-serif; border:none; cursor:pointer;
  box-shadow:0 8px 24px rgba(182,84,255,.4);
}

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: all .35s cubic-bezier(.4,0,.2,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: translateY(40px); }
</style>

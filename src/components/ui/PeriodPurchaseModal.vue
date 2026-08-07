<template>
  <Transition name="sheet">
    <div v-if="open" class="sheet-overlay" @click.self="$emit('close')">
      <div class="bottom-sheet">
        <div class="sheet-handle"></div>

        <div class="sheet-preview">
          <div class="sheet-emoji">{{ icon }}</div>
        </div>

        <div class="sheet-title serif">{{ title }}</div>
        <div v-if="description" class="sheet-desc">{{ description }}</div>

        <div class="sheet-features">
          <div class="feature" v-for="f in features" :key="f">
            <span class="feature-check">✓</span> {{ f }}
          </div>
        </div>

        <!--
          Способ оплаты выбран кнопкой на пейволле ДО открытия этого шита, поэтому
          показываем цену только выбранным способом. Подсказка «или квота» здесь
          больше не нужна — выбор уже сделан.
        -->
        <div v-if="payWithQuota" class="sheet-price">
          По подписке
          <div class="sheet-price-sub">осталось {{ quotaRemaining }}</div>
        </div>
        <div v-else class="sheet-price">{{ cost }} {{ znakiWord(cost) }}</div>

        <div style="width:100%;display:flex;flex-direction:column;gap:10px">
          <button class="sheet-btn primary haptic" :disabled="loading" @click="$emit('confirm')">
            <span v-if="loading" class="btn-spinner"></span>
            <span v-else-if="payWithQuota">Открыть по подписке</span>
            <span v-else>Оплатить {{ cost }} {{ znakiWord(cost) }}</span>
          </button>
          <button class="sheet-btn secondary haptic" :disabled="loading" @click="$emit('close')">
            Позже
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { znakiWord } from '@/utils/plural'

withDefaults(defineProps<{
  open: boolean
  title: string
  icon: string
  description?: string
  features: string[]
  cost: number
  loading?: boolean
  /** Остаток квоты подписки на эту фичу (0 — квоты нет или подписки нет) */
  quotaRemaining?: number
  /** true — знаков не хватает, оплата возможна только квотой (единственный вариант) */
  payWithQuota?: boolean
}>(), {
  quotaRemaining: 0,
  payWithQuota: false,
})

defineEmits<{
  confirm: []
  close: []
}>()
</script>

<style scoped>
.sheet-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: rgba(0,0,0,.6); backdrop-filter: blur(4px);
  display: flex; align-items: flex-end;
}
.bottom-sheet {
  width: 100%; max-height: 85vh;
  background: #15062a;
  border-radius: 24px 24px 0 0;
  padding: 12px 24px calc(24px + var(--tg-safe-area-inset-bottom, 0px));
  display: flex; flex-direction: column; align-items: center;
  overflow-y: auto;
  box-shadow: 0 -10px 40px rgba(0,0,0,.4);
}
.sheet-handle {
  width: 40px; height: 4px; border-radius: 2px;
  background: rgba(255,255,255,.2);
  margin-bottom: 18px;
}
.sheet-preview {
  width: 64px; height: 64px; border-radius: 18px;
  background: linear-gradient(135deg, rgba(182,84,255,.25), rgba(233,74,168,.15));
  border: 1px solid rgba(182,84,255,.35);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 14px;
}
.sheet-emoji { font-size: 30px; }
.sheet-title { font-size: 20px; text-align: center; margin-bottom: 6px; }
.sheet-desc {
  font-size: 13px; line-height: 1.55; color: rgba(255,255,255,.6);
  text-align: center; margin-bottom: 16px;
}
.sheet-features {
  width: 100%; display: flex; flex-direction: column; gap: 8px;
  margin-bottom: 16px;
}
.feature {
  font-size: 13px; color: rgba(255,255,255,.8);
  display: flex; align-items: flex-start; gap: 8px;
}
.feature-check { color: #4ade80; font-weight: 700; flex-shrink: 0; }
.sheet-price {
  font-family: 'Cormorant Garamond', serif;
  font-size: 28px; font-weight: 600; color: #ffc857;
  margin-bottom: 18px;
  text-align: center;
}
.sheet-price-sub {
  font-family: 'Manrope', sans-serif;
  font-size: 13px; font-weight: 500; color: #ffc857;
  margin-top: 2px;
}

.sheet-btn {
  width: 100%; padding: 15px; border-radius: 16px;
  font-size: 15px; font-weight: 600; font-family: 'Manrope', sans-serif;
  border: none; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
}
.sheet-btn.primary {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  box-shadow: 0 8px 24px rgba(182,84,255,.4);
}
.sheet-btn.primary:disabled { opacity: .6; cursor: not-allowed; }
.sheet-btn.secondary {
  background: rgba(255,255,255,.06);
  color: rgba(255,255,255,.6);
}
.btn-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  animation: spin .8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

.sheet-enter-from,
.sheet-leave-to { opacity: 0; }
.sheet-enter-active,
.sheet-leave-active { transition: opacity 0.3s ease; }
.sheet-enter-active .bottom-sheet,
.sheet-leave-active .bottom-sheet { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
.sheet-enter-from .bottom-sheet { transform: translateY(100%); }
.sheet-leave-to   .bottom-sheet { transform: translateY(100%); }
</style>

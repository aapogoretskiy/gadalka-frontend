<template>
  <div class="screen-wrap">
    <div class="content">

      <!-- Анимированная иконка -->
      <div class="success-hero">
        <div class="orb-ring orb-ring--3"></div>
        <div class="orb-ring orb-ring--2"></div>
        <div class="orb-ring orb-ring--1"></div>
        <div class="orb-center">
          <span v-if="purchase?.isPending">⏳</span>
          <span v-else>✨</span>
        </div>
      </div>

      <!-- Заголовок -->
      <div class="success-title serif">
        {{ purchase?.isPending ? 'Платёж получен' : 'Оплата прошла!' }}
      </div>
      <div class="success-sub">
        {{ purchase?.isPending
          ? 'Гадания появятся в течение минуты — обрабатываем платёж'
          : 'Гадания уже на вашем балансе' }}
      </div>

      <!-- Карточка покупки -->
      <div class="purchase-card glass">
        <div class="purchase-row">
          <div class="purchase-label">Пакет</div>
          <div class="purchase-val">{{ purchase?.productName }}</div>
        </div>
        <div class="purchase-divider"></div>
        <div class="purchase-row">
          <div class="purchase-label">Добавлено гаданий</div>
          <div class="purchase-val purchase-val--accent">
            +{{ purchase?.readingsCount }}
          </div>
        </div>
        <div class="purchase-divider"></div>
        <div class="purchase-row">
          <div class="purchase-label">Баланс</div>
          <div class="purchase-val">
            <span v-if="purchase?.isPending" class="pending-label">обновится после подтверждения</span>
            <span v-else class="balance-label-val">
              🔮 {{ balance }} {{ balancePlural }}
            </span>
          </div>
        </div>
        <div class="purchase-divider"></div>
        <div class="purchase-row">
          <div class="purchase-label">Способ оплаты</div>
          <div class="purchase-val">
            {{ purchase?.provider === 'stars' ? '⭐ Telegram Stars' : '💳 Банковская карта' }}
          </div>
        </div>
      </div>

      <!-- Кнопки -->
      <button class="btn-primary haptic" @click="goFortune">
        Начать гадание →
      </button>

      <button class="btn-secondary haptic" @click="goHome">
        На главную
      </button>

    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, inject } from 'vue'
import { useLastPurchase } from '@/composables/useLastPurchase'
import { useBalance } from '@/composables/useBalance'

const navigate = inject<(r: string) => void>('navigate')
const { lastPurchase: purchase, clearPurchase } = useLastPurchase()
const { balance, refreshBalance } = useBalance()

const balancePlural = computed(() => {
  const n = balance.value
  if (n === 1) return 'знак'
  if (n >= 2 && n <= 4) return 'знака'
  return 'знаков'
})

onMounted(async () => {
  // На случай если баланс ещё не обновился — обновляем при входе на экран
  await refreshBalance()
})

function goFortune() {
  clearPurchase()
  navigate?.('fortune')
}

function goHome() {
  clearPurchase()
  navigate?.('home')
}
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: calc(40px + var(--tg-safe-area-inset-bottom, 0px));
}
.content {
  padding: 40px 24px 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 420px;
}

/* Animated orb */
.success-hero {
  position: relative;
  width: 140px;
  height: 140px;
  margin-bottom: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.orb-ring {
  position: absolute;
  border-radius: 50%;
  border: 1px solid rgba(182,84,255,0.35);
  animation: ring-pulse 3s ease-in-out infinite;
}
.orb-ring--1 { inset: 20px; animation-delay: 0s; border-color: rgba(182,84,255,0.5); }
.orb-ring--2 { inset: 6px;  animation-delay: 0.6s; }
.orb-ring--3 { inset: -10px; animation-delay: 1.2s; border-color: rgba(233,74,168,0.2); }

@keyframes ring-pulse {
  0%,100% { opacity: 0.4; transform: scale(1); }
  50%      { opacity: 1;   transform: scale(1.04); }
}

.orb-center {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  box-shadow: 0 0 40px rgba(182,84,255,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  animation: orb-breathe 3s ease-in-out infinite;
  z-index: 1;
}
@keyframes orb-breathe {
  0%,100% { box-shadow: 0 0 40px rgba(182,84,255,0.5); }
  50%      { box-shadow: 0 0 60px rgba(182,84,255,0.8), 0 0 80px rgba(233,74,168,0.3); }
}

/* Text */
.success-title {
  font-size: 28px;
  text-align: center;
  margin-bottom: 8px;
}
.success-sub {
  font-size: 14px;
  color: rgba(255,255,255,0.55);
  text-align: center;
  line-height: 1.5;
  margin-bottom: 28px;
  padding: 0 8px;
}

/* Purchase card */
.purchase-card {
  width: 100%;
  padding: 4px 18px;
  margin-bottom: 24px;
}
.purchase-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 0;
  gap: 12px;
}
.purchase-label {
  font-size: 12px;
  color: rgba(255,255,255,0.45);
  text-transform: uppercase;
  letter-spacing: .07em;
  font-weight: 600;
}
.purchase-val {
  font-size: 14px;
  font-weight: 600;
  color: #F5ECFF;
  text-align: right;
}
.purchase-val--accent {
  font-size: 18px;
  color: #4ade80;
}
.purchase-divider {
  height: 1px;
  background: rgba(255,255,255,0.06);
}
.pending-label {
  font-size: 12px;
  color: rgba(255,200,87,0.7);
  font-weight: 500;
}
.balance-label-val {
  color: #ffc857;
  font-size: 15px;
}

/* Buttons */
.btn-primary {
  width: 100%;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
  border: none;
  cursor: pointer;
  margin-bottom: 10px;
  box-shadow: 0 8px 24px rgba(182,84,255,0.4);
}
.btn-secondary {
  width: 100%;
  padding: 14px;
  border-radius: 18px;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  color: rgba(255,255,255,0.6);
  font-size: 15px;
  font-weight: 500;
  font-family: 'Manrope', sans-serif;
  cursor: pointer;
}
</style>

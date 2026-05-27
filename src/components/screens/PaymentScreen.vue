<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- Заголовок -->
      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Пополнить баланс</div>
        <div style="width:36px"></div>
      </div>

      <!-- Текущий баланс -->
      <div class="balance-card glass">
        <div class="balance-icon">🔮</div>
        <div class="balance-info">
          <div class="balance-label">Текущий баланс</div>
          <div class="balance-value serif">
            {{ balance }} {{ balance === 1 ? 'знак' : balance < 5 ? 'знака' : 'знаков' }}
          </div>
        </div>
      </div>

      <!-- Загрузка пакетов -->
      <div v-if="isLoading" class="loading-state">
        <div class="loader-orb"></div>
        <p>Загружаем предложения...</p>
      </div>

      <!-- Список пакетов -->
      <template v-else>
        <div class="section-title">Выберите пакет</div>

        <div class="packages-list">
          <div
            v-for="product in products"
            :key="product.code"
            class="package-card haptic"
            :class="{ selected: selectedCode === product.code }"
            @click="selectedCode = product.code"
          >
            <!-- Бейдж "Выгодно" для среднего пакета -->
            <div v-if="product.code === 'pack_7'" class="popular-badge">Выгодно</div>

            <div class="package-left">
              <div class="package-count serif">{{ product.readingsCount }}</div>
              <div class="package-unit">знаков</div>
            </div>

            <div class="package-center">
              <div class="package-name">{{ product.name }}</div>
              <div class="package-per-reading">
                {{ Math.round(product.priceRub / product.readingsCount) }} ₽ за знак
              </div>
            </div>

            <div class="package-right">
              <div class="package-price-rub">{{ product.priceRub }} ₽</div>
              <div class="package-price-stars">⭐ {{ product.priceStars }}</div>
            </div>
          </div>
        </div>

        <!-- Кнопки оплаты -->
        <div v-if="selectedCode" class="payment-buttons">
          <div class="payment-hint">Выберите способ оплаты</div>

          <!-- Robokassa — рублёвый платёж с чеком для СМЗ -->
          <button
            v-if="rubProvider === 'robokassa'"
            class="pay-btn pay-btn--rub haptic"
            :disabled="isCreating"
            @click="payWithRobokassa"
          >
            <span class="pay-icon">💳</span>
            <span class="pay-label">
              <span class="pay-title">Оплатить картой</span>
              <span class="pay-sub">{{ selectedProduct?.priceRub }} ₽ · Visa, Mastercard, МИР, СБП</span>
            </span>
            <span v-if="isCreating && activeProvider === 'robokassa'" class="pay-spinner">...</span>
          </button>

          <!-- ЮKassa — рублёвый платёж -->
          <button
            v-else-if="rubProvider === 'yookassa'"
            class="pay-btn pay-btn--rub haptic"
            :disabled="isCreating"
            @click="payWithYooKassa"
          >
            <span class="pay-icon">💳</span>
            <span class="pay-label">
              <span class="pay-title">Оплатить картой</span>
              <span class="pay-sub">{{ selectedProduct?.priceRub }} ₽ · Visa, Mastercard, МИР, СБП</span>
            </span>
            <span v-if="isCreating && activeProvider === 'yookassa'" class="pay-spinner">...</span>
          </button>

          <!-- Telegram Stars -->
          <button
            class="pay-btn pay-btn--stars haptic"
            :disabled="isCreating"
            @click="payWithStars"
          >
            <span class="pay-icon">⭐</span>
            <span class="pay-label">
              <span class="pay-title">Оплатить Telegram Stars</span>
              <span class="pay-sub">{{ selectedProduct?.priceStars }} Stars · без банковской карты</span>
            </span>
            <span v-if="isCreating && activeProvider === 'stars'" class="pay-spinner">...</span>
          </button>
        </div>

      </template>

      <!-- Пояснение -->
      <div class="info-block glass">
        <div class="info-row">
          <span class="info-icon">🔁</span>
          <span>Знаки не сгорают — используйте когда удобно</span>
        </div>
        <div class="info-row">
          <span class="info-icon">✨</span>
          <span>Повторный вопрос — без списания, ответ сохранён</span>
        </div>
        <div class="info-row">
          <span class="info-icon">🔒</span>
          <span>Безопасная оплата через Robokassa и Telegram</span>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, inject } from 'vue'
import WebApp from '@twa-dev/sdk'
import { api, type PaymentProduct, type PaymentConfig } from '@/utils/api'
import { useBalance } from '@/composables/useBalance'
import { useToast } from '@/composables/useToast'

const navigate = inject<(r: string) => void>('navigate')
const { balance, refreshBalance } = useBalance()
const { addToast } = useToast()

const products        = ref<PaymentProduct[]>([])
const selectedCode    = ref<string>('')
const isLoading       = ref(true)
const isCreating      = ref(false)
const activeProvider  = ref<'robokassa' | 'yookassa' | 'stars' | null>(null)
// Какой провайдер рублёвых платежей использовать — приходит с бэка.
// По умолчанию robokassa на случай, если запрос конфига упадёт.
const rubProvider     = ref<PaymentConfig['rubProvider']>('robokassa')

const selectedProduct = computed(() =>
  products.value.find(p => p.code === selectedCode.value) ?? null
)

onMounted(async () => {
  // Загружаем продукты и конфиг параллельно
  const [productsResult, configResult] = await Promise.allSettled([
    api.getProducts(),
    api.getPaymentConfig(),
  ])

  if (productsResult.status === 'fulfilled') {
    products.value = productsResult.value.data
    if (productsResult.value.data.length > 0) {
      selectedCode.value =
        productsResult.value.data[Math.floor(productsResult.value.data.length / 2)]?.code ??
        productsResult.value.data[0].code
    }
  } else {
    addToast('Не удалось загрузить пакеты', 'error')
  }

  if (configResult.status === 'fulfilled') {
    rubProvider.value = configResult.value.data.rubProvider
  }
  // При ошибке конфига остаётся дефолтный 'robokassa' — молча продолжаем

  isLoading.value = false
})

// ── Оплата через Robokassa ───────────────────────────────────────────────────
async function payWithRobokassa() {
  if (!selectedCode.value || isCreating.value) return
  isCreating.value     = true
  activeProvider.value = 'robokassa'

  try {
    const res = await api.createRobokassaPayment({ productCode: selectedCode.value })
    WebApp.openLink(res.data.paymentUrl, { try_instant_view: false })
    addToast('Ссылка на оплату открыта. После оплаты бот вас уведомит 🔮', 'info')
    navigate?.('home')
  } catch {
    addToast('Не удалось создать платёж. Попробуйте ещё раз.')
  } finally {
    isCreating.value     = false
    activeProvider.value = null
  }
}

// ── Оплата через ЮKassa ──────────────────────────────────────────────────────
async function payWithYooKassa() {
  if (!selectedCode.value || isCreating.value) return
  isCreating.value     = true
  activeProvider.value = 'yookassa'

  try {
    const res = await api.createYooKassaPayment({ productCode: selectedCode.value })
    WebApp.openLink(res.data.paymentUrl, { try_instant_view: false })
    addToast('Ссылка на оплату открыта. После оплаты бот вас уведомит 🔮', 'info')
    navigate?.('home')
  } catch {
    addToast('Не удалось создать платёж. Попробуйте ещё раз.')
  } finally {
    isCreating.value     = false
    activeProvider.value = null
  }
}

// ── Оплата через Telegram Stars ──────────────────────────────────────────────
async function payWithStars() {
  if (!selectedCode.value || isCreating.value) return
  isCreating.value     = true
  activeProvider.value = 'stars'

  try {
    const res = await api.createStarsPayment({ productCode: selectedCode.value })
    // openInvoice открывает нативный Telegram-экран оплаты Stars.
    // status: 'paid' | 'cancelled' | 'failed' | 'pending'
    WebApp.openInvoice(res.data.paymentUrl, async (status) => {
      if (status === 'paid') {
        await refreshBalance()
        navigate?.('home')
      } else if (status === 'cancelled') {
        addToast('Оплата отменена', 'info')
      } else if (status === 'failed') {
        addToast('Ошибка оплаты. Попробуйте ещё раз.')
      }
    })
  } catch {
    addToast('Не удалось создать инвойс. Попробуйте ещё раз.')
  } finally {
    isCreating.value     = false
    activeProvider.value = null
  }
}
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  padding-bottom: calc(100px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
}
.content {
  padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px;
}

/* Header */
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.header-title { font-size: 18px; text-align: center; }

/* Balance card */
.balance-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  margin-bottom: 24px;
}
.balance-icon { font-size: 32px; }
.balance-label { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: rgba(255,255,255,.5); margin-bottom: 2px; font-weight: 600; }
.balance-value { font-size: 22px; }

/* Section title */
.section-title {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: rgba(255,255,255,.45);
  font-weight: 600;
  margin-bottom: 12px;
}

/* Package cards */
.packages-list { display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px; }

.package-card {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 18px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
}
.package-card.selected {
  background: linear-gradient(135deg, rgba(182,84,255,0.18), rgba(233,74,168,0.1));
  border-color: rgba(182,84,255,0.5);
}

.popular-badge {
  position: absolute;
  top: 10px; right: 10px;
  padding: 2px 8px;
  background: linear-gradient(135deg, #ffc857, #e9914a);
  color: #1a0529;
  border-radius: 6px;
  font-size: 9px;
  font-weight: 800;
  letter-spacing: .05em;
}

.package-left { text-align: center; width: 48px; flex-shrink: 0; }
.package-count { font-size: 32px; line-height: 1; }
.package-unit { font-size: 10px; color: rgba(255,255,255,.5); margin-top: 2px; }

.package-center { flex: 1; }
.package-name { font-size: 15px; font-weight: 600; margin-bottom: 3px; }
.package-per-reading { font-size: 11px; color: rgba(255,255,255,.45); }

.package-right { text-align: right; flex-shrink: 0; }
.package-price-rub { font-size: 16px; font-weight: 700; color: #ffc857; }
.package-price-stars { font-size: 12px; color: rgba(255,255,255,.5); margin-top: 2px; }

/* Payment buttons */
.payment-buttons { display: flex; flex-direction: column; gap: 10px; margin-bottom: 16px; }
.payment-hint {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: .1em;
  color: rgba(255,255,255,.45);
  font-weight: 600;
  margin-bottom: 4px;
}

.pay-btn {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  border-radius: 18px;
  border: none;
  cursor: pointer;
  font-family: 'Manrope', sans-serif;
  text-align: left;
  transition: opacity 0.2s;
}
.pay-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.pay-btn--rub {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
}
.pay-btn--stars {
  background: linear-gradient(135deg, rgba(255,200,87,0.15), rgba(255,160,50,0.1));
  border: 1px solid rgba(255,200,87,0.35) !important;
  color: #F5ECFF;
}

.pay-icon { font-size: 24px; flex-shrink: 0; }
.pay-label { display: flex; flex-direction: column; flex: 1; }
.pay-title { font-size: 15px; font-weight: 600; }
.pay-sub { font-size: 12px; opacity: 0.7; margin-top: 2px; }
.pay-spinner { font-size: 18px; animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Status banners */
.pending-banner, .success-banner {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  border-radius: 16px;
  margin-bottom: 16px;
}
.pending-banner {
  background: linear-gradient(135deg, rgba(255,200,87,0.1), rgba(255,160,50,0.07));
  border: 1px solid rgba(255,200,87,0.3);
}
.success-banner {
  background: linear-gradient(135deg, rgba(112,224,168,0.12), rgba(71,184,150,0.07));
  border: 1px solid rgba(112,224,168,0.35);
}
.pending-icon, .success-icon { font-size: 28px; flex-shrink: 0; }
.pending-title, .success-title { font-size: 14px; font-weight: 700; margin-bottom: 3px; }
.pending-sub, .success-sub { font-size: 12px; opacity: 0.65; }

/* Info block */
.info-block {
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 8px;
}
.info-row { display: flex; align-items: flex-start; gap: 10px; font-size: 13px; color: rgba(255,255,255,.65); line-height: 1.4; }
.info-icon { font-size: 16px; flex-shrink: 0; }

/* Loading */
.loading-state { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 60px 0; }
.loader-orb {
  width: 48px; height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity:.6; transform: scale(1); } 50% { opacity:1; transform: scale(1.1); } }
.loading-state p { font-size: 14px; color: rgba(255,255,255,.45); margin: 0; }

/* Transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.4s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>

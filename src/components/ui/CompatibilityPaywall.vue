<template>
  <div class="cp-overlay">
    <div class="cp-lock">🔒</div>
    <div class="cp-title serif">Полный анализ</div>
    <div class="cp-sub">Интерпретация и разбор по 5 категориям</div>

    <!--
      Запись нельзя разблокировать здесь (нет id расклада — старая запись в истории).
      Экран сам решает, куда вести пользователя.
    -->
    <slot v-if="disabled" name="fallback" />

    <PaywallActions
      v-else
      :cost="cost"
      :balance="balance"
      :quota-remaining="quotaRemaining"
      :is-dev="isDev"
      :loading="loading"
      icon="🔮"
      buy-label="Купить гадания →"
      layout="inline"
      @pay="(mode) => emit('pay', mode)"
      @buy="emit('buy')"
    />
  </div>
</template>

<script setup lang="ts">
import type { SpendMode } from '@/utils/api'
import PaywallActions from '@/components/ui/PaywallActions.vue'

/**
 * Пейвол полного анализа совместимости.
 *
 * Используется в двух местах: на самом экране совместимости (CompatibilityScreen)
 * и в модалке записи из истории (CardDiaryScreen). Раньше это были две независимые
 * копии вёрстки, которые разошлись: в истории цена была захардкожена «1 знак»
 * при реальной цене 3, оплата квотой была недоступна, а гейт кнопки проверял
 * «баланс > 0» вместо «баланса хватает на цену».
 */
withDefaults(defineProps<{
  cost: number
  balance: number | null
  quotaRemaining?: number
  isDev?: boolean
  loading?: boolean
  /** true — оплата отсюда невозможна, рендерим слот fallback */
  disabled?: boolean
}>(), {
  quotaRemaining: 0,
  isDev: false,
  loading: false,
  disabled: false,
})

const emit = defineEmits<{
  pay: [mode: SpendMode]
  buy: []
}>()
</script>

<style scoped>
.cp-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(10,5,20,0.55);
  backdrop-filter: blur(2px);
  border-radius: 18px;
  padding: 24px 20px;
}
.cp-lock { font-size: 32px; margin-bottom: 4px; }
.cp-title { font-size: 20px; color: #F5ECFF; text-align: center; }
.cp-sub {
  font-size: 13px;
  color: rgba(255,255,255,.55);
  text-align: center;
  line-height: 1.5;
  margin-bottom: 8px;
}
</style>

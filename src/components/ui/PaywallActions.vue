<template>
  <div class="pa-root" :class="[`pa-root--${layout}`, `pa-root--${shape}`]">
    <!-- ── DEV: списание эмулируется, платёжные ветки не показываем ────────── -->
    <template v-if="isDev">
      <button class="pa-btn pa-btn--credits haptic" :disabled="loading || disabled" @click="emit('pay', 'CREDITS')">
        <span v-if="loading" class="pa-spinner"></span>
        <span v-else>{{ icon }} {{ creditsLabel }}</span>
      </button>
      <div class="pa-dev-hint">DEV: кнопка эмулирует списание</div>
    </template>

    <!-- ── Знаков хватает: основная кнопка + (если есть квота) вторая ──────── -->
    <template v-else-if="enoughCredits">
      <button class="pa-btn pa-btn--credits haptic" :disabled="loading || disabled" @click="emit('pay', 'CREDITS')">
        <span v-if="loading" class="pa-spinner"></span>
        <span v-else>{{ icon }} {{ creditsLabel }}</span>
      </button>
      <!--
        Вторая кнопка — альтернативный способ оплаты. Раньше здесь была подсказка
        текстом 11px на 60% прозрачности, которую пользователи не замечали и
        тратили знаки, имея неиспользованную квоту подписки.
      -->
      <button
        v-if="hasQuota"
        class="pa-btn pa-btn--quota haptic"
        :disabled="loading || disabled"
        @click="emit('pay', 'QUOTA')"
      >
        ✦ {{ quotaLabel }} · осталось {{ quotaRemaining }}
      </button>
    </template>

    <!-- ── Знаков не хватает, но есть квота: оплата только подпиской ───────── -->
    <template v-else-if="hasQuota">
      <button class="pa-btn pa-btn--quota-solo haptic" :disabled="loading || disabled" @click="emit('pay', 'QUOTA')">
        <span v-if="loading" class="pa-spinner"></span>
        <span v-else>✦ {{ quotaLabel }} · осталось {{ quotaRemaining }}</span>
      </button>
    </template>

    <!-- ── Ни знаков, ни квоты: ведём на пополнение ────────────────────────── -->
    <button v-else-if="showBuyBranch" class="pa-btn pa-btn--buy haptic" :disabled="disabled" @click="emit('buy')">
      {{ buyLabel }}
    </button>

    <!--
      showBuyBranch=false — уводить со страницы нельзя (потеряются введённые данные).
      Оставляем обычную кнопку: resolveSpendMode покажет модалку «не хватает знаков»
      с предложением подписок, не разрушая заполненную форму.
    -->
    <button v-else class="pa-btn pa-btn--credits haptic" :disabled="loading || disabled" @click="emit('pay', 'CREDITS')">
      <span v-if="loading" class="pa-spinner"></span>
      <span v-else>{{ icon }} {{ creditsLabel }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { SpendMode } from '@/utils/api'
import { znakiWord } from '@/utils/plural'

/**
 * Универсальный блок кнопок оплаты платной функции.
 *
 * Зачем компонент: раньше эта логика была скопирована в пяти местах
 * (CompatibilityScreen, модалка истории в CardDiaryScreen, Week/Month/YearSpreadScreen)
 * и копии разъехались — в истории, например, цена была захардкожена «1 знак»,
 * хотя бэкенд списывал 3. Теперь ветвление живёт в одном месте.
 *
 * Ключевое отличие от прежнего UI: способ оплаты выбирается ДО нажатия — отдельной
 * кнопкой, а не в модалке после. Поэтому наружу эмитится уже конкретный SpendMode,
 * который экран передаёт в resolveSpendMode(feature, preferred).
 */
const props = withDefaults(defineProps<{
  /** Цена в знаках (приходит с бэка через useFeatureCosts) */
  cost: number
  /** Текущий баланс знаков; null — ещё не загружен */
  balance: number | null
  /** Остаток квоты подписки по этой фиче (0 — квоты нет) */
  quotaRemaining?: number
  /** DEV-режим: списание эмулируется, показываем одну кнопку */
  isDev?: boolean
  /** Идёт запрос — блокируем кнопки и показываем спиннер */
  loading?: boolean
  /** Эмодзи перед текстом основной кнопки (🔮 / 🌙 / ⭐) */
  icon?: string
  /** Глагол основной кнопки: «Открыть», «Оплатить» и т.п. */
  verb?: string
  /** Текст кнопки оплаты квотой */
  quotaLabel?: string
  /** Текст кнопки перехода к покупке */
  buyLabel?: string
  /** block — кнопки на всю ширину (экраны раскладов), inline — по содержимому (пейвол поверх блюра) */
  layout?: 'block' | 'inline'
  /** Форма кнопок: rounded — 16px (пейволы), pill — скруглённая (форма сонника) */
  shape?: 'rounded' | 'pill'
  /** Внешний гейт: форма не заполнена и т.п. Блокирует все кнопки, не меняя ветку */
  disabled?: boolean
  /**
   * Показывать ли ветку «Купить знаки →», когда нет ни знаков, ни квоты.
   * false — вместо неё остаётся обычная кнопка оплаты знаками: клик откроет
   * модалку «не хватает знаков» с подписками. Нужно там, где уход на экран
   * оплаты потерял бы введённые данные (сонник — набранный текст сна).
   */
  showBuyBranch?: boolean
}>(), {
  quotaRemaining: 0,
  isDev: false,
  loading: false,
  icon: '🔮',
  verb: 'Открыть',
  quotaLabel: 'Открыть по подписке',
  buyLabel: 'Купить знаки →',
  layout: 'block',
  shape: 'rounded',
  disabled: false,
  showBuyBranch: true,
})

const emit = defineEmits<{
  pay: [mode: SpendMode]
  buy: []
}>()

// Баланс может быть null, пока не загрузился — считаем как 0, чтобы не показать
// кнопку списания знаков раньше времени.
const enoughCredits = computed(() => (props.balance ?? 0) >= props.cost)
const hasQuota = computed(() => props.quotaRemaining > 0)
const creditsLabel = computed(() => `${props.verb} за ${props.cost} ${znakiWord(props.cost)}`)
</script>

<style scoped>
.pa-root {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: 100%;
}

.pa-btn {
  font-family: 'Manrope', sans-serif;
  font-size: 15px;
  font-weight: 600;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: opacity .15s ease, transform .1s ease;
}
.pa-btn:disabled { opacity: .6; cursor: not-allowed; }
.pa-btn:active:not(:disabled) { transform: scale(.985); }

/* block — кнопки во всю ширину карточки (экраны недели/месяца/года) */
.pa-root--block .pa-btn { width: 100%; padding: 15px; border-radius: 16px; }
/* inline — компактные кнопки поверх заблюренного превью (совместимость) */
.pa-root--inline .pa-btn { padding: 13px 28px; }
/* pill — скруглённая форма CTA сонника */
.pa-root--pill .pa-btn { border-radius: 100px; padding: 16px; }
.pa-root--pill .pa-btn--quota { padding: 14px; }

/* Основная кнопка — оплата знаками */
.pa-btn--credits {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  box-shadow: 0 8px 24px rgba(182,84,255,.4);
}

/*
  Кнопка оплаты квотой. Контурная золотая — заметна, но не спорит с основной
  кнопкой за внимание. Размер шрифта 13.5px против прежних 11px у подсказки.
*/
.pa-btn--quota {
  background: rgba(255,200,87,.08);
  border: 1px solid rgba(255,200,87,.45);
  color: #ffc857;
  font-size: 13.5px;
  box-shadow: none;
}
.pa-root--block .pa-btn--quota { padding: 12px; }
.pa-root--inline .pa-btn--quota { padding: 11px 22px; }

/* Знаков не хватает — квота единственный способ, поэтому кнопка основная по весу */
.pa-btn--quota-solo {
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  box-shadow: 0 8px 24px rgba(182,84,255,.4);
}

.pa-btn--buy {
  background: linear-gradient(135deg, rgba(255,200,87,0.2), rgba(233,74,168,0.15));
  border: 1px solid rgba(255,200,87,0.4);
  color: #ffc857;
  box-shadow: none;
}

.pa-dev-hint {
  font-size: 10px;
  color: rgba(112,224,168,.7);
  letter-spacing: .04em;
}

.pa-spinner {
  width: 16px; height: 16px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,.3);
  border-top-color: #fff;
  animation: pa-spin .8s linear infinite;
}
@keyframes pa-spin { to { transform: rotate(360deg); } }
</style>

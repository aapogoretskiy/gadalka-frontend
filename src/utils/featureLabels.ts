import type { FeatureType, QuotaPeriod } from '@/utils/api'

/**
 * Русские названия платных функций — используются в карточках подписок,
 * блоке «Моя подписка» и модалках списания. Единый словарь, чтобы
 * названия не расходились между экранами.
 */
export const FEATURE_LABELS: Record<FeatureType, string> = {
  THREE_CARD:          'Расклад «3 карты»',
  HORSESHOE:           'Расклад «Подкова»',
  CELTIC_CROSS:        'Расклад «Кельтский крест»',
  COMPATIBILITY:       'Совместимость',
  DREAM:               'Разбор сна',
  NUMEROLOGY_WEEK:     'Нумерология недели',
  NUMEROLOGY_MONTH:    'Нумерология месяца',
  NUMEROLOGY_YEAR:     'Нумерология года',
  // Бесплатные фичи — в квотах подписок не участвуют, но словарь полный
  DAILY_CARD:          'Карта дня',
  NUMEROLOGY_DAY:      'Нумерология дня',
  DAILY_HOROSCOPE:     'Гороскоп дня',
}

export const FEATURE_EMOJI: Record<FeatureType, string> = {
  THREE_CARD:          '🔮',
  HORSESHOE:           '🧿',
  CELTIC_CROSS:        '✨',
  COMPATIBILITY:       '💞',
  DREAM:               '🌙',
  NUMEROLOGY_WEEK:     '🔢',
  NUMEROLOGY_MONTH:    '📅',
  NUMEROLOGY_YEAR:     '🗓',
  DAILY_CARD:          '🃏',
  NUMEROLOGY_DAY:      '☀️',
  DAILY_HOROSCOPE:     '♈️',
}

/** «в день» / «на весь срок» — подпись периодичности квоты */
export function quotaPeriodLabel(period: QuotaPeriod): string {
  return period === 'DAILY' ? 'в день' : 'на весь срок'
}

export function featureLabel(feature: FeatureType): string {
  return FEATURE_LABELS[feature] ?? feature
}

export function featureEmoji(feature: FeatureType): string {
  return FEATURE_EMOJI[feature] ?? '✨'
}

// Статическая мапа: отображаемое имя знака зодиака (как отдаёт бэк, поле zodiacSign
// в DailyHoroscopeResponse) -> юникодный астрологический глиф.
// Это чисто визуальная деталь интерфейса, поэтому держим её на фронте,
// а не добавляем отдельное поле в бэковый DTO.
const ZODIAC_GLYPHS: Record<string, string> = {
  'Овен':     '♈',
  'Телец':    '♉',
  'Близнецы': '♊',
  'Рак':      '♋',
  'Лев':      '♌',
  'Дева':     '♍',
  'Весы':     '♎',
  'Скорпион': '♏',
  'Стрелец':  '♐',
  'Козерог':  '♑',
  'Водолей':  '♒',
  'Рыбы':     '♓',
}

export function zodiacGlyph(displayName: string | undefined | null): string {
  if (!displayName) return '✦'
  return ZODIAC_GLYPHS[displayName] ?? '✦'
}

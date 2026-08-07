/**
 * Русские склонения числительных.
 *
 * Зачем отдельный файл: функция склонения «знак/знака/знаков» была продублирована
 * в PeriodPurchaseModal.vue, SpendConfirmModal.vue и ещё дважды в виде инлайн-тернарников
 * в FortuneScreen.vue. Тернарники вида `n === 1 ? 'знак' : n < 5 ? 'знака' : 'знаков'`
 * к тому же неверны начиная с 21: дают «21 знаков» вместо «21 знак» и «22 знаков»
 * вместо «22 знака». Цены задаются админом в БД и могут быть любыми, поэтому нужна
 * корректная общая реализация.
 */

/**
 * Универсальное склонение по числу.
 * @param n     число
 * @param one   форма для 1, 21, 31... («знак»)
 * @param few   форма для 2-4, 22-24... («знака»)
 * @param many  форма для 0, 5-20, 25-30... («знаков»)
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n)
  const mod10 = abs % 10
  const mod100 = abs % 100
  // 11-14 — всегда форма many, несмотря на последнюю цифру
  if (mod100 >= 11 && mod100 <= 14) return many
  if (mod10 === 1) return one
  if (mod10 >= 2 && mod10 <= 4) return few
  return many
}

/** «знак / знака / знаков» — внутренняя валюта приложения */
export function znakiWord(n: number): string {
  return plural(n, 'знак', 'знака', 'знаков')
}

/** «1 знак», «3 знака», «11 знаков» — число вместе со словом */
export function znaki(n: number): string {
  return `${n} ${znakiWord(n)}`
}

/** «гадание / гадания / гаданий» — единица квоты подписки */
export function gadaniyaWord(n: number): string {
  return plural(n, 'гадание', 'гадания', 'гаданий')
}

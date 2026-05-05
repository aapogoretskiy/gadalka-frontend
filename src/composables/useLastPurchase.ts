import { ref } from 'vue'

export interface PurchaseResult {
  productName: string
  readingsCount: number
  provider: 'yookassa' | 'stars'
  isPending: boolean // true для ЮKassa — webhook ещё не пришёл
  newBalance: number
}

const lastPurchase = ref<PurchaseResult | null>(null)

export function useLastPurchase() {
  const setPurchase = (p: PurchaseResult) => { lastPurchase.value = p }
  const clearPurchase = () => { lastPurchase.value = null }
  return { lastPurchase, setPurchase, clearPurchase }
}

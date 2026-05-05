import { ref, computed } from 'vue'
import { api } from '@/utils/api'

// Синглтон — баланс един для всего приложения
const balance = ref(0)

export function useBalance() {
  const hasCredits = computed(() => balance.value > 0)

  const setBalance = (value: number) => {
    balance.value = value
  }

  // Подтягивает актуальный баланс с сервера (вызывать после оплаты)
  const refreshBalance = async () => {
    try {
      const res = await api.getBalance()
      balance.value = res.data.balance
    } catch {
      // Молча игнорируем — баланс останется прежним
    }
  }

  return { balance, hasCredits, setBalance, refreshBalance }
}

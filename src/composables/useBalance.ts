import { ref, computed } from 'vue'
import { api } from '@/utils/api'

// Синглтон — баланс един для всего приложения
const balance = ref(0)
// Есть ли у пользователя активная подписка (обновляется вместе с балансом)
const hasActiveSubscription = ref(false)
// Доступна ли покупка подписок: пока фича в закрытом тесте — true только у админов.
// Управляет вкладкой «Подписки» на PaymentScreen (задизейблена для остальных).
const subscriptionsAvailable = ref(false)

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
      hasActiveSubscription.value = res.data.hasActiveSubscription
      subscriptionsAvailable.value = res.data.subscriptionsAvailable
    } catch {
      // Молча игнорируем — баланс останется прежним
    }
  }

  return { balance, hasCredits, hasActiveSubscription, subscriptionsAvailable, setBalance, refreshBalance }
}

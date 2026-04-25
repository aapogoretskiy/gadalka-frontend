import { ref } from 'vue'

const fortuneUsed = ref(localStorage.getItem('fortuneUsed') === 'true')

export function useFortuneState() {
  const markFortuneUsed = () => {
    fortuneUsed.value = true
    localStorage.setItem('fortuneUsed', 'true')
  }
  return { fortuneUsed, markFortuneUsed }
}

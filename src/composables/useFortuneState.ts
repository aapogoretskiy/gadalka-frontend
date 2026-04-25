import { ref } from 'vue'

const fortuneUsed = ref(false)

export function useFortuneState() {
  const setFortuneUsed = (value: boolean) => {
    fortuneUsed.value = value
  }
  return { fortuneUsed, setFortuneUsed }
}

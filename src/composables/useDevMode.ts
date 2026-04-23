import { ref } from 'vue'

// Singleton — состояние разделяется между всеми компонентами
const devMode = ref(
  import.meta.env.DEV || localStorage.getItem('devMode') === 'true'
)

export function useDevMode() {
  const toggleDevMode = () => {
    devMode.value = !devMode.value
    localStorage.setItem('devMode', String(devMode.value))
  }

  return { isDev: devMode, toggleDevMode }
}

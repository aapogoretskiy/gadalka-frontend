import { ref, computed } from 'vue'
import { api, type TelegramUserDto, type ProfileResponse, type CreateProfileRequest, type UpdateProfileRequest } from '@/utils/api'
import WebApp from '@twa-dev/sdk'

// Состояние живёт вне функции — это синглтон, общий для всего приложения
// (аналог статического поля в Java)
const telegramUser = ref<TelegramUserDto | null>(null)
const profile = ref<ProfileResponse | null>(null)
const isAuthLoading = ref(false)

export function useUser() {
  const isAuthenticated = computed(() => !!localStorage.getItem('jwt_token'))
  const hasProfile = computed(() => profile.value !== null)

  // Шаг 1: авторизация через Telegram initData → получаем JWT
  const authWithTelegram = async (): Promise<boolean> => {
    // В реальном Telegram Mini App WebApp.initData заполнен автоматически.
    // При локальной разработке — берём мок из .env.development
    const initData = WebApp.initData || import.meta.env.VITE_MOCK_INIT_DATA

    if (!initData) {
      console.warn('[useUser] Telegram initData недоступен и VITE_MOCK_INIT_DATA не задан')
      return false
    }

    isAuthLoading.value = true
    try {
      const response = await api.authTelegram(initData)
      const { user, jwtToken } = response.data

      // Сохраняем токен в localStorage — он будет автоматически добавляться
      // к каждому запросу через axios interceptor в api.ts
      localStorage.setItem('jwt_token', jwtToken)
      telegramUser.value = user
      return true
    } catch {
      return false
    } finally {
      isAuthLoading.value = false
    }
  }

  // Шаг 2: загрузить профиль пользователя (если он уже создан)
  const fetchProfile = async (): Promise<ProfileResponse | null> => {
    try {
      const response = await api.getProfile()
      profile.value = response.data
      return response.data
    } catch (err: any) {
      // 404 = профиль ещё не создан, это нормально → нужен онбординг
      if (err.response?.status === 404) {
        profile.value = null
        return null
      }
      throw err
    }
  }

  // Шаг 3 (онбординг): создать профиль
  const createProfile = async (data: CreateProfileRequest): Promise<ProfileResponse> => {
    const response = await api.createProfile(data)
    profile.value = response.data
    return response.data
  }

  // Обновить данные профиля
  const updateProfile = async (data: UpdateProfileRequest): Promise<ProfileResponse> => {
    const response = await api.updateProfile(data)
    profile.value = response.data
    return response.data
  }

  // Сбросить профиль: удаляем данные рождения/целей, остаёмся авторизованными
  const resetProfile = async (): Promise<void> => {
    await api.deleteProfile()
    profile.value = null
  }

  // Выход: удаляем токен
  const logout = () => {
    localStorage.removeItem('jwt_token')
    telegramUser.value = null
    profile.value = null
  }

  return {
    telegramUser,
    profile,
    isAuthLoading,
    isAuthenticated,
    hasProfile,
    authWithTelegram,
    fetchProfile,
    createProfile,
    updateProfile,
    resetProfile,
    logout,
  }
}

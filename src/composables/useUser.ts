import { ref, computed } from 'vue'
import { api, type TelegramUserDto, type ProfileResponse, type CreateProfileRequest, type UpdateProfileRequest } from '@/utils/api'
import WebApp from '@twa-dev/sdk'
import { useBalance } from '@/composables/useBalance'

// Состояние живёт вне функции — это синглтон, общий для всего приложения
// (аналог статического поля в Java)
const telegramUser = ref<TelegramUserDto | null>(null)
const profile = ref<ProfileResponse | null>(null)
const isAuthLoading = ref(false)
// Принял ли пользователь оферту/ПК — приходит из auth-ответа.
// OnboardingScreen использует это, чтобы решить: показывать welcome-путь целиком
// или сразу форму профиля (для тех, кто пришёл донастроить профиль позже).
const termsAccepted = ref(false)

export function useUser() {
  const { setBalance } = useBalance()
  const isAuthenticated = computed(() => !!localStorage.getItem('jwt_token'))
  const hasProfile = computed(() => profile.value !== null)

  // Шаг 1: авторизация через Telegram initData → получаем JWT
  //
  // ВАЖНО: раньше эта функция была объявлена как Promise<boolean>, но при успехе
  // фактически возвращала объект { isNewUser } — TypeScript на это ругался
  // (return type mismatch), но рантайм это не проверяет, поэтому баг был незаметен:
  // { isNewUser: false } — это truthy-объект, так что вызывающий код "случайно"
  // работал через if (authed) / if (!ok). Явный { ok, isNewUser } — без скрытой лжи в типах.
  const authWithTelegram = async (): Promise<{ ok: boolean; isNewUser: boolean }> => {
    // В реальном Telegram Mini App WebApp.initData заполнен автоматически.
    // При локальной разработке — берём мок из .env.development
    const initData = WebApp.initData || import.meta.env.VITE_MOCK_INIT_DATA

    if (!initData) {
      console.warn('[useUser] Telegram initData недоступен и VITE_MOCK_INIT_DATA не задан')
      return { ok: false, isNewUser: false }
    }

    isAuthLoading.value = true
    try {
      const response = await api.authTelegram(initData)
      const { user, jwtToken, readingBalance, isNewUser, termsAccepted: accepted } = response.data

      // Сохраняем токен в localStorage — он будет автоматически добавляться
      // к каждому запросу через axios interceptor в api.ts
      localStorage.setItem('jwt_token', jwtToken)
      telegramUser.value = user
      setBalance(readingBalance)
      termsAccepted.value = !!accepted
      return { ok: true, isNewUser }
    } catch (err) {
      // Раньше ошибка тут проглатывалась молча — вызывающий код не мог отличить
      // "нет сети/бэк недоступен" от любого другого случая. Логируем явно, чтобы
      // при повторении бага это было видно хотя бы в консоли (см. ?eruda=1).
      console.error('[useUser] Ошибка авторизации через Telegram:', err)
      return { ok: false, isNewUser: false }
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
    termsAccepted,
    authWithTelegram,
    fetchProfile,
    createProfile,
    updateProfile,
    resetProfile,
    logout,
  }
}

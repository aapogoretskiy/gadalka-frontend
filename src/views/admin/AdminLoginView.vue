<template>
  <div class="admin-login">
    <div class="login-card">
      <div class="login-header">
        <div class="login-icon">🔐</div>
        <h1>Админ-панель</h1>
        <p>Войдите через Telegram для доступа</p>
      </div>

      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Telegram Login Widget рендерится здесь через JS в onMounted -->
      <div ref="widgetContainer" class="widget-container" />

      <p class="hint">Доступ только для авторизованных администраторов</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi, type TelegramWidgetUser } from '@/utils/adminApi'

const router = useRouter()
const widgetContainer = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)

onMounted(() => {
  // Telegram Login Widget работает через глобальный JS-callback.
  // Виджет сам вызовет эту функцию после того как пользователь подтвердит вход.
  (window as any).onTelegramAuth = async (user: TelegramWidgetUser) => {
    error.value = null
    try {
      await adminApi.login(user)
      router.push({ name: 'admin-dashboard' })
    } catch (e: any) {
      const msg = e.response?.data?.message
      if (e.response?.status === 403) {
        error.value = 'У вас нет доступа к админ-панели'
      } else {
        error.value = msg || 'Ошибка авторизации. Попробуйте ещё раз.'
      }
    }
  }

  // Динамически вставляем скрипт Telegram Widget.
  // data-telegram-login — username бота (без @).
  // data-onauth — имя глобальной функции-коллбека.
  const script = document.createElement('script')
  script.src = 'https://telegram.org/js/telegram-widget.js?22'
  script.setAttribute('data-telegram-login', 'magicliora_bot')
  script.setAttribute('data-size', 'large')
  script.setAttribute('data-onauth', 'onTelegramAuth(user)')
  script.setAttribute('data-request-access', 'write')
  script.async = true
  widgetContainer.value?.appendChild(script)
})
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  background: #0f172a;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.login-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 12px;
  padding: 40px 32px;
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.login-header {
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.login-icon {
  font-size: 40px;
  line-height: 1;
}

h1 {
  font-size: 20px;
  font-weight: 600;
  color: #f1f5f9;
  margin: 0;
}

p {
  font-size: 14px;
  color: #94a3b8;
  margin: 0;
}

.error-message {
  width: 100%;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
  text-align: center;
}

.widget-container {
  display: flex;
  justify-content: center;
  min-height: 48px;
}

.hint {
  font-size: 12px;
  color: #475569;
  text-align: center;
}
</style>

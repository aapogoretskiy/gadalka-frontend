<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <!-- Success state -->
      <div v-if="submitted" class="success-state">
        <div class="success-icon">✉️</div>
        <div class="success-title serif">Заявка принята!</div>
        <div class="success-desc">
          Мы рассмотрим ваше обращение и постараемся помочь.
          Если потребуется, ответим в Telegram-боте.
        </div>
        <button class="submit-btn haptic" @click="navigate?.('profile')">
          Вернуться в профиль
        </button>
      </div>

      <!-- Form state -->
      <template v-else>
        <div class="page-header">
          <div class="page-icon">💬</div>
          <div class="page-title serif">Обратная связь</div>
          <div class="page-desc">
            Расскажите о проблеме или оставьте пожелание — мы читаем каждое обращение
          </div>
        </div>

        <div class="form-card glass">
          <label class="field-label">Опишите проблему или пожелание</label>
          <textarea
            v-model="description"
            class="feedback-textarea"
            placeholder="Например: не загружается карта дня, вылетает приложение, хочу предложить новую функцию..."
            :maxlength="MAX_LENGTH"
            rows="7"
            @input="onInput"
          />
          <div class="char-count" :class="{ 'char-count--warn': description.length > MAX_LENGTH * 0.85 }">
            {{ description.length }} / {{ MAX_LENGTH }}
          </div>
        </div>

        <div v-if="errorMsg" class="error-msg">{{ errorMsg }}</div>

        <button
          class="submit-btn haptic"
          :disabled="!canSubmit || isSubmitting"
          @click="submit"
        >
          {{ isSubmitting ? 'Отправляем...' : 'Отправить' }}
        </button>

        <div class="hint-text">
          Вы можете иметь не более 3 открытых обращений одновременно
        </div>
      </template>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'
import { api } from '@/utils/api'

const navigate = inject<(r: string) => void>('navigate')

const MAX_LENGTH = 2000
const MIN_LENGTH = 10

const description  = ref('')
const isSubmitting = ref(false)
const submitted    = ref(false)
const errorMsg     = ref('')

const canSubmit = computed(() =>
  description.value.trim().length >= MIN_LENGTH &&
  description.value.length <= MAX_LENGTH
)

function onInput() {
  // Сбрасываем ошибку при редактировании
  if (errorMsg.value) errorMsg.value = ''
}

async function submit() {
  if (!canSubmit.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMsg.value = ''

  try {
    await api.submitFeedback(description.value.trim())
    submitted.value = true
  } catch (err: any) {
    const msg: string = err?.response?.data?.message || 'Не удалось отправить обращение. Попробуйте позже.'
    errorMsg.value = msg
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
}
.content {
  padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Header */
.page-header {
  text-align: center;
  padding: 16px 0 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.page-icon  { font-size: 48px; }
.page-title { font-size: 24px; }
.page-desc  {
  font-size: 13px;
  line-height: 1.6;
  color: rgba(255,255,255,.5);
  max-width: 280px;
}

/* Form card */
.form-card {
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.field-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: .08em;
  color: rgba(255,255,255,.6);
}
.feedback-textarea {
  width: 100%;
  box-sizing: border-box;
  background: rgba(255,255,255,.06);
  border: 1px solid rgba(255,255,255,.1);
  border-radius: 14px;
  color: #F5ECFF;
  font-size: 15px;
  font-family: 'Manrope', sans-serif;
  line-height: 1.6;
  padding: 13px 15px;
  outline: none;
  resize: none;
  transition: border-color .2s;
}
.feedback-textarea:focus  { border-color: rgba(182,84,255,.5); }
.feedback-textarea::placeholder { color: rgba(255,255,255,.3); }
.char-count {
  font-size: 11px;
  color: rgba(255,255,255,.35);
  text-align: right;
  transition: color .2s;
}
.char-count--warn { color: #ffc857; }

/* Error */
.error-msg {
  font-size: 13px;
  color: rgba(255,120,120,.85);
  background: rgba(255,80,80,.08);
  border: 1px solid rgba(255,80,80,.2);
  border-radius: 12px;
  padding: 12px 15px;
  line-height: 1.5;
}

/* Submit */
.submit-btn {
  width: 100%;
  padding: 15px;
  border-radius: 16px;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: 'Manrope', sans-serif;
  border: none;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(182,84,255,.4);
  transition: opacity .2s;
}
.submit-btn:disabled { opacity: .4; cursor: not-allowed; }

/* Hint */
.hint-text {
  font-size: 12px;
  color: rgba(255,255,255,.3);
  text-align: center;
  line-height: 1.5;
}

/* Success */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 48px 0 24px;
  text-align: center;
}
.success-icon  { font-size: 64px; }
.success-title { font-size: 26px; }
.success-desc  {
  font-size: 14px;
  line-height: 1.65;
  color: rgba(255,255,255,.6);
  max-width: 280px;
}
</style>

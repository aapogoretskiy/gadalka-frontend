<template>
  <Transition name="feedback-fade">
    <div v-if="visible" class="feedback-widget glass">

      <!-- ── Состояние: ожидание ────────────────────────────────── -->
      <template v-if="state === 'idle'">
        <div class="fw-label">Был ли ответ полезен?</div>
        <div class="fw-btns">
          <button class="fw-btn fw-btn--pos haptic" @click="handlePositive">👍</button>
          <button class="fw-btn fw-btn--neg haptic" @click="handleNegative">👎</button>
        </div>
      </template>

      <!-- ── Состояние: ввод комментария ───────────────────────── -->
      <template v-else-if="state === 'comment'">
        <div class="fw-label">Что не понравилось?</div>
        <textarea
          v-model="comment"
          class="fw-textarea"
          placeholder="Необязательно — напишите, что можно улучшить"
          maxlength="300"
          rows="3"
        ></textarea>
        <div class="fw-comment-btns">
          <button class="fw-send haptic" :disabled="sending" @click="sendNegative">
            {{ sending ? '...' : 'Отправить' }}
          </button>
          <button class="fw-skip haptic" :disabled="sending" @click="skipComment">
            Пропустить
          </button>
        </div>
      </template>

      <!-- ── Состояние: отправлено ─────────────────────────────── -->
      <template v-else>
        <div class="fw-thanks">✨ Спасибо за оценку!</div>
      </template>

    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { api } from '@/utils/api'

const props = defineProps<{
  /** Тип платного действия */
  actionType: 'FORTUNE' | 'COMPATIBILITY'
  /** ID записи — виджет не показывается пока undefined/null */
  actionId: number | null | undefined
}>()

type State = 'idle' | 'comment' | 'sent'

const state   = ref<State>('idle')
const comment = ref('')
const sending = ref(false)
const visible = ref(true)

// Если actionId меняется (новый результат) — сбрасываем виджет
watch(() => props.actionId, () => {
  state.value   = 'idle'
  comment.value = ''
  sending.value = false
  visible.value = true
})

function handlePositive() {
  submit('POSITIVE', undefined)
}

function handleNegative() {
  state.value = 'comment'
}

async function sendNegative() {
  await submit('NEGATIVE', comment.value || undefined)
}

async function skipComment() {
  await submit('NEGATIVE', undefined)
}

async function submit(rating: 'POSITIVE' | 'NEGATIVE', text: string | undefined) {
  if (!props.actionId) return
  sending.value = true
  try {
    await api.submitActionFeedback(props.actionType, props.actionId, rating, text)
  } catch {
    // Ошибка не критична — виджет ненавязчивый, молча скрываемся
  } finally {
    sending.value = false
    state.value = 'sent'
    // Через 3 секунды виджет исчезает
    setTimeout(() => { visible.value = false }, 3000)
  }
}
</script>

<style scoped>
.feedback-widget {
  margin: 16px 0;
  padding: 14px 16px;
  border-radius: 14px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.fw-label {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  letter-spacing: 0.01em;
}

.fw-btns {
  display: flex;
  gap: 16px;
}

.fw-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(255, 255, 255, 0.07);
  font-size: 20px;
  cursor: pointer;
  transition: transform 0.15s, background 0.15s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fw-btn:active {
  transform: scale(0.9);
}

.fw-btn--pos:hover { background: rgba(112, 224, 168, 0.2); }
.fw-btn--neg:hover { background: rgba(233, 74, 168, 0.2); }

.fw-textarea {
  width: 100%;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  padding: 10px 12px;
  resize: none;
  outline: none;
  font-family: inherit;
  box-sizing: border-box;
}

.fw-textarea::placeholder { color: rgba(255, 255, 255, 0.35); }

.fw-comment-btns {
  display: flex;
  gap: 10px;
  width: 100%;
}

.fw-send {
  flex: 1;
  padding: 10px 0;
  border-radius: 10px;
  border: none;
  background: linear-gradient(135deg, #ffc857 0%, #e94aa8 100%);
  color: #1a0e2e;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.fw-send:disabled { opacity: 0.6; cursor: default; }

.fw-skip {
  flex: 1;
  padding: 10px 0;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
}

.fw-thanks {
  font-size: 14px;
  color: #70e0a8;
  font-weight: 600;
  padding: 4px 0;
}

/* Анимация появления/исчезновения */
.feedback-fade-enter-active,
.feedback-fade-leave-active {
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.feedback-fade-enter-from,
.feedback-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>

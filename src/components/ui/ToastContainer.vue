<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="`toast--${toast.type}`"
          @click="removeToast(toast.id)"
        >
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toasts, removeToast } = useToast()

const icons = { error: '⚠', success: '✓', info: 'ℹ' }
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: calc(100vw - 32px);
  max-width: 380px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  border-radius: 14px;
  backdrop-filter: blur(12px);
  font-size: 13px;
  line-height: 1.5;
  font-family: 'Manrope', sans-serif;
  pointer-events: all;
  cursor: pointer;
  word-break: break-word;
}

.toast--error {
  background: rgba(255, 80, 80, 0.18);
  border: 1px solid rgba(255, 80, 80, 0.35);
  color: #ffb3b3;
}

.toast--success {
  background: rgba(112, 224, 168, 0.15);
  border: 1px solid rgba(112, 224, 168, 0.3);
  color: #70e0a8;
}

.toast--info {
  background: rgba(182, 84, 255, 0.15);
  border: 1px solid rgba(182, 84, 255, 0.3);
  color: #d89fff;
}

.toast-icon {
  flex-shrink: 0;
  font-size: 14px;
  line-height: 1.4;
}

.toast-msg { flex: 1; }

.toast-enter-active { transition: all 0.3s ease; }
.toast-leave-active { transition: all 0.25s ease; }
.toast-enter-from  { opacity: 0; transform: translateY(-10px) scale(0.96); }
.toast-leave-to    { opacity: 0; transform: translateY(-6px) scale(0.96); }
</style>

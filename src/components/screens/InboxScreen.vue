<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <div style="width:36px"></div>
        <div class="header-title serif">Входящие</div>
        <div style="width:36px"></div>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-state">
        <div class="loading-spinner"></div>
        <div class="loading-text">Загружаем сообщения...</div>
      </div>

      <!-- Empty state -->
      <div v-else-if="messages.length === 0" class="empty-state">
        <div class="empty-icon">📥</div>
        <div class="empty-title serif">Пока пусто</div>
        <div class="empty-sub">Здесь будут появляться сообщения от Liora</div>
      </div>

      <!-- Messages -->
      <div v-else class="inbox-list">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="inbox-card glass"
          :class="{ 'inbox-card--unread': !msg.read }"
        >
          <div v-if="!msg.read" class="unread-dot"></div>
          <div class="inbox-body">
            <div class="inbox-text">{{ msg.text }}</div>
            <div class="inbox-date">{{ formatDate(msg.createdAt) }}</div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useInbox } from '@/composables/useInbox'

const { messages, isLoading, fetchMessages, markAllRead } = useInbox()

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) + ', ' +
         d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

onMounted(async () => {
  await fetchMessages()
  // Открыл вкладку — всё прочитано разом (решили не делать read-статус на каждое сообщение отдельно)
  await markAllRead()
})
</script>

<style scoped>
.screen-wrap {
  min-height: var(--tg-viewport-stable-height, 100vh);
  padding-bottom: calc(90px + var(--tg-safe-area-inset-bottom, 0px));
  overflow-y: auto;
}
.content {
  padding: calc(var(--tg-safe-area-inset-top, 0px) + var(--tg-content-safe-area-inset-top, 0px) + 16px) 20px 20px;
}

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:16px; }
.header-title { font-size:18px; text-align:center; }

/* Loading */
.loading-state { display:flex; flex-direction:column; align-items:center; gap:12px; padding:60px 0; }
.loading-spinner {
  width:32px; height:32px; border-radius:50%;
  border:3px solid rgba(255,255,255,.1); border-top-color:#b654ff;
  animation:spin .8s linear infinite;
}
@keyframes spin { to { transform:rotate(360deg); } }
.loading-text { font-size:13px; color:rgba(255,255,255,.5); }

/* Empty */
.empty-state { display:flex; flex-direction:column; align-items:center; text-align:center; padding:60px 20px 0; }
.empty-icon  { font-size:56px; margin-bottom:16px; }
.empty-title { font-size:24px; margin-bottom:10px; }
.empty-sub   { font-size:14px; color:rgba(255,255,255,.55); line-height:1.6; margin-bottom:24px; max-width:260px; }

/* Messages */
.inbox-list { display:flex; flex-direction:column; gap:12px; }
.inbox-card {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px;
  border-radius: 16px;
}
.inbox-card--unread {
  border: 1px solid rgba(182,84,255,0.35);
  background: linear-gradient(135deg, rgba(182,84,255,0.08), rgba(233,74,168,0.04));
}
.unread-dot {
  flex-shrink: 0;
  width: 8px; height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: linear-gradient(135deg, #b654ff, #e94aa8);
  box-shadow: 0 0 8px rgba(233,74,168,0.6);
}
.inbox-body { flex: 1; min-width: 0; }
.inbox-text { font-size: 14px; line-height: 1.5; color: #F5ECFF; white-space: pre-wrap; word-break: break-word; }
.inbox-date { font-size: 11px; color: rgba(255,255,255,.4); margin-top: 8px; }
</style>

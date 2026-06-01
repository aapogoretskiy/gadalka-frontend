<template>
  <div class="dashboard">

    <!-- ── Шапка ─────────────────────────────────────────────── -->
    <header class="dash-header">
      <h1>🔮 Админ-панель</h1>
      <button class="btn-ghost" @click="logout">Выйти</button>
    </header>

    <!-- ── Вкладки ───────────────────────────────────────────── -->
    <div class="tabs">
      <button
        class="tab"
        :class="{ active: activeTab === 'users' }"
        @click="activeTab = 'users'"
      >Пользователи</button>
      <button
        class="tab"
        :class="{ active: activeTab === 'broadcast' }"
        @click="activeTab = 'broadcast'"
      >
        📣 Рассылка
        <span v-if="selectedIds.size > 0" class="tab-badge">{{ selectedIds.size }}</span>
      </button>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: ПОЛЬЗОВАТЕЛИ
    ══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'users'">

      <!-- Поиск + счётчик выбранных -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Telegram ID или @username..."
          @input="onSearchInput"
        />
        <button
          v-if="selectedIds.size > 0"
          class="btn-broadcast"
          @click="goToBroadcast"
        >
          📣 Рассылка выбранным ({{ selectedIds.size }})
        </button>
      </div>

      <!-- Таблица -->
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th class="th-check">
                <!-- Выбрать всех на странице -->
                <input
                  type="checkbox"
                  :checked="allOnPageSelected"
                  :indeterminate="someOnPageSelected"
                  @change="toggleAllOnPage"
                />
              </th>
              <th>TG ID</th>
              <th>Username</th>
              <th>Имя</th>
              <th>Регистрация</th>
              <th>Активен</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="8" class="loading-row">Загрузка...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="8" class="empty-row">Пользователи не найдены</td>
            </tr>
            <tr
              v-for="user in users"
              :key="user.id"
              class="user-row"
              :class="{ banned: user.banned, selected: selectedIds.has(user.id) }"
            >
              <!-- Чекбокс — не открывает детали -->
              <td class="td-check" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedIds.has(user.id)"
                  @change="toggleSelect(user.id)"
                />
              </td>
              <td class="mono" @click="openDetails(user.id)">{{ user.telegramId }}</td>
              <td @click="openDetails(user.id)">{{ user.username ? '@' + user.username : '—' }}</td>
              <td @click="openDetails(user.id)">{{ user.firstName || '—' }}</td>
              <td @click="openDetails(user.id)">{{ formatDate(user.createdAt) }}</td>
              <td @click="openDetails(user.id)">{{ user.lastActiveAt ? formatDate(user.lastActiveAt) : '—' }}</td>
              <td @click="openDetails(user.id)">
                <span class="badge" :class="user.banned ? 'badge-ban' : 'badge-ok'">
                  {{ user.banned ? 'Забанен' : 'Активен' }}
                </span>
              </td>
              <td class="arrow" @click="openDetails(user.id)">›</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Пагинация -->
      <div class="pagination">
        <button :disabled="currentPage === 0" @click="changePage(currentPage - 1)">← Назад</button>
        <span>Страница {{ currentPage + 1 }} из {{ totalPages }}</span>
        <button :disabled="currentPage >= totalPages - 1" @click="changePage(currentPage + 1)">Вперёд →</button>
      </div>

    </template>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: РАССЫЛКА
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'broadcast'">
      <div class="broadcast-wrap">

        <!-- Кому -->
        <section class="bc-section">
          <h3 class="bc-label">Кому</h3>
          <div class="recipient-info">
            <template v-if="selectedIds.size > 0">
              <span class="bc-recipient">Выбранным пользователям ({{ selectedIds.size }})</span>
              <button class="btn-ghost-sm" @click="selectedIds.clear()">Сбросить выбор</button>
            </template>
            <span v-else class="bc-recipient all">Всем зарегистрированным пользователям</span>
          </div>
        </section>

        <!-- Шаблоны -->
        <section class="bc-section">
          <h3 class="bc-label">Шаблон</h3>
          <div class="templates">
            <button
              v-for="tpl in templates"
              :key="tpl.id"
              class="tpl-btn"
              :class="{ active: activeTemplate === tpl.id }"
              @click="applyTemplate(tpl)"
            >{{ tpl.icon }} {{ tpl.name }}</button>
            <button
              class="tpl-btn"
              :class="{ active: activeTemplate === 'custom' }"
              @click="activeTemplate = 'custom'"
            >✏️ Своё сообщение</button>
          </div>
        </section>

        <!-- Текст -->
        <section class="bc-section">
          <h3 class="bc-label">Текст сообщения <span class="bc-hint">(поддерживает Markdown)</span></h3>
          <textarea
            v-model="broadcastMessage"
            class="bc-textarea"
            rows="6"
            placeholder="Введите текст сообщения..."
            @input="activeTemplate = 'custom'"
          />
          <div class="char-count" :class="{ warn: broadcastMessage.length > 3800 }">
            {{ broadcastMessage.length }} / 4096
          </div>
        </section>

        <!-- Подарок знаков -->
        <section class="bc-section">
          <label class="bc-toggle-row">
            <input type="checkbox" v-model="withGift" />
            <span>Добавить подарок знаков</span>
          </label>
          <div v-if="withGift" class="bc-gift-row">
            <input
              v-model.number="broadcastGiftAmount"
              type="number"
              min="1"
              max="1000"
              placeholder="Количество знаков"
              class="bc-number-input"
            />
            <span class="bc-hint">знаков каждому получателю</span>
          </div>
        </section>

        <!-- Кнопки отправки -->
        <section class="bc-section bc-actions">
          <button
            class="btn-primary btn-send"
            :disabled="broadcastLoading || !broadcastMessage.trim() || (withGift && (!broadcastGiftAmount || broadcastGiftAmount <= 0))"
            @click="sendBroadcast"
          >
            <span v-if="broadcastLoading">⏳ Запуск рассылки...</span>
            <span v-else-if="selectedIds.size > 0">📣 Отправить выбранным ({{ selectedIds.size }})</span>
            <span v-else>📣 Отправить всем</span>
          </button>
        </section>

        <!-- Статус -->
        <p v-if="broadcastSuccess" class="success-msg">{{ broadcastSuccess }}</p>
        <p v-if="broadcastError" class="error-msg">{{ broadcastError }}</p>

      </div>
    </template>

    <!-- ── Детали пользователя (боковая панель) ──────────────── -->
    <Transition name="slide-panel">
      <div v-if="selectedUser" class="side-panel">
        <div class="panel-header">
          <h2>{{ selectedUser.firstName || 'Пользователь' }}</h2>
          <button class="btn-ghost" @click="selectedUser = null">✕</button>
        </div>

        <div class="panel-body">
          <!-- Основные данные -->
          <section class="info-section">
            <div class="info-row">
              <span class="label">Telegram ID</span>
              <span class="mono">{{ selectedUser.telegramId }}</span>
            </div>
            <div class="info-row" v-if="selectedUser.username">
              <span class="label">Username</span>
              <span>@{{ selectedUser.username }}</span>
            </div>
            <div class="info-row">
              <span class="label">Зарегистрирован</span>
              <span>{{ formatDate(selectedUser.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Последняя активность</span>
              <span>{{ selectedUser.lastActiveAt ? formatDate(selectedUser.lastActiveAt) : 'Нет данных' }}</span>
            </div>
            <div class="info-row" v-if="selectedUser.referralSource">
              <span class="label">Источник</span>
              <span>{{ selectedUser.referralSource }}</span>
            </div>
          </section>

          <!-- Баланс -->
          <section class="info-section">
            <h3>Знаки</h3>
            <div class="stats-row">
              <div class="stat">
                <div class="stat-value">{{ selectedUser.balance }}</div>
                <div class="stat-label">На балансе</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ selectedUser.totalGranted }}</div>
                <div class="stat-label">Начислено всего</div>
              </div>
              <div class="stat">
                <div class="stat-value">{{ selectedUser.totalSpent }}</div>
                <div class="stat-label">Потрачено</div>
              </div>
            </div>
          </section>

          <!-- Подарок -->
          <section class="info-section">
            <h3>Подарить знаки</h3>
            <div class="gift-row">
              <input
                v-model.number="giftAmount"
                type="number"
                min="1"
                max="100"
                placeholder="Количество"
              />
              <button
                class="btn-primary"
                :disabled="giftLoading || !giftAmount || giftAmount <= 0"
                @click="sendGift"
              >
                {{ giftLoading ? '...' : '🎁 Подарить' }}
              </button>
            </div>
            <p v-if="giftSuccess" class="success-msg">{{ giftSuccess }}</p>
            <p v-if="giftError" class="error-msg">{{ giftError }}</p>
          </section>

          <!-- Бан -->
          <section class="info-section">
            <h3>Управление доступом</h3>
            <button
              v-if="!selectedUser.banned"
              class="btn-danger"
              :disabled="banLoading"
              @click="banUser"
            >
              {{ banLoading ? '...' : '🚫 Заблокировать' }}
            </button>
            <button
              v-else
              class="btn-success"
              :disabled="banLoading"
              @click="unbanUser"
            >
              {{ banLoading ? '...' : '✅ Разблокировать' }}
            </button>
          </section>
        </div>
      </div>
    </Transition>

    <!-- Overlay для закрытия панели -->
    <div v-if="selectedUser" class="overlay" @click="selectedUser = null" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi, type AdminUserSummary, type AdminUserDetails } from '@/utils/adminApi'

const router = useRouter()

// ── Вкладки ───────────────────────────────────────────────────────────────
const activeTab = ref<'users' | 'broadcast'>('users')

// ── Список пользователей ──────────────────────────────────────────────────
const users = ref<AdminUserSummary[]>([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(1)
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

const loadUsers = async (page = 0) => {
  loading.value = true
  try {
    const res = await adminApi.getUsers(page, 20, searchQuery.value || undefined)
    users.value = res.data.content
    totalPages.value = res.data.totalPages || 1
    currentPage.value = res.data.number
  } catch {
    users.value = []
  } finally {
    loading.value = false
  }
}

const onSearchInput = () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadUsers(0), 400)
}

const changePage = (page: number) => loadUsers(page)

// ── Выбор пользователей для рассылки ──────────────────────────────────────
const selectedIds = ref(new Set<number>())

const toggleSelect = (id: number) => {
  if (selectedIds.value.has(id)) {
    selectedIds.value.delete(id)
  } else {
    selectedIds.value.add(id)
  }
  // Триггерим реактивность (Set не реактивен напрямую)
  selectedIds.value = new Set(selectedIds.value)
}

const allOnPageSelected = computed(() =>
  users.value.length > 0 && users.value.every(u => selectedIds.value.has(u.id))
)

const someOnPageSelected = computed(() =>
  users.value.some(u => selectedIds.value.has(u.id)) && !allOnPageSelected.value
)

const toggleAllOnPage = () => {
  if (allOnPageSelected.value) {
    users.value.forEach(u => selectedIds.value.delete(u.id))
  } else {
    users.value.forEach(u => selectedIds.value.add(u.id))
  }
  selectedIds.value = new Set(selectedIds.value)
}

const goToBroadcast = () => {
  activeTab.value = 'broadcast'
}

// ── Детали пользователя ───────────────────────────────────────────────────
const selectedUser = ref<AdminUserDetails | null>(null)

const openDetails = async (id: number) => {
  try {
    const res = await adminApi.getUser(id)
    selectedUser.value = res.data
    giftAmount.value = null
    giftSuccess.value = null
    giftError.value = null
  } catch {
    // ignore
  }
}

// ── Подарок ───────────────────────────────────────────────────────────────
const giftAmount = ref<number | null>(null)
const giftLoading = ref(false)
const giftSuccess = ref<string | null>(null)
const giftError = ref<string | null>(null)

const sendGift = async () => {
  if (!selectedUser.value || !giftAmount.value) return
  giftLoading.value = true
  giftSuccess.value = null
  giftError.value = null
  try {
    await adminApi.giftCredits(selectedUser.value.id, giftAmount.value)
    giftSuccess.value = `Подарено ${giftAmount.value} знаков! Уведомление отправлено в бот.`
    giftAmount.value = null
    const res = await adminApi.getUser(selectedUser.value.id)
    selectedUser.value = res.data
  } catch (e: any) {
    giftError.value = e.response?.data?.message || 'Ошибка при отправке подарка'
  } finally {
    giftLoading.value = false
  }
}

// ── Бан / Разбан ──────────────────────────────────────────────────────────
const banLoading = ref(false)

const banUser = async () => {
  if (!selectedUser.value) return
  banLoading.value = true
  try {
    await adminApi.banUser(selectedUser.value.id)
    selectedUser.value.banned = true
    const row = users.value.find(u => u.id === selectedUser.value!.id)
    if (row) row.banned = true
  } catch {
    // ignore
  } finally {
    banLoading.value = false
  }
}

const unbanUser = async () => {
  if (!selectedUser.value) return
  banLoading.value = true
  try {
    await adminApi.unbanUser(selectedUser.value.id)
    selectedUser.value.banned = false
    const row = users.value.find(u => u.id === selectedUser.value!.id)
    if (row) row.banned = false
  } catch {
    // ignore
  } finally {
    banLoading.value = false
  }
}

// ── Рассылка ──────────────────────────────────────────────────────────────

interface Template {
  id: string
  name: string
  icon: string
  text: string
}

const templates: Template[] = [
  {
    id: 'gift',
    name: 'Подарок',
    icon: '🎁',
    text: 'Спасибо, что вы с нами!\n\nМы ценим каждого, кто доверяет свои вопросы Гадалке — и хотим сказать вам спасибо ✨\n\nОткройте приложение и загляните в будущее — карты уже ждут вас 🔮',
  },
  {
    id: 'announce',
    name: 'Анонс',
    icon: '📣',
    text: 'У нас новости! ✨\n\nМы выпустили обновление — заходите и открывайте для себя что-то новое.\n\nГадалка стала ещё лучше 🔮',
  },
  {
    id: 'reminder',
    name: 'Напоминание',
    icon: '🔮',
    text: 'Звёзды ждут вас...\n\nДавно не заглядывали в Гадалку? Возможно, сегодня именно тот день, когда карты раскроют что-то важное.\n\nЗаходите — ответы рядом 🌙',
  },
]

const activeTemplate = ref<string>('custom')
const broadcastMessage = ref('')
const withGift = ref(false)
const broadcastGiftAmount = ref<number | null>(null)
const broadcastLoading = ref(false)
const broadcastSuccess = ref<string | null>(null)
const broadcastError = ref<string | null>(null)

const applyTemplate = (tpl: Template) => {
  activeTemplate.value = tpl.id
  broadcastMessage.value = tpl.text
}

const sendBroadcast = async () => {
  if (!broadcastMessage.value.trim()) return
  broadcastLoading.value = true
  broadcastSuccess.value = null
  broadcastError.value = null

  const userIds = Array.from(selectedIds.value)
  const giftAmt = withGift.value ? broadcastGiftAmount.value : null

  try {
    const res = await adminApi.broadcast(broadcastMessage.value, giftAmt, userIds)
    broadcastSuccess.value = res.data.message + '. Рассылка идёт в фоне — это может занять несколько минут.'
    // После успеха сбрасываем выбор
    selectedIds.value = new Set()
  } catch (e: any) {
    broadcastError.value = e.response?.data?.message || 'Ошибка при запуске рассылки'
  } finally {
    broadcastLoading.value = false
  }
}

// ── Выход ─────────────────────────────────────────────────────────────────
const logout = async () => {
  try { await adminApi.logout() } catch { /* ignore */ }
  router.push({ name: 'admin-login' })
}

// ── Утилиты ───────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => loadUsers(0))
</script>

<style scoped>
/* ── Layout ── */
.dashboard {
  min-height: 100vh;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'Inter', system-ui, sans-serif;
  padding: 0 0 40px;
}

/* ── Header ── */
.dash-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #1e293b;
  background: #0f172a;
  position: sticky;
  top: 0;
  z-index: 10;
}
.dash-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #1e293b;
  padding: 0 24px;
}
.tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 12px 16px;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s, border-color 0.15s;
}
.tab:hover { color: #e2e8f0; }
.tab.active {
  color: #e2e8f0;
  border-bottom-color: #6366f1;
}
.tab-badge {
  background: #6366f1;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
  padding: 1px 7px;
  min-width: 20px;
  text-align: center;
}

/* ── Search ── */
.search-bar {
  padding: 16px 24px;
  display: flex;
  gap: 12px;
  align-items: center;
}
.search-bar input {
  flex: 1;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  box-sizing: border-box;
}
.search-bar input:focus { border-color: #6366f1; }
.search-bar input::placeholder { color: #475569; }

.btn-broadcast {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
}

/* ── Table ── */
.table-wrap {
  overflow-x: auto;
  padding: 0 24px;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}
thead th {
  text-align: left;
  color: #64748b;
  font-weight: 500;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 8px 12px;
  border-bottom: 1px solid #1e293b;
}
.th-check { width: 36px; padding: 8px 4px 8px 12px; }

tbody tr {
  border-bottom: 1px solid #1e293b;
  transition: background 0.15s;
}
tbody tr:hover { background: #1e293b; }
tbody tr.banned { opacity: 0.5; }
tbody tr.selected { background: rgba(99, 102, 241, 0.08); }
tbody tr.selected:hover { background: rgba(99, 102, 241, 0.14); }

td {
  padding: 12px 12px;
  color: #cbd5e1;
  white-space: nowrap;
  cursor: pointer;
}
.td-check {
  padding: 12px 4px 12px 12px;
  cursor: default;
  width: 36px;
}
.mono { font-family: monospace; color: #94a3b8; }
.arrow { color: #475569; font-size: 18px; text-align: right; }
.loading-row, .empty-row {
  text-align: center;
  padding: 32px;
  color: #475569;
  cursor: default;
}

/* ── Checkbox ── */
input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #6366f1;
  cursor: pointer;
}

/* ── Badge ── */
.badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 999px;
}
.badge-ok  { background: rgba(34,197,94,0.15);  color: #86efac; }
.badge-ban { background: rgba(239,68,68,0.15);   color: #fca5a5; }

/* ── Pagination ── */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 20px 24px;
  font-size: 14px;
  color: #64748b;
}
.pagination button {
  background: #1e293b;
  border: 1px solid #334155;
  color: #e2e8f0;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
}
.pagination button:disabled { opacity: 0.3; cursor: not-allowed; }

/* ── Broadcast tab ── */
.broadcast-wrap {
  max-width: 680px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.bc-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bc-label {
  margin: 0;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.bc-hint {
  font-size: 11px;
  color: #475569;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}
.recipient-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.bc-recipient {
  font-size: 14px;
  color: #e2e8f0;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 14px;
}
.bc-recipient.all { color: #818cf8; border-color: rgba(99,102,241,0.3); background: rgba(99,102,241,0.08); }

.templates {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.tpl-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #94a3b8;
  border-radius: 8px;
  padding: 8px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.tpl-btn:hover { border-color: #6366f1; color: #e2e8f0; }
.tpl-btn.active { background: rgba(99,102,241,0.12); border-color: #6366f1; color: #a5b4fc; }

.bc-textarea {
  width: 100%;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  line-height: 1.6;
  padding: 12px 14px;
  outline: none;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
}
.bc-textarea:focus { border-color: #6366f1; }
.bc-textarea::placeholder { color: #475569; }

.char-count {
  font-size: 12px;
  color: #475569;
  text-align: right;
}
.char-count.warn { color: #fbbf24; }

.bc-toggle-row {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: #e2e8f0;
  cursor: pointer;
}
.bc-gift-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
.bc-number-input {
  width: 140px;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  padding: 8px 12px;
  outline: none;
}
.bc-number-input:focus { border-color: #6366f1; }

.bc-actions { flex-direction: row; }
.btn-send {
  width: 100%;
  padding: 12px;
  font-size: 15px;
  font-weight: 500;
}

/* ── Side panel ── */
.side-panel {
  position: fixed;
  top: 0;
  right: 0;
  width: 360px;
  height: 100vh;
  background: #1e293b;
  border-left: 1px solid #334155;
  z-index: 50;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #334155;
  position: sticky;
  top: 0;
  background: #1e293b;
  z-index: 1;
}
.panel-header h2 { margin: 0; font-size: 16px; font-weight: 600; }

.panel-body {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.info-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.info-section h3 {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.info-row {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  gap: 8px;
}
.label { color: #64748b; flex-shrink: 0; }

/* ── Stats ── */
.stats-row {
  display: flex;
  gap: 12px;
}
.stat {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
}
.stat-value { font-size: 20px; font-weight: 700; color: #f1f5f9; }
.stat-label { font-size: 11px; color: #64748b; margin-top: 2px; }

/* ── Gift ── */
.gift-row {
  display: flex;
  gap: 8px;
}
.gift-row input {
  flex: 1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  padding: 8px 12px;
  outline: none;
  min-width: 0;
}
.gift-row input:focus { border-color: #6366f1; }

/* ── Buttons ── */
.btn-primary {
  background: #6366f1;
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  white-space: nowrap;
}
.btn-primary:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-danger {
  width: 100%;
  background: rgba(239,68,68,0.1);
  color: #fca5a5;
  border: 1px solid rgba(239,68,68,0.3);
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
}
.btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-success {
  width: 100%;
  background: rgba(34,197,94,0.1);
  color: #86efac;
  border: 1px solid rgba(34,197,94,0.3);
  border-radius: 8px;
  padding: 10px;
  font-size: 14px;
  cursor: pointer;
}
.btn-success:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-ghost {
  background: transparent;
  border: 1px solid #334155;
  color: #94a3b8;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.btn-ghost-sm {
  background: transparent;
  border: 1px solid #334155;
  color: #64748b;
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 12px;
  cursor: pointer;
}
.btn-ghost-sm:hover { color: #94a3b8; }

.success-msg { font-size: 13px; color: #86efac; margin: 4px 0 0; }
.error-msg   { font-size: 13px; color: #fca5a5; margin: 4px 0 0; }

/* ── Overlay ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 40;
}

/* ── Panel transition ── */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.slide-panel-enter-from,
.slide-panel-leave-to {
  transform: translateX(100%);
}
</style>

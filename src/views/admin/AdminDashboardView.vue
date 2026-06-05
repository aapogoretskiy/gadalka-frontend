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
      <button
        class="tab"
        :class="{ active: activeTab === 'reports' }"
        @click="openReports"
      >📊 Отчёты</button>
      <button
        class="tab"
        :class="{ active: activeTab === 'referrals' }"
        @click="openReferralTab"
      >🔗 Рефералы</button>
      <button
        class="tab"
        :class="{ active: activeTab === 'tickets' }"
        @click="openTicketsTab"
      >
        🎫 Заявки
        <span v-if="openTicketsCount > 0" class="tab-badge tab-badge--warn">{{ openTicketsCount }}</span>
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

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: ОТЧЁТЫ
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'reports'">
      <div class="reports-wrap">

        <div class="reports-toolbar">
          <span class="reports-updated" v-if="reportsUpdatedAt">
            Обновлено: {{ formatDate(reportsUpdatedAt) }}
          </span>
          <button class="btn-ghost" :disabled="reportsLoading" @click="loadReports">
            {{ reportsLoading ? '⏳ Загрузка...' : '🔄 Обновить' }}
          </button>
        </div>

        <p v-if="reportsError" class="error-msg">{{ reportsError }}</p>

        <template v-if="reports">

          <!-- Пользователи -->
          <div class="report-group">
            <h3 class="report-group-title">👤 Пользователи</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(reports.users.total) }}</div>
                <div class="metric-label">Всего зарегистрировано</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.users.newToday) }}</div>
                <div class="metric-label">Новых сегодня</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.users.new7Days) }}</div>
                <div class="metric-label">Новых за 7 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.users.new30Days) }}</div>
                <div class="metric-label">Новых за 30 дней</div>
              </div>
              <div class="metric-card metric-highlight">
                <div class="metric-value">{{ fmt(reports.users.dau) }}</div>
                <div class="metric-label">DAU (активны 24ч)</div>
              </div>
              <div class="metric-card metric-highlight">
                <div class="metric-value">{{ fmt(reports.users.wau) }}</div>
                <div class="metric-label">WAU (активны 7 дн)</div>
              </div>
            </div>
          </div>

          <!-- Гадания -->
          <div class="report-group">
            <h3 class="report-group-title">🔮 Гадания</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(reports.fortunes.total) }}</div>
                <div class="metric-label">Всего гаданий</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.fortunes.last7Days) }}</div>
                <div class="metric-label">За 7 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.fortunes.last30Days) }}</div>
                <div class="metric-label">За 30 дней</div>
              </div>
            </div>
          </div>

          <!-- Финансы — Рубли -->
          <div class="report-group">
            <h3 class="report-group-title">💳 Платежи — Рубли (Robokassa)</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ rubFormatTotal(reports.payments.rubKopecksTotal) }}</div>
                <div class="metric-label">Выручка всего</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ rubFormat(reports.payments.rubKopecks7Days) }}</div>
                <div class="metric-label">За 7 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ rubFormat(reports.payments.rubKopecks30Days) }}</div>
                <div class="metric-label">За 30 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.payments.rubPayingUsers) }}</div>
                <div class="metric-label">Платящих пользователей</div>
              </div>
            </div>
          </div>

          <!-- Финансы — Stars -->
          <div class="report-group">
            <h3 class="report-group-title">⭐ Платежи — Telegram Stars</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(reports.payments.starsTotal) }} ★</div>
                <div class="metric-label">Stars всего</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.payments.stars7Days) }} ★</div>
                <div class="metric-label">За 7 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.payments.stars30Days) }} ★</div>
                <div class="metric-label">За 30 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.payments.starsPayingUsers) }}</div>
                <div class="metric-label">Stars-плательщиков</div>
              </div>
            </div>
          </div>

          <!-- Знаки -->
          <div class="report-group">
            <h3 class="report-group-title">✨ Знаки (кредиты)</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(reports.credits.totalGranted) }}</div>
                <div class="metric-label">Начислено всего</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.credits.totalSpent) }}</div>
                <div class="metric-label">Потрачено всего</div>
              </div>
              <div class="metric-card metric-highlight">
                <div class="metric-value">{{ fmt(reports.credits.currentInCirculation) }}</div>
                <div class="metric-label">В обороте сейчас</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.credits.grantedByPayment) }}</div>
                <div class="metric-label">Через покупку</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.credits.grantedByAdmin) }}</div>
                <div class="metric-label">Подарки (админ)</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.credits.grantedByBonus) }}</div>
                <div class="metric-label">Бонусы (старт/рефанд)</div>
              </div>
            </div>
          </div>

        </template>

        <div v-else-if="!reportsLoading" class="reports-empty">
          Нажмите «Обновить» для загрузки данных
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: РЕФЕРАЛЫ
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'referrals'">
      <div class="reports-wrap">

        <div class="reports-toolbar">
          <span class="reports-updated" v-if="referralUpdatedAt">
            Обновлено: {{ formatDate(referralUpdatedAt) }}
          </span>
          <button class="btn-ghost" :disabled="referralLoading" @click="loadReferralStats">
            {{ referralLoading ? '⏳ Загрузка...' : '🔄 Обновить' }}
          </button>
        </div>

        <p v-if="referralError" class="error-msg">{{ referralError }}</p>

        <template v-if="referralStats">

          <!-- Маркетинговые источники -->
          <div class="report-group">
            <h3 class="report-group-title">📣 Маркетинговые источники</h3>
            <div v-if="referralStats.marketing.length === 0" class="reports-empty">
              Данных пока нет
            </div>
            <div v-else class="ref-table-wrap">
              <table class="ref-table">
                <thead>
                  <tr>
                    <th>Источник</th>
                    <th class="num">Кликов</th>
                    <th class="num">Открытий</th>
                    <th class="num">Новых</th>
                    <th class="num">Конверсия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="src in referralStats.marketing" :key="src.source">
                    <td class="src-code">{{ src.source }}</td>
                    <td class="num">{{ fmt(src.clicks) }}</td>
                    <td class="num">{{ fmt(src.appOpens) }}</td>
                    <td class="num bold">{{ fmt(src.newUsers) }}</td>
                    <td class="num">
                      <span class="conv-badge" :class="convClass(src.conversionPct)">
                        {{ src.conversionPct }}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Топ пользователей-рефереров -->
          <div class="report-group">
            <h3 class="report-group-title">👤 Топ пользователей по приглашениям</h3>
            <div v-if="referralStats.topUserReferrers.length === 0" class="reports-empty">
              Пользовательских рефералов пока нет
            </div>
            <div v-else class="referrer-list">
              <div
                v-for="referrer in referralStats.topUserReferrers"
                :key="referrer.userId"
                class="referrer-card"
              >
                <!-- Заголовок реферера -->
                <div class="referrer-row" @click="toggleReferrerExpand(referrer)">
                  <div class="referrer-rank">#{{ referralStats.topUserReferrers.indexOf(referrer) + 1 }}</div>
                  <div class="referrer-info">
                    <div class="referrer-name">
                      {{ referrer.firstName || 'Без имени' }}
                      <span v-if="referrer.username" class="referrer-username">@{{ referrer.username }}</span>
                    </div>
                    <div class="referrer-tid">TG: {{ referrer.telegramId }}</div>
                  </div>
                  <div class="referrer-count">
                    <span class="referrer-count-val">{{ referrer.invitedCount }}</span>
                    <span class="referrer-count-label">приглашён{{ referrer.invitedCount === 1 ? '' : referrer.invitedCount < 5 ? 'о' : 'о' }}</span>
                  </div>
                  <div class="referrer-toggle">
                    {{ expandedReferrerId === referrer.userId ? '▲' : '▼' }}
                  </div>
                </div>

                <!-- Раскрывающийся список приглашённых -->
                <div v-if="expandedReferrerId === referrer.userId" class="invited-list">
                  <div v-if="invitedLoading === referrer.userId" class="invited-loading">
                    Загрузка...
                  </div>
                  <div v-else-if="!invitedUsers[referrer.userId]?.length" class="invited-loading">
                    Список пуст
                  </div>
                  <div
                    v-else
                    v-for="inv in invitedUsers[referrer.userId]"
                    :key="inv.userId"
                    class="invited-row"
                  >
                    <span class="invited-name">
                      {{ inv.firstName || '—' }}
                      <span v-if="inv.username" class="referrer-username">@{{ inv.username }}</span>
                    </span>
                    <span class="invited-date">{{ formatDate(inv.createdAt) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </template>

        <div v-else-if="!referralLoading" class="reports-empty">
          Нажмите «Обновить» для загрузки данных
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: ЗАЯВКИ
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'tickets'">
      <div class="reports-wrap">

        <!-- Тулбар: фильтр + обновить -->
        <div class="reports-toolbar">
          <div class="tickets-filter">
            <button
              class="filter-btn"
              :class="{ active: ticketsStatusFilter === 'OPEN' }"
              @click="setTicketFilter('OPEN')"
            >Открытые</button>
            <button
              class="filter-btn"
              :class="{ active: ticketsStatusFilter === '' }"
              @click="setTicketFilter('')"
            >Все</button>
          </div>
          <button class="btn-ghost" :disabled="ticketsLoading" @click="loadTickets(0)">
            {{ ticketsLoading ? '⏳' : '🔄 Обновить' }}
          </button>
        </div>

        <!-- Таблица заявок -->
        <div class="table-wrap" style="padding:0">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Обращение</th>
                <th>Дата</th>
                <th>Статус</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ticketsLoading">
                <td colspan="6" class="loading-row">Загрузка...</td>
              </tr>
              <tr v-else-if="tickets.length === 0">
                <td colspan="6" class="empty-row">Заявок нет</td>
              </tr>
              <tr
                v-for="ticket in tickets"
                :key="ticket.id"
                class="user-row"
                @click="openTicketDetails(ticket.id)"
              >
                <td class="mono">#{{ ticket.id }}</td>
                <td>{{ ticket.userName || '—' }}</td>
                <td class="ticket-preview">{{ ticket.descriptionPreview }}</td>
                <td>{{ formatDate(ticket.createdAt) }}</td>
                <td>
                  <span class="badge" :class="ticket.status === 'OPEN' ? 'badge-open' : 'badge-closed'">
                    {{ ticket.status === 'OPEN' ? 'Открыта' : 'Закрыта' }}
                  </span>
                </td>
                <td class="arrow">›</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div class="pagination">
          <button :disabled="ticketsPage === 0" @click="loadTickets(ticketsPage - 1)">← Назад</button>
          <span>Страница {{ ticketsPage + 1 }} из {{ ticketsTotalPages }}</span>
          <button :disabled="ticketsPage >= ticketsTotalPages - 1" @click="loadTickets(ticketsPage + 1)">Вперёд →</button>
        </div>

      </div>
    </template>

    <!-- ── Детали заявки (боковая панель) ────────────────────── -->
    <Transition name="slide-panel">
      <div v-if="selectedTicket" class="side-panel">
        <div class="panel-header">
          <h2>Заявка #{{ selectedTicket.id }}</h2>
          <button class="btn-ghost" @click="selectedTicket = null">✕</button>
        </div>

        <div class="panel-body">

          <!-- Пользователь -->
          <section class="info-section">
            <h3>Пользователь</h3>
            <div class="info-row">
              <span class="label">Имя</span>
              <span>{{ selectedTicket.user.firstName || '—' }}</span>
            </div>
            <div class="info-row" v-if="selectedTicket.user.username">
              <span class="label">Username</span>
              <span>@{{ selectedTicket.user.username }}</span>
            </div>
            <div class="info-row">
              <span class="label">Telegram ID</span>
              <span class="mono">{{ selectedTicket.user.telegramId }}</span>
            </div>
          </section>

          <!-- Текст обращения -->
          <section class="info-section">
            <h3>Текст обращения</h3>
            <div class="ticket-full-text">{{ selectedTicket.description }}</div>
          </section>

          <!-- Мета -->
          <section class="info-section">
            <div class="info-row">
              <span class="label">Создана</span>
              <span>{{ formatDate(selectedTicket.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Статус</span>
              <span class="badge" :class="selectedTicket.status === 'OPEN' ? 'badge-open' : 'badge-closed'">
                {{ selectedTicket.status === 'OPEN' ? 'Открыта' : 'Закрыта' }}
              </span>
            </div>
            <div class="info-row" v-if="selectedTicket.status === 'CLOSED'">
              <span class="label">Закрыта</span>
              <span>{{ formatDate(selectedTicket.closedAt) }}</span>
            </div>
            <div class="info-row" v-if="selectedTicket.creditsGifted > 0">
              <span class="label">Подарено знаков</span>
              <span style="color:#86efac">{{ selectedTicket.creditsGifted }}</span>
            </div>
          </section>

          <!-- Закрытие заявки (только если открыта) -->
          <section v-if="selectedTicket.status === 'OPEN'" class="info-section">
            <h3>Закрыть заявку</h3>
            <label class="bc-toggle-row">
              <input type="checkbox" v-model="closeWithGift" />
              <span>Подарить знаки в качестве компенсации</span>
            </label>
            <div v-if="closeWithGift" class="gift-row" style="margin-top:8px">
              <input
                v-model.number="closeGiftAmount"
                type="number"
                min="1"
                max="1000"
                placeholder="Кол-во знаков"
              />
            </div>
            <button
              class="btn-danger"
              style="background:rgba(99,102,241,0.1);color:#a5b4fc;border-color:rgba(99,102,241,0.3);margin-top:4px"
              :disabled="closeLoading || (closeWithGift && (!closeGiftAmount || closeGiftAmount <= 0))"
              @click="closeTicket"
            >
              {{ closeLoading ? '...' : '✓ Закрыть заявку' }}
            </button>
            <p v-if="closeSuccess" class="success-msg">{{ closeSuccess }}</p>
            <p v-if="closeError" class="error-msg">{{ closeError }}</p>
          </section>

        </div>
      </div>
    </Transition>
    <div v-if="selectedTicket" class="overlay" @click="selectedTicket = null" />

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
              <span>{{ referralSourceLabel(selectedUser.referralSource) }}</span>
            </div>
            <div class="info-row" v-if="selectedUser.referrerName">
              <span class="label">Кто пригласил</span>
              <span class="referrer-name">👤 {{ selectedUser.referrerName }}</span>
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
import { adminApi, type AdminUserSummary, type AdminUserDetails, type AdminReports, type ReferralStats, type TopReferrer, type InvitedUser, type AdminTicketSummary, type AdminTicketDetails } from '@/utils/adminApi'

const router = useRouter()

// ── Вкладки ───────────────────────────────────────────────────────────────
const activeTab = ref<'users' | 'broadcast' | 'reports' | 'referrals' | 'tickets'>('users')

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

// ── Отчёты ────────────────────────────────────────────────────────────────
const reports = ref<AdminReports | null>(null)
const reportsLoading = ref(false)
const reportsError = ref<string | null>(null)
const reportsUpdatedAt = ref<string | null>(null)

const loadReports = async () => {
  reportsLoading.value = true
  reportsError.value = null
  try {
    const res = await adminApi.getReports()
    reports.value = res.data
    reportsUpdatedAt.value = new Date().toISOString()
  } catch {
    reportsError.value = 'Не удалось загрузить отчёты'
  } finally {
    reportsLoading.value = false
  }
}

const openReports = () => {
  activeTab.value = 'reports'
  // Загружаем автоматически при первом открытии
  if (!reports.value) loadReports()
}

/** Человекочитаемый источник регистрации */
const referralSourceLabel = (source: string) => {
  if (!source) return '—'
  if (source.startsWith('ref_')) return '🔗 Реферальная ссылка пользователя'
  return source
}

// ── Форматирование ────────────────────────────────────────────────────────
/** Форматирует число с пробелами-разделителями тысяч */
const fmt = (n: number) => n.toLocaleString('ru-RU')

/** Копейки → рубли с символом */
const rubFormat = (kopecks: number) => {
  const rubles = kopecks / 100
  return rubles.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB', maximumFractionDigits: 0 })
}

/** CSS-класс бейджа конверсии по значению */
const convClass = (pct: number) => {
  if (pct >= 50) return 'conv-high'
  if (pct >= 20) return 'conv-mid'
  return 'conv-low'
}

/** Копейки → рубли для больших сумм (с сокращением тысяч) */
const rubFormatTotal = (kopecks: number) => {
  const rubles = kopecks / 100
  if (rubles >= 1_000_000) return (rubles / 1_000_000).toFixed(1) + ' млн ₽'
  if (rubles >= 1_000) return (rubles / 1_000).toFixed(1) + ' тыс ₽'
  return rubFormat(kopecks)
}

// ── Реферальная аналитика ─────────────────────────────────────────────────
const referralStats = ref<ReferralStats | null>(null)
const referralLoading = ref(false)
const referralError = ref<string | null>(null)
const referralUpdatedAt = ref<string | null>(null)

// Раскрытые рефереры (показываем список приглашённых)
const expandedReferrerId = ref<number | null>(null)
const invitedUsers = ref<Record<number, InvitedUser[]>>({})
const invitedLoading = ref<number | null>(null)

const loadReferralStats = async () => {
  referralLoading.value = true
  referralError.value = null
  try {
    const res = await adminApi.getReferralStats()
    referralStats.value = res.data
    referralUpdatedAt.value = new Date().toISOString()
  } catch {
    referralError.value = 'Не удалось загрузить реферальную аналитику'
  } finally {
    referralLoading.value = false
  }
}

const openReferralTab = () => {
  activeTab.value = 'referrals'
  if (!referralStats.value) loadReferralStats()
}

const toggleReferrerExpand = async (referrer: TopReferrer) => {
  if (expandedReferrerId.value === referrer.userId) {
    expandedReferrerId.value = null
    return
  }
  expandedReferrerId.value = referrer.userId
  if (!invitedUsers.value[referrer.userId]) {
    invitedLoading.value = referrer.userId
    try {
      const res = await adminApi.getUserInvites(referrer.userId)
      invitedUsers.value = { ...invitedUsers.value, [referrer.userId]: res.data }
    } catch {
      invitedUsers.value = { ...invitedUsers.value, [referrer.userId]: [] }
    } finally {
      invitedLoading.value = null
    }
  }
}

// ── Заявки обратной связи ─────────────────────────────────────────────────
const tickets = ref<AdminTicketSummary[]>([])
const ticketsLoading = ref(false)
const ticketsPage = ref(0)
const ticketsTotalPages = ref(1)
const ticketsStatusFilter = ref<'OPEN' | ''>('OPEN')
const openTicketsCount = ref(0)

const selectedTicket = ref<AdminTicketDetails | null>(null)
const closeWithGift = ref(false)
const closeGiftAmount = ref<number | null>(null)
const closeLoading = ref(false)
const closeSuccess = ref<string | null>(null)
const closeError = ref<string | null>(null)

const loadTickets = async (page = 0) => {
  ticketsLoading.value = true
  try {
    const res = await adminApi.getTickets(ticketsStatusFilter.value || undefined, page, 20)
    tickets.value = res.data.content
    ticketsTotalPages.value = res.data.totalPages || 1
    ticketsPage.value = res.data.number
  } catch {
    tickets.value = []
  } finally {
    ticketsLoading.value = false
  }
}

/** Загрузить количество открытых заявок для бейджа на вкладке */
const loadOpenTicketsCount = async () => {
  try {
    const res = await adminApi.getTickets('OPEN', 0, 1)
    openTicketsCount.value = res.data.totalElements
  } catch { /* не критично */ }
}

const setTicketFilter = (f: 'OPEN' | '') => {
  ticketsStatusFilter.value = f
  loadTickets(0)
}

const openTicketsTab = () => {
  activeTab.value = 'tickets'
  loadTickets(0)
  loadOpenTicketsCount()
}

const openTicketDetails = async (id: number) => {
  closeSuccess.value = null
  closeError.value = null
  closeWithGift.value = false
  closeGiftAmount.value = null
  try {
    const res = await adminApi.getTicket(id)
    selectedTicket.value = res.data
  } catch { /* ignore */ }
}

const closeTicket = async () => {
  if (!selectedTicket.value) return
  closeLoading.value = true
  closeSuccess.value = null
  closeError.value = null
  try {
    const gift = closeWithGift.value ? closeGiftAmount.value : null
    await adminApi.closeTicket(selectedTicket.value.id, gift)
    // Перезагружаем детали и список
    const res = await adminApi.getTicket(selectedTicket.value.id)
    selectedTicket.value = res.data
    closeSuccess.value = gift && gift > 0
      ? `Заявка закрыта, пользователю подарено ${gift} знаков`
      : 'Заявка закрыта'
    loadTickets(ticketsPage.value)
    loadOpenTicketsCount()
  } catch (e: any) {
    closeError.value = e.response?.data?.message || 'Ошибка при закрытии заявки'
  } finally {
    closeLoading.value = false
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
.tab-badge--warn { background: #f59e0b; }

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
.referrer-name { color: #a5b4fc; }

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

/* ── Tickets tab ── */
.badge-open   { background: rgba(250,204,21,0.15); color: #fde68a; }
.badge-closed { background: rgba(148,163,184,0.1); color: #64748b; }

.ticket-preview {
  max-width: 320px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #94a3b8;
  font-size: 13px;
}
.ticket-full-text {
  font-size: 14px;
  line-height: 1.65;
  color: #cbd5e1;
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 12px 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.tickets-filter {
  display: flex;
  gap: 6px;
}
.filter-btn {
  background: #1e293b;
  border: 1px solid #334155;
  color: #64748b;
  border-radius: 6px;
  padding: 6px 14px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s;
}
.filter-btn:hover { color: #e2e8f0; }
.filter-btn.active {
  background: rgba(99,102,241,0.12);
  border-color: #6366f1;
  color: #a5b4fc;
}

/* ── Overlay ── */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 40;
}

/* ── Reports tab ── */
.reports-wrap {
  max-width: 900px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.reports-toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}
.reports-updated {
  font-size: 12px;
  color: #475569;
}
.reports-empty {
  text-align: center;
  color: #475569;
  font-size: 14px;
  padding: 40px;
}
.report-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.report-group-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #64748b;
}
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 12px;
}
.metric-card {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 10px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.metric-card.metric-accent {
  border-color: rgba(99,102,241,0.4);
  background: rgba(99,102,241,0.07);
}
.metric-card.metric-highlight {
  border-color: rgba(34,197,94,0.35);
  background: rgba(34,197,94,0.06);
}
.metric-value {
  font-size: 22px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.2;
}
.metric-label {
  font-size: 12px;
  color: #64748b;
  line-height: 1.3;
}

/* ── Referral tab ── */
.ref-table-wrap { overflow-x: auto; }
.ref-table {
  width: 100%; border-collapse: collapse; font-size: 13px;
}
.ref-table thead th {
  text-align: left; color: #64748b; font-weight: 500;
  font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em;
  padding: 8px 10px; border-bottom: 1px solid #1e293b;
}
.ref-table thead th.num { text-align: right; }
.ref-table tbody tr { border-bottom: 1px solid #1e293b; }
.ref-table tbody tr:hover { background: #1e293b; }
.ref-table td { padding: 10px 10px; color: #cbd5e1; }
.ref-table td.num { text-align: right; }
.ref-table td.bold { font-weight: 700; color: #f1f5f9; }
.src-code { font-family: monospace; color: #94a3b8; font-size: 12px; }

.conv-badge {
  display: inline-block; padding: 2px 8px; border-radius: 999px;
  font-size: 11px; font-weight: 600;
}
.conv-high { background: rgba(34,197,94,0.15); color: #86efac; }
.conv-mid  { background: rgba(250,204,21,0.15); color: #fde68a; }
.conv-low  { background: rgba(148,163,184,0.1); color: #64748b; }

.referrer-list { display: flex; flex-direction: column; gap: 8px; }
.referrer-card {
  background: #1e293b; border: 1px solid #334155; border-radius: 10px; overflow: hidden;
}
.referrer-row {
  display: flex; align-items: center; gap: 12px;
  padding: 14px 16px; cursor: pointer; transition: background 0.15s;
}
.referrer-row:hover { background: #263548; }
.referrer-rank {
  width: 28px; text-align: center; font-size: 12px;
  font-weight: 700; color: #6366f1; flex-shrink: 0;
}
.referrer-info { flex: 1; min-width: 0; }
.referrer-name { font-size: 14px; font-weight: 600; color: #f1f5f9; }
.referrer-username { font-size: 12px; color: #64748b; font-weight: 400; margin-left: 4px; }
.referrer-tid { font-size: 11px; color: #475569; font-family: monospace; margin-top: 2px; }
.referrer-count { text-align: center; flex-shrink: 0; }
.referrer-count-val { display: block; font-size: 20px; font-weight: 700; color: #a5b4fc; line-height: 1; }
.referrer-count-label { font-size: 10px; color: #475569; }
.referrer-toggle { color: #475569; font-size: 12px; flex-shrink: 0; width: 16px; text-align: center; }

.invited-list {
  border-top: 1px solid #334155;
  background: rgba(0,0,0,0.15);
  padding: 8px 0;
}
.invited-loading { padding: 10px 16px; font-size: 13px; color: #475569; }
.invited-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px 8px 56px; font-size: 13px;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.invited-row:last-child { border-bottom: none; }
.invited-name { color: #cbd5e1; }
.invited-date { color: #475569; font-size: 11px; white-space: nowrap; }

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

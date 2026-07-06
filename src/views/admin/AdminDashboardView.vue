<template>
  <div class="dashboard">

    <!-- ── Шапка ─────────────────────────────────────────────── -->
    <header class="dash-header">
      <div class="dash-header-left">
        <h1>🔮 Админ-панель</h1>
        <span v-if="!isAdmin" class="role-badge">👁 Режим просмотра</span>
      </div>
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
        v-if="isAdmin"
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
      <button
        class="tab"
        :class="{ active: activeTab === 'range' }"
        @click="activeTab = 'range'"
      >📅 Диапазон</button>
      <button
        v-if="isAdmin"
        class="tab"
        :class="{ active: activeTab === 'prices' }"
        @click="openPricesTab"
      >⚙️ Цены</button>
      <button
        class="tab"
        :class="{ active: activeTab === 'sensitive' }"
        @click="openSensitiveTab"
      >🚫 Блокировки</button>
      <button
        v-if="isAdmin"
        class="tab"
        :class="{ active: activeTab === 'payments' }"
        @click="openPaymentsTab"
      >💳 Транзакции</button>
    </div>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: ПОЛЬЗОВАТЕЛИ
    ══════════════════════════════════════════════════════════ -->
    <template v-if="activeTab === 'users'">

      <!-- Поиск + кнопки -->
      <div class="search-bar">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Telegram ID или @username..."
          @input="onSearchInput"
        />
        <button
          v-if="!isDefaultSort"
          class="btn-reset-sort"
          @click="resetSort"
          title="Вернуть сортировку по умолчанию (дата регистрации ↓)"
        >
          ↺ Сбросить сортировку
        </button>
        <button
          class="btn-toggle-inactive"
          :class="{ active: hideInactive }"
          @click="toggleHideInactive"
          title="Скрыть пользователей без действий или с одним визитом"
        >
          {{ hideInactive ? '👁️ Показать всех' : '🙈 Скрыть неактивных' }}
        </button>
        <select
          v-model="selectedSource"
          class="source-select"
          @change="onSourceChange"
          title="Фильтр по источнику регистрации"
        >
          <option :value="null">Все источники</option>
          <option value="__organic__">Без источника (органика)</option>
          <option v-for="src in availableSources" :key="src" :value="src">{{ src }}</option>
        </select>
        <button
          v-if="selectedIds.size > 0 && isAdmin"
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
              <th class="th-sortable" @click="setSort('username')">
                Username <span class="sort-icon">{{ sortIcon('username') }}</span>
              </th>
              <th class="th-sortable" @click="setSort('firstName')">
                Имя <span class="sort-icon">{{ sortIcon('firstName') }}</span>
              </th>
              <th class="th-sortable" @click="setSort('createdAt')">
                Регистрация <span class="sort-icon">{{ sortIcon('createdAt') }}</span>
              </th>
              <th class="th-sortable" @click="setSort('lastActiveAt')">
                Активен <span class="sort-icon">{{ sortIcon('lastActiveAt') }}</span>
              </th>
              <th class="th-sortable" @click="setSort('visitCount')">
                Визитов <span class="sort-icon">{{ sortIcon('visitCount') }}</span>
              </th>
              <th class="th-sortable" @click="setSort('totalActionsCount')">
                Действий <span class="sort-icon">{{ sortIcon('totalActionsCount') }}</span>
              </th>
              <th class="th-sortable" @click="setSort('totalSpent')">
                Потрачено знаков <span class="sort-icon">{{ sortIcon('totalSpent') }}</span>
              </th>
              <th>Источник</th>
              <th>Статус</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="12" class="loading-row">Загрузка...</td>
            </tr>
            <tr v-else-if="users.length === 0">
              <td colspan="12" class="empty-row">Пользователи не найдены</td>
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
              <td @click="openDetails(user.id)">
                {{ user.firstName || '—' }}
                <span v-if="user.premium" class="premium-star" title="Telegram Premium">⭐</span>
              </td>
              <td @click="openDetails(user.id)">{{ formatDate(user.createdAt) }}</td>
              <td @click="openDetails(user.id)">{{ user.lastActiveAt ? formatDate(user.lastActiveAt) : '—' }}</td>
              <td @click="openDetails(user.id)" class="mono visit-count">{{ user.visitCount }}</td>
              <td @click="openDetails(user.id)" class="mono visit-count">{{ user.totalActionsCount }}</td>
              <td @click="openDetails(user.id)" class="mono visit-count">{{ user.totalSpent }}</td>
              <td @click="openDetails(user.id)" class="source-cell">
                <span v-if="user.referralSource" class="source-badge" :title="user.referralSource">
                  {{ user.referralSource.startsWith('ref_') ? '🔗 Реферал' : user.referralSource }}
                </span>
                <span v-else class="source-badge source-badge--organic">органика</span>
              </td>
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
            <template v-else>
              <button
                class="bc-recipient-btn"
                :class="{ active: broadcastTarget === 'all' }"
                @click="broadcastTarget = 'all'"
              >Всем зарегистрированным пользователям</button>
              <button
                class="bc-recipient-btn"
                :class="{ active: broadcastTarget === 'admins' }"
                @click="broadcastTarget = 'admins'"
              >👤 Только администраторам</button>
              <button
                class="bc-recipient-btn"
                :class="{ active: broadcastTarget === 'inactive' }"
                @click="broadcastTarget = 'inactive'"
              >😴 Неактивированным — 0 действий{{ segmentCounts ? ` (${segmentCounts.inactive})` : '' }}</button>
            </template>
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
          <h3 class="bc-label">
            Текст сообщения
            <span class="bc-hint">(Markdown) — используйте <code class="bc-code">{name}</code> для имени получателя</span>
          </h3>
          <textarea
            v-model="broadcastMessage"
            class="bc-textarea"
            rows="6"
            placeholder="Введите текст сообщения... Используйте {name} для персонализации"
            @input="activeTemplate = 'custom'"
          />
          <div class="char-count" :class="{ warn: broadcastMessage.length > 3800 }">
            {{ broadcastMessage.length }} / 4096
          </div>
        </section>

        <!-- Фото -->
        <section class="bc-section">
          <h3 class="bc-label">Фото <span class="bc-hint">(необязательно)</span></h3>
          <label class="bc-file-label">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              class="bc-file-input"
              @change="onPhotoSelected"
            />
            <span class="bc-file-btn">📎 Выбрать изображение</span>
            <span v-if="broadcastPhoto" class="bc-file-name">{{ broadcastPhoto.name }}</span>
            <span v-else class="bc-file-hint">Файл не выбран</span>
          </label>
          <!-- Превью выбранного фото -->
          <div v-if="broadcastPhotoPreview" class="bc-photo-preview">
            <img :src="broadcastPhotoPreview" alt="Превью" />
            <button class="bc-photo-remove" @click="removePhoto">✕</button>
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
            <span v-else-if="broadcastTarget === 'admins'">📣 Отправить администраторам</span>
            <span v-else-if="broadcastTarget === 'inactive'">📣 Отправить неактивированным{{ segmentCounts ? ` (${segmentCounts.inactive})` : '' }}</span>
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
          <select
            v-model="reportsSource"
            class="source-select"
            @change="loadReports"
            title="Фильтр по источнику регистрации"
          >
            <option :value="null">Все источники</option>
            <option value="__organic__">Без источника (органика)</option>
            <option v-for="src in availableSources" :key="src" :value="src">{{ src }}</option>
          </select>
          <button class="btn-ghost" :disabled="reportsLoading" @click="loadReports">
            {{ reportsLoading ? '⏳ Загрузка...' : '🔄 Обновить' }}
          </button>
        </div>

        <div v-if="reportsSource" class="source-filter-badge">
          Фильтр: <strong>{{ sourceLabel(reportsSource) }}</strong>
          <button class="source-filter-clear" @click="reportsSource = null; loadReports()">✕</button>
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

          <!-- Совместимость -->
          <div class="report-group">
            <h3 class="report-group-title">💞 Совместимость</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(reports.compatibility.total) }}</div>
                <div class="metric-label">Всего расчётов</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.compatibility.last7Days) }}</div>
                <div class="metric-label">За 7 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.compatibility.last30Days) }}</div>
                <div class="metric-label">За 30 дней</div>
              </div>
            </div>
          </div>

          <!-- Действия за 24 часа -->
          <div class="report-group">
            <h3 class="report-group-title">⚡ Действия за 24 часа</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(reports.actionsToday.total) }}</div>
                <div class="metric-label">Всего действий</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.threeCard) }}</div>
                <div class="metric-label">Расклад 3 карты</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.horseshoe) }}</div>
                <div class="metric-label">Подкова</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.celticCross) }}</div>
                <div class="metric-label">Кельтский крест</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.compatibility) }}</div>
                <div class="metric-label">Совместимость</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.numerology) }}</div>
                <div class="metric-label">Нумерология</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.dailyCard) }}</div>
                <div class="metric-label">Карта дня</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.numerologyWeek) }}</div>
                <div class="metric-label">Расклад на неделю</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.actionsToday.dream) }}</div>
                <div class="metric-label">Разбор сна</div>
              </div>
            </div>
          </div>

          <!-- Повторные посещения -->
          <div class="report-group">
            <h3 class="report-group-title">🔄 Повторные посещения</h3>
            <div class="metrics-grid">
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.returningUsers.returning1Day) }}</div>
                <div class="metric-label">Вернулись за 24ч</div>
              </div>
              <div class="metric-card metric-highlight">
                <div class="metric-value">{{ fmt(reports.returningUsers.returning7Days) }}</div>
                <div class="metric-label">Вернулись за 7 дней</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(reports.returningUsers.returning30Days) }}</div>
                <div class="metric-label">Вернулись за 30 дней</div>
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
                    <th class="num">Открытий</th>
                    <th class="num">Новых</th>
                    <th class="num">Доход, ₽</th>
                    <th class="num">% от ₽</th>
                    <th class="num">Доход, ★</th>
                    <th class="num">% от ★</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="src in referralStats.marketing" :key="src.source">
                    <td class="src-code">{{ src.source }}</td>
                    <td class="num">{{ fmt(src.appOpens) }}</td>
                    <td class="num bold">{{ fmt(src.newUsers) }}</td>
                    <td class="num">{{ rubValueFormat(src.revenueRub) }}</td>
                    <td class="num">
                      <span class="conv-badge" :class="convClass(src.pctRubRevenue)">
                        {{ src.pctRubRevenue }}%
                      </span>
                    </td>
                    <td class="num">{{ fmt(src.revenueStars) }} ★</td>
                    <td class="num">
                      <span class="conv-badge" :class="convClass(src.pctStarsRevenue)">
                        {{ src.pctStarsRevenue }}%
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

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: ОТЧЁТ ЗА ДИАПАЗОН
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'range'">
      <div class="reports-wrap">

        <!-- Выбор диапазона -->
        <div class="range-toolbar">
          <div class="range-inputs">
            <div class="range-field">
              <label class="range-label">С</label>
              <input
                v-model="rangeFrom"
                type="datetime-local"
                step="1"
                class="range-date-input"
              />
            </div>
            <div class="range-field">
              <label class="range-label">По</label>
              <input
                v-model="rangeTo"
                type="datetime-local"
                step="1"
                class="range-date-input"
              />
            </div>
            <div class="range-field">
              <label class="range-label">Источник</label>
              <select v-model="rangeSource" class="source-select">
                <option :value="null">Все</option>
                <option value="__organic__">Без источника</option>
                <option v-for="src in availableSources" :key="src" :value="src">{{ src }}</option>
              </select>
            </div>
          </div>
          <button
            class="btn-primary"
            :disabled="rangeLoading || !rangeFrom || !rangeTo"
            @click="loadRangeReport"
          >
            {{ rangeLoading ? '⏳ Загрузка...' : '📊 Сформировать' }}
          </button>
        </div>

        <p v-if="rangeError" class="error-msg">{{ rangeError }}</p>

        <template v-if="rangeReport">

          <!-- Заголовок периода -->
          <div class="range-period-title">
            Период: {{ formatDateShort(rangeReport.from) }} — {{ formatDateShort(rangeReport.to) }}
          </div>

          <!-- Новые пользователи -->
          <div class="report-group">
            <h3 class="report-group-title">👤 Новые пользователи</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(rangeReport.newUsers) }}</div>
                <div class="metric-label">Зарегистрировалось за период</div>
              </div>
            </div>
          </div>

          <!-- Гадания -->
          <div class="report-group">
            <h3 class="report-group-title">🔮 Гадания</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(rangeReport.fortunes.total) }}</div>
                <div class="metric-label">Всего гаданий</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.fortunes.threeCard) }}</div>
                <div class="metric-label">Три карты</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.fortunes.horseshoe) }}</div>
                <div class="metric-label">Подкова</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.fortunes.celticCross) }}</div>
                <div class="metric-label">Кельтский крест</div>
              </div>
            </div>
          </div>

          <!-- Совместимость -->
          <div class="report-group">
            <h3 class="report-group-title">💞 Совместимость</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(rangeReport.compatibility) }}</div>
                <div class="metric-label">Расчётов за период</div>
              </div>
            </div>
          </div>

          <!-- Действия -->
          <div class="report-group">
            <h3 class="report-group-title">⚡ Действия</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(rangeReport.actions.total) }}</div>
                <div class="metric-label">Всего действий</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.actions.compatibility) }}</div>
                <div class="metric-label">Совместимость</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.actions.threeCard) }}</div>
                <div class="metric-label">Три карты</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.actions.horseshoe) }}</div>
                <div class="metric-label">Подкова</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.actions.celticCross) }}</div>
                <div class="metric-label">Кельтский крест</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.actions.numerologyWeek) }}</div>
                <div class="metric-label">Расклад на неделю</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.actions.dream) }}</div>
                <div class="metric-label">Разбор сна</div>
              </div>
            </div>
          </div>

          <!-- Повторные посещения -->
          <div class="report-group">
            <h3 class="report-group-title">🔄 Повторные посещения</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-highlight">
                <div class="metric-value">{{ fmt(rangeReport.returningUsers) }}</div>
                <div class="metric-label">Пользователей вернулось более 1 раза</div>
              </div>
            </div>
          </div>

          <!-- Платежи — Рубли -->
          <div class="report-group">
            <h3 class="report-group-title">💳 Платежи — Рубли (Robokassa)</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ rubFormatTotal(rangeReport.payments.rubKopecks) }}</div>
                <div class="metric-label">Выручка за период</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.payments.rubTransactions) }}</div>
                <div class="metric-label">Транзакций</div>
              </div>
            </div>
          </div>

          <!-- Платежи — Stars -->
          <div class="report-group">
            <h3 class="report-group-title">⭐ Платежи — Telegram Stars</h3>
            <div class="metrics-grid">
              <div class="metric-card metric-accent">
                <div class="metric-value">{{ fmt(rangeReport.payments.stars) }} ★</div>
                <div class="metric-label">Stars за период</div>
              </div>
              <div class="metric-card">
                <div class="metric-value">{{ fmt(rangeReport.payments.starsTransactions) }}</div>
                <div class="metric-label">Транзакций</div>
              </div>
            </div>
          </div>

        </template>

        <div v-else-if="!rangeLoading" class="reports-empty">
          Выберите диапазон дат и нажмите «Сформировать»
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: ЦЕНЫ НА ФУНКЦИИ
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'prices'">
      <div class="reports-wrap">

        <div class="reports-toolbar">
          <span class="reports-updated">Стоимость указана в знаках. Изменения применяются мгновенно, без деплоя.</span>
          <button class="btn-ghost" :disabled="pricesLoading" @click="loadFeatureCosts">
            {{ pricesLoading ? '⏳ Загрузка...' : '🔄 Обновить' }}
          </button>
        </div>

        <p v-if="pricesError" class="error-msg">{{ pricesError }}</p>

        <template v-if="featureCosts">
          <div class="report-group">
            <h3 class="report-group-title">🔮 Расклады Таро</h3>
            <div class="prices-form">
              <div class="price-field">
                <label class="price-label">Три карты</label>
                <input v-model.number="featureCosts.threeCard" type="number" min="1" class="price-input" />
              </div>
              <div class="price-field">
                <label class="price-label">Подкова</label>
                <input v-model.number="featureCosts.horseshoe" type="number" min="1" class="price-input" />
              </div>
              <div class="price-field">
                <label class="price-label">Кельтский крест</label>
                <input v-model.number="featureCosts.celticCross" type="number" min="1" class="price-input" />
              </div>
            </div>
          </div>

          <div class="report-group">
            <h3 class="report-group-title">💞 Совместимость и нумерология</h3>
            <div class="prices-form">
              <div class="price-field">
                <label class="price-label">Разблокировка совместимости</label>
                <input v-model.number="featureCosts.compatibilityUnlock" type="number" min="1" class="price-input" />
              </div>
              <div class="price-field">
                <label class="price-label">Расклад на неделю</label>
                <input v-model.number="featureCosts.numerologyWeek" type="number" min="1" class="price-input" />
              </div>
            </div>
          </div>

          <div class="report-group">
            <h3 class="report-group-title">🌙 Сонник</h3>
            <div class="prices-form">
              <div class="price-field">
                <label class="price-label">Разбор сна</label>
                <input v-model.number="featureCosts.dream" type="number" min="1" class="price-input" />
              </div>
            </div>
          </div>

          <div class="report-group">
            <button
              class="btn-primary"
              :disabled="pricesSaving"
              @click="saveFeatureCosts"
            >
              {{ pricesSaving ? '⏳ Сохранение...' : '💾 Сохранить цены' }}
            </button>
            <p v-if="pricesSuccess" class="success-msg">{{ pricesSuccess }}</p>
            <p v-if="pricesSaveError" class="error-msg">{{ pricesSaveError }}</p>
          </div>

          <!-- ── Символы снов (чипы Сонника) ─────────────────────────── -->
          <div class="report-group">
            <h3 class="report-group-title">🌙 Символы снов (чипы Сонника)</h3>
            <p class="dream-symbols-hint">
              Чипы «Частые символы в снах» на экране Сонника. Подсказка — классическое значение символа,
              она уходит в промпт AI. Выключенные символы не видны пользователям, но остаются в старых разборах.
            </p>

            <p v-if="dreamSymbolsError" class="error-msg">{{ dreamSymbolsError }}</p>
            <p v-if="dreamSymbolsSuccess" class="success-msg">{{ dreamSymbolsSuccess }}</p>

            <div v-if="dreamSymbolsLoading" class="reports-empty">⏳ Загрузка символов...</div>

            <table v-else-if="dreamSymbols.length" class="dream-symbols-table">
              <thead>
                <tr>
                  <th style="width:70px">Эмодзи</th>
                  <th style="width:150px">Название</th>
                  <th>Подсказка для AI</th>
                  <th style="width:80px">Порядок</th>
                  <th style="width:180px">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="s in dreamSymbols" :key="s.id ?? s.name" :class="{ 'symbol-inactive': !s.isActive }">
                  <td><input v-model="s.emoji" class="price-input symbol-input" /></td>
                  <td><input v-model="s.name" class="price-input symbol-input" /></td>
                  <td><input v-model="s.promptHint" class="price-input symbol-input symbol-input--wide" placeholder="—" /></td>
                  <td><input v-model.number="s.sortOrder" type="number" class="price-input symbol-input" /></td>
                  <td class="symbol-actions">
                    <button class="btn-ghost btn-small" @click="saveDreamSymbol(s)">💾</button>
                    <button class="btn-ghost btn-small" :title="s.isActive ? 'Выключить' : 'Включить'" @click="toggleDreamSymbol(s)">
                      {{ s.isActive ? '👁 Вкл' : '🚫 Выкл' }}
                    </button>
                    <button class="btn-ghost btn-small btn-danger" @click="removeDreamSymbol(s)">🗑</button>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Новый символ -->
            <div class="dream-symbol-new">
              <input v-model="newSymbol.emoji" class="price-input symbol-input" placeholder="🌙" style="width:70px" />
              <input v-model="newSymbol.name" class="price-input symbol-input" placeholder="Название" style="width:150px" />
              <input v-model="newSymbol.promptHint" class="price-input symbol-input symbol-input--wide" placeholder="Подсказка для AI (опционально)" />
              <input v-model.number="newSymbol.sortOrder" type="number" class="price-input symbol-input" placeholder="Порядок" style="width:80px" />
              <button class="btn-primary btn-small" @click="createDreamSymbol">➕ Добавить</button>
            </div>
          </div>
        </template>

        <div v-else-if="!pricesLoading" class="reports-empty">
          Нажмите «Обновить» для загрузки текущих цен
        </div>

      </div>
    </template>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: БЛОКИРОВКИ ЧУВСТВИТЕЛЬНОГО КОНТЕНТА
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'sensitive'">
      <div class="reports-wrap">

        <div class="reports-toolbar">
          <div class="tickets-filter" style="flex-wrap: wrap;">
            <button
              class="filter-btn"
              :class="{ active: sensitiveCategory === '' }"
              @click="setSensitiveCategory('')"
            >Все</button>
            <button
              v-for="cat in sensitiveCategories"
              :key="cat.value"
              class="filter-btn"
              :class="{ active: sensitiveCategory === cat.value }"
              @click="setSensitiveCategory(cat.value)"
            >{{ cat.label }}</button>
          </div>
          <button class="btn-ghost" :disabled="sensitiveLoading" @click="loadSensitiveQueries(0)">
            {{ sensitiveLoading ? '⏳' : '🔄 Обновить' }}
          </button>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Дата</th>
                <th>Пользователь</th>
                <th>Категория</th>
                <th>Вопрос</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sensitiveLoading">
                <td colspan="4" class="td-loading">⏳ Загрузка...</td>
              </tr>
              <tr v-else-if="sensitiveEntries.length === 0">
                <td colspan="4" class="td-empty">Нет заблокированных запросов</td>
              </tr>
              <tr v-for="entry in sensitiveEntries" :key="entry.id">
                <td class="td-date">{{ formatDate(entry.detectedAt) }}</td>
                <td>
                  <span
                    class="user-link"
                    @click="openUserById(entry.userId)"
                  >{{ entry.firstName || '' }}{{ entry.username ? ' (@' + entry.username + ')' : '' || 'id=' + entry.userId }}</span>
                </td>
                <td>
                  <span class="sensitive-badge" :class="'sensitive-badge--' + entry.category.toLowerCase()">
                    {{ sensitiveCategoryLabel(entry.category) }}
                  </span>
                </td>
                <td>
                  <span
                    class="sensitive-question"
                    :class="{ expanded: expandedSensitiveId === entry.id }"
                    @click="expandedSensitiveId = expandedSensitiveId === entry.id ? null : entry.id"
                  >{{ entry.question }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <button :disabled="sensitivePage === 0" @click="loadSensitiveQueries(sensitivePage - 1)">← Назад</button>
          <span>Страница {{ sensitivePage + 1 }} из {{ sensitiveTotalPages }}</span>
          <button :disabled="sensitivePage >= sensitiveTotalPages - 1" @click="loadSensitiveQueries(sensitivePage + 1)">Вперёд →</button>
        </div>

      </div><!-- /reports-wrap sensitive -->
    </template>

    <!-- ══════════════════════════════════════════════════════════
         ВКЛАДКА: ТРАНЗАКЦИИ
    ══════════════════════════════════════════════════════════ -->
    <template v-else-if="activeTab === 'payments'">
      <div class="reports-wrap">

        <!-- Фильтры -->
        <div class="reports-toolbar">
          <div class="tickets-filter">
            <button
              class="filter-btn"
              :class="{ active: txStatusFilter === '' }"
              @click="setTxStatus('')"
            >Все</button>
            <button
              v-for="s in txStatuses"
              :key="s.value"
              class="filter-btn"
              :class="{ active: txStatusFilter === s.value }"
              @click="setTxStatus(s.value)"
            >{{ s.label }}</button>
          </div>
          <button class="btn-ghost" :disabled="txLoading" @click="loadTransactions(0)">
            {{ txLoading ? '⏳' : '🔄 Обновить' }}
          </button>
        </div>

        <div class="range-toolbar">
          <div class="range-inputs">
            <div class="range-field">
              <label class="range-label">Платёжная система</label>
              <select v-model="txProviderFilter" class="source-select" @change="loadTransactions(0)">
                <option value="">Все</option>
                <option v-for="p in txProviders" :key="p.value" :value="p.value">{{ p.label }}</option>
              </select>
            </div>
            <div class="range-field">
              <label class="range-label">Пользователь</label>
              <input
                v-model="txSearch"
                type="text"
                placeholder="Telegram ID или @username..."
                class="range-date-input"
                @input="onTxSearchInput"
              />
            </div>
            <div class="range-field">
              <label class="range-label">С</label>
              <input v-model="txFrom" type="datetime-local" step="1" class="range-date-input" @change="loadTransactions(0)" />
            </div>
            <div class="range-field">
              <label class="range-label">По</label>
              <input v-model="txTo" type="datetime-local" step="1" class="range-date-input" @change="loadTransactions(0)" />
            </div>
            <button v-if="txHasFilters" class="btn-reset-sort" @click="resetTxFilters">↺ Сбросить фильтры</button>
          </div>
        </div>

        <!-- Таблица -->
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Пользователь</th>
                <th>Продукт</th>
                <th>Знаков</th>
                <th>Система</th>
                <th>Сумма</th>
                <th>Статус</th>
                <th>Создана</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="txLoading">
                <td colspan="8" class="loading-row">Загрузка...</td>
              </tr>
              <tr v-else-if="transactions.length === 0">
                <td colspan="8" class="empty-row">Транзакции не найдены</td>
              </tr>
              <tr
                v-for="tx in transactions"
                :key="tx.id"
                class="user-row"
                @click="openTransactionDetails(tx.id)"
              >
                <td class="mono">#{{ tx.id }}</td>
                <td>
                  {{ tx.firstName || '—' }}
                  <span v-if="tx.username" class="referrer-username">@{{ tx.username }}</span>
                </td>
                <td>{{ tx.productName }}</td>
                <td class="mono visit-count">{{ tx.creditsToGrant }}</td>
                <td>{{ providerLabel(tx.provider) }}</td>
                <td class="mono">{{ formatAmount(tx.amountMinor, tx.currency) }}</td>
                <td>
                  <span class="badge" :class="'tx-badge--' + tx.status.toLowerCase()">
                    {{ txStatusLabel(tx.status) }}
                  </span>
                </td>
                <td>{{ formatDate(tx.createdAt) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Пагинация -->
        <div class="pagination">
          <button :disabled="txPage === 0" @click="loadTransactions(txPage - 1)">← Назад</button>
          <span>Страница {{ txPage + 1 }} из {{ txTotalPages }}</span>
          <button :disabled="txPage >= txTotalPages - 1" @click="loadTransactions(txPage + 1)">Вперёд →</button>
        </div>

      </div>
    </template>

    <!-- ── Детали транзакции (боковая панель) ─────────────────── -->
    <Transition name="slide-panel">
      <div v-if="selectedTransaction" class="side-panel">
        <div class="panel-header">
          <h2>Транзакция #{{ selectedTransaction.payment.id }}</h2>
          <button class="btn-ghost" @click="selectedTransaction = null">✕</button>
        </div>

        <div class="panel-body">

          <!-- Пользователь -->
          <section class="info-section">
            <h3>Пользователь</h3>
            <div class="info-row">
              <span class="label">Имя</span>
              <span>{{ selectedTransaction.payment.firstName || '—' }}</span>
            </div>
            <div class="info-row" v-if="selectedTransaction.payment.username">
              <span class="label">Username</span>
              <span>@{{ selectedTransaction.payment.username }}</span>
            </div>
            <div class="info-row">
              <span class="label">Telegram ID</span>
              <span class="mono">{{ selectedTransaction.payment.telegramId ?? '—' }}</span>
            </div>
            <button class="btn-ghost-sm" @click="openDetails(selectedTransaction.payment.userId); selectedTransaction = null">
              Открыть карточку пользователя
            </button>
          </section>

          <!-- Платёж -->
          <section class="info-section">
            <h3>Платёж</h3>
            <div class="info-row">
              <span class="label">Продукт</span>
              <span>{{ selectedTransaction.payment.productName }} ({{ selectedTransaction.payment.productCode }})</span>
            </div>
            <div class="info-row">
              <span class="label">Запрошено знаков</span>
              <span>{{ selectedTransaction.payment.creditsToGrant }}</span>
            </div>
            <div class="info-row">
              <span class="label">Платёжная система</span>
              <span>{{ providerLabel(selectedTransaction.payment.provider) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Сумма</span>
              <span>{{ formatAmount(selectedTransaction.payment.amountMinor, selectedTransaction.payment.currency) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Статус</span>
              <span class="badge" :class="'tx-badge--' + selectedTransaction.payment.status.toLowerCase()">
                {{ txStatusLabel(selectedTransaction.payment.status) }}
              </span>
            </div>
            <div class="info-row" v-if="selectedTransaction.payment.providerPaymentId">
              <span class="label">ID платежа у провайдера</span>
              <span class="mono">{{ selectedTransaction.payment.providerPaymentId }}</span>
            </div>
            <div class="info-row">
              <span class="label">Создана</span>
              <span>{{ formatDate(selectedTransaction.payment.createdAt) }}</span>
            </div>
            <div class="info-row">
              <span class="label">Обновлена</span>
              <span>{{ formatDate(selectedTransaction.payment.updatedAt) }}</span>
            </div>
          </section>

          <!-- Подтверждение вебхуком -->
          <section class="info-section">
            <h3>Подтверждение от платёжной системы</h3>
            <template v-if="selectedTransaction.payment.provider === 'TELEGRAM_STARS'">
              <p class="reports-empty" style="padding:8px 0">
                Telegram Stars подтверждаются синхронно через Bot API — отдельного webhook-лога для этого провайдера нет.
                Статус платежа выше уже отражает фактический результат.
              </p>
            </template>
            <template v-else-if="selectedTransaction.webhook">
              <div class="info-row">
                <span class="label">Статус обработки</span>
                <span class="badge" :class="'tx-badge--' + (selectedTransaction.webhook.status === 'PROCESSED' ? 'succeeded' : selectedTransaction.webhook.status === 'FAILED' ? 'failed' : 'pending')">
                  {{ webhookStatusLabel(selectedTransaction.webhook.status) }}
                </span>
              </div>
              <div class="info-row">
                <span class="label">Получен</span>
                <span>{{ formatDate(selectedTransaction.webhook.receivedAt) }}</span>
              </div>
              <div class="info-row" v-if="selectedTransaction.webhook.processedAt">
                <span class="label">Обработан</span>
                <span>{{ formatDate(selectedTransaction.webhook.processedAt) }}</span>
              </div>
              <div class="info-row" v-if="selectedTransaction.webhook.errorMessage">
                <span class="label">Ошибка</span>
                <span style="color:#fca5a5">{{ selectedTransaction.webhook.errorMessage }}</span>
              </div>
              <button class="action-expand-btn" @click="showRawPayload = !showRawPayload">
                {{ showRawPayload ? '▲ Скрыть сырой payload' : '▼ Показать сырой payload' }}
              </button>
              <div v-if="showRawPayload" class="ticket-full-text mono">{{ selectedTransaction.webhook.rawPayload }}</div>
            </template>
            <template v-else>
              <p class="reports-empty" style="padding:8px 0">
                Связанный webhook не найден. Если статус платежа всё ещё PENDING — возможно, уведомление
                от провайдера ещё не пришло или не было сопоставлено автоматически.
              </p>
            </template>
          </section>

        </div>
      </div>
    </Transition>
    <div v-if="selectedTransaction" class="overlay" @click="selectedTransaction = null" />

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

          <!-- Закрытие заявки (только если открыта и пользователь — ADMIN) -->
          <section v-if="selectedTicket.status === 'OPEN' && isAdmin" class="info-section">
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
            <div class="info-row">
              <span class="label">Визитов</span>
              <span>{{ selectedUser.visitCount }}</span>
            </div>
            <div class="info-row" v-if="selectedUser.birthDate">
              <span class="label">Возраст</span>
              <span>{{ calcAge(selectedUser.birthDate) !== null ? calcAge(selectedUser.birthDate) + ' лет' : '—' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Premium</span>
              <span>
                <span v-if="selectedUser.premium" class="badge badge-premium">⭐ Premium</span>
                <span v-else class="label">—</span>
              </span>
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
          <section v-if="isAdmin" class="info-section">
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
          <section v-if="isAdmin" class="info-section">
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

          <!-- История действий (lazy) -->
          <section class="info-section">
            <h3>История действий</h3>
            <button
              v-if="!actionsLoaded"
              class="btn-ghost"
              :disabled="userActionsLoading"
              @click="loadUserActions"
            >
              {{ userActionsLoading ? '⏳ Загрузка...' : '📋 Загрузить историю' }}
            </button>
            <div v-else-if="userActions.length === 0" class="actions-empty">
              Действий не найдено
            </div>
            <div v-else class="actions-list">
              <div
                v-for="(action, idx) in userActions"
                :key="idx"
                class="action-item"
                :class="{
                  'action-item--expandable': action.interpretation,
                  'action-item--positive': action.feedbackRating === 'POSITIVE',
                  'action-item--negative': action.feedbackRating === 'NEGATIVE',
                }"
              >
                <div class="action-label">
                  {{ action.label }}
                  <span v-if="action.feedbackRating === 'POSITIVE'" class="feedback-badge feedback-badge--pos">👍</span>
                  <span v-else-if="action.feedbackRating === 'NEGATIVE'" class="feedback-badge feedback-badge--neg">👎</span>
                </div>
                <div class="action-meta">
                  <span class="action-details">
                    {{ expandedQuestions.has(idx) && action.fullDetails ? action.fullDetails : action.details }}
                  </span>
                  <span class="action-date">{{ formatDate(action.date) }}</span>
                </div>
                <!-- Разворачивание полного текста вопроса (если он был обрезан на бэке) -->
                <button
                  v-if="action.fullDetails && action.fullDetails !== action.details"
                  class="action-expand-btn"
                  @click="toggleQuestionExpand(idx)"
                >
                  {{ expandedQuestions.has(idx) ? '▲ Скрыть вопрос' : '▼ Читать вопрос полностью' }}
                </button>
                <!-- Комментарий к отрицательной оценке -->
                <div v-if="action.feedbackRating === 'NEGATIVE' && action.feedbackComment" class="feedback-comment">
                  💬 {{ action.feedbackComment }}
                </div>
                <!-- Блок интерпретации -->
                <template v-if="action.interpretation">
                  <div v-if="expandedActions.has(idx)" class="action-interpretation">
                    {{ action.interpretation }}
                  </div>
                  <button
                    class="action-expand-btn"
                    @click="toggleActionExpand(idx)"
                  >
                    {{ expandedActions.has(idx) ? '▲ Скрыть ответ' : '▼ Читать ответ' }}
                  </button>
                </template>
              </div>
            </div>
          </section>
        </div>
      </div>
    </Transition>

    <!-- Overlay для закрытия панели -->
    <div v-if="selectedUser" class="overlay" @click="selectedUser = null" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { adminApi, type AdminUserSummary, type AdminUserDetails, type AdminReports, type RangeReport, type ReferralStats, type TopReferrer, type InvitedUser, type AdminTicketSummary, type AdminTicketDetails, type UserAction, type FeatureCosts, type AdminDreamSymbol, type SensitiveQueryLogEntry, type SensitiveCategory, type TransactionSummary, type TransactionDetails, type TransactionStatus, type TransactionProvider } from '@/utils/adminApi'

const router = useRouter()

// ── Роль текущего пользователя ────────────────────────────────────────────
// Загружается при монтировании из /api/admin/auth/me
// ADMIN — полный доступ, MODERATOR — только чтение
const userRole = ref<'ADMIN' | 'MODERATOR'>('ADMIN')
const isAdmin = computed(() => userRole.value === 'ADMIN')

// ── Вкладки ───────────────────────────────────────────────────────────────
const activeTab = ref<'users' | 'broadcast' | 'reports' | 'referrals' | 'tickets' | 'range' | 'prices' | 'sensitive' | 'payments'>('users')

// ── Список пользователей ──────────────────────────────────────────────────
const users = ref<AdminUserSummary[]>([])
const loading = ref(false)
const currentPage = ref(0)
const totalPages = ref(1)
const searchQuery = ref('')
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ── Сортировка ────────────────────────────────────────────────────────────
const sortBy = ref('createdAt')
const sortDir = ref<'asc' | 'desc'>('desc')

const isDefaultSort = computed(() => sortBy.value === 'createdAt' && sortDir.value === 'desc')

// ── Фильтр неактивных пользователей ─────────────────────────────────────────
// Неактивный = totalActionsCount === 0 ИЛИ visitCount <= 1
// (зарегистрировался, но не сделал ни одного действия / не вернулся после первого визита)
const hideInactive = ref(false)

const toggleHideInactive = () => {
  hideInactive.value = !hideInactive.value
  loadUsers(0)
}

// ── Фильтр по источнику регистрации ──────────────────────────────────────
// null = все; "__organic__" = без источника (органика); иначе — конкретный источник
const availableSources = ref<string[]>([])
const selectedSource = ref<string | null>(null)

const loadSources = async () => {
  try {
    const res = await adminApi.getSources()
    availableSources.value = res.data
  } catch {
    availableSources.value = []
  }
}

const onSourceChange = () => {
  loadUsers(0)
}

/** Человекочитаемая метка источника для дропдауна */
const sourceLabel = (src: string | null) => {
  if (!src) return 'Все источники'
  if (src === '__organic__') return 'Без источника (органика)'
  if (src.startsWith('ref_')) return '🔗 Реф. пользователь'
  return src
}

// ── Фильтр источника для вкладки "Отчёты" ────────────────────────────────
const reportsSource = ref<string | null>(null)

// ── Фильтр источника для вкладки "Диапазон" ──────────────────────────────
const rangeSource = ref<string | null>(null)

/** Переключить сортировку по полю: повторный клик — меняет направление */
const setSort = (field: string) => {
  if (sortBy.value === field) {
    sortDir.value = sortDir.value === 'desc' ? 'asc' : 'desc'
  } else {
    sortBy.value = field
    sortDir.value = 'desc'
  }
  loadUsers(0)
}

/** Иконка для заголовка: ↓ активная убывающая, ↑ активная возрастающая, ⇅ неактивная */
const sortIcon = (field: string): string => {
  if (sortBy.value !== field) return '⇅'
  return sortDir.value === 'desc' ? '↓' : '↑'
}

/** Сброс сортировки к дефолту */
const resetSort = () => {
  sortBy.value = 'createdAt'
  sortDir.value = 'desc'
  loadUsers(0)
}

const loadUsers = async (page = 0) => {
  loading.value = true
  try {
    const res = await adminApi.getUsers(
      page, 20,
      searchQuery.value || undefined,
      sortBy.value, sortDir.value,
      hideInactive.value,
      selectedSource.value,
    )
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
    // Сбрасываем историю действий при открытии нового пользователя
    userActions.value = []
    userActionsLoading.value = false
    actionsLoaded.value = false
    expandedActions.value = new Set()
    expandedQuestions.value = new Set()
  } catch {
    // ignore
  }
}

// ── История действий (lazy) ───────────────────────────────────────────────
const userActions = ref<UserAction[]>([])
const userActionsLoading = ref(false)
const actionsLoaded = ref(false)
const expandedActions = ref(new Set<number>())
const expandedQuestions = ref(new Set<number>())

const loadUserActions = async () => {
  if (!selectedUser.value) return
  userActionsLoading.value = true
  try {
    const res = await adminApi.getUserActions(selectedUser.value.id)
    userActions.value = res.data
    actionsLoaded.value = true
    expandedActions.value = new Set()
    expandedQuestions.value = new Set()
  } catch {
    userActions.value = []
    actionsLoaded.value = true
  } finally {
    userActionsLoading.value = false
  }
}

const toggleActionExpand = (idx: number) => {
  const next = new Set(expandedActions.value)
  if (next.has(idx)) {
    next.delete(idx)
  } else {
    next.add(idx)
  }
  expandedActions.value = next
}

const toggleQuestionExpand = (idx: number) => {
  const next = new Set(expandedQuestions.value)
  if (next.has(idx)) {
    next.delete(idx)
  } else {
    next.add(idx)
  }
  expandedQuestions.value = next
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
  {
    id: 'reanimation',
    name: 'Реанимация',
    icon: '😴',
    text: 'Кажется, вы ещё не задали картам свой первый вопрос...\n\nА ведь первый вопрос — обычно самый важный. Загляните: карта дня, гороскоп и нумерология ждут вас бесплатно каждый день 🌙\n\nПодарок внутри 👇',
  },
]

const activeTemplate = ref<string>('custom')
const broadcastMessage = ref('')
const broadcastPhoto = ref<File | null>(null)
const broadcastPhotoPreview = ref<string | null>(null)
const broadcastTarget = ref<'all' | 'admins' | 'inactive'>('all')
const withGift = ref(false)
const broadcastGiftAmount = ref<number | null>(null)
const broadcastLoading = ref(false)
const broadcastSuccess = ref<string | null>(null)
const broadcastError = ref<string | null>(null)

// Счётчики сегментов (сейчас только inactive — «нулевые» без единого действия).
// Подгружаются при первом открытии вкладки рассылки, чтобы кнопка сегмента
// показывала живое число получателей до отправки.
const segmentCounts = ref<{ inactive: number } | null>(null)

const loadSegmentCounts = async () => {
  try {
    const res = await adminApi.getBroadcastSegments()
    segmentCounts.value = res.data
  } catch {
    // Не критично: кнопка сегмента работает и без счётчика
  }
}

watch(activeTab, (tab) => {
  if (tab === 'broadcast' && !segmentCounts.value) loadSegmentCounts()
})

const onPhotoSelected = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  broadcastPhoto.value = file
  if (broadcastPhotoPreview.value) {
    URL.revokeObjectURL(broadcastPhotoPreview.value)
  }
  broadcastPhotoPreview.value = file ? URL.createObjectURL(file) : null
}

const removePhoto = () => {
  broadcastPhoto.value = null
  if (broadcastPhotoPreview.value) {
    URL.revokeObjectURL(broadcastPhotoPreview.value)
    broadcastPhotoPreview.value = null
  }
}

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
  const onlyAdmins = selectedIds.value.size === 0 && broadcastTarget.value === 'admins'
  const segment = selectedIds.value.size === 0 && broadcastTarget.value === 'inactive' ? 'INACTIVE' : null

  try {
    const res = await adminApi.broadcast(
      broadcastMessage.value,
      giftAmt,
      userIds,
      onlyAdmins,
      broadcastPhoto.value,
      segment,
    )
    broadcastSuccess.value = res.data.message + '. Рассылка идёт в фоне — это может занять несколько минут.'
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
    const res = await adminApi.getReports(reportsSource.value)
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

/** Рубли (уже в основной единице, не копейки) → строка с символом валюты */
const rubValueFormat = (rubles: number) => {
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

// ── Отчёт за диапазон ─────────────────────────────────────────────────────
const rangeFrom = ref('')
const rangeTo = ref('')
const rangeReport = ref<RangeReport | null>(null)
const rangeLoading = ref(false)
const rangeError = ref<string | null>(null)

const loadRangeReport = async () => {
  if (!rangeFrom.value || !rangeTo.value) return
  rangeLoading.value = true
  rangeError.value = null
  try {
    const res = await adminApi.getRangeReport(rangeFrom.value, rangeTo.value, rangeSource.value)
    rangeReport.value = res.data
  } catch (e: any) {
    rangeError.value = e.response?.data?.message || 'Не удалось загрузить отчёт'
  } finally {
    rangeLoading.value = false
  }
}

/** ISO datetime → DD.MM.YYYY HH:mm:ss для отображения периода */
const formatDateShort = (iso: string) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    timeZone: 'Europe/Moscow',
  })
}

// ── Цены платных функций ──────────────────────────────────────────────────
const featureCosts = ref<FeatureCosts | null>(null)
const pricesLoading = ref(false)
const pricesSaving = ref(false)
const pricesError = ref<string | null>(null)
const pricesSaveError = ref<string | null>(null)
const pricesSuccess = ref<string | null>(null)

const loadFeatureCosts = async () => {
  pricesLoading.value = true
  pricesError.value = null
  pricesSuccess.value = null
  try {
    const res = await adminApi.getFeatureCosts()
    featureCosts.value = res.data
  } catch {
    pricesError.value = 'Не удалось загрузить цены'
  } finally {
    pricesLoading.value = false
  }
}

const saveFeatureCosts = async () => {
  if (!featureCosts.value) return
  pricesSaving.value = true
  pricesSaveError.value = null
  pricesSuccess.value = null
  try {
    const res = await adminApi.updateFeatureCosts(featureCosts.value)
    featureCosts.value = res.data
    pricesSuccess.value = 'Цены обновлены'
  } catch (e: any) {
    pricesSaveError.value = e.response?.data?.message || 'Ошибка при сохранении цен'
  } finally {
    pricesSaving.value = false
  }
}

const openPricesTab = () => {
  activeTab.value = 'prices'
  if (!featureCosts.value) loadFeatureCosts()
  if (!dreamSymbols.value.length) loadDreamSymbols()
}

// ── Символы снов (чипы Сонника) ───────────────────────────────────────────
const dreamSymbols = ref<AdminDreamSymbol[]>([])
const dreamSymbolsLoading = ref(false)
const dreamSymbolsError = ref<string | null>(null)
const dreamSymbolsSuccess = ref<string | null>(null)
// Форма нового символа
const newSymbol = ref<{ emoji: string; name: string; promptHint: string; sortOrder: number }>({
  emoji: '', name: '', promptHint: '', sortOrder: 0,
})

const loadDreamSymbols = async () => {
  dreamSymbolsLoading.value = true
  dreamSymbolsError.value = null
  try {
    const res = await adminApi.getDreamSymbols()
    dreamSymbols.value = res.data
  } catch {
    dreamSymbolsError.value = 'Не удалось загрузить символы снов'
  } finally {
    dreamSymbolsLoading.value = false
  }
}

const createDreamSymbol = async () => {
  dreamSymbolsError.value = null
  dreamSymbolsSuccess.value = null
  if (!newSymbol.value.emoji.trim() || !newSymbol.value.name.trim()) {
    dreamSymbolsError.value = 'Эмодзи и название обязательны'
    return
  }
  try {
    await adminApi.createDreamSymbol({
      emoji: newSymbol.value.emoji.trim(),
      name: newSymbol.value.name.trim(),
      promptHint: newSymbol.value.promptHint.trim() || null,
      sortOrder: newSymbol.value.sortOrder || 0,
      isActive: true,
    })
    dreamSymbolsSuccess.value = 'Символ добавлен'
    newSymbol.value = { emoji: '', name: '', promptHint: '', sortOrder: 0 }
    await loadDreamSymbols()
  } catch (e: any) {
    dreamSymbolsError.value = e.response?.data?.message || 'Ошибка при добавлении символа'
  }
}

const saveDreamSymbol = async (symbol: AdminDreamSymbol) => {
  if (symbol.id == null) return
  dreamSymbolsError.value = null
  dreamSymbolsSuccess.value = null
  try {
    await adminApi.updateDreamSymbol(symbol.id, symbol)
    dreamSymbolsSuccess.value = `Символ «${symbol.name}» сохранён`
  } catch (e: any) {
    dreamSymbolsError.value = e.response?.data?.message || 'Ошибка при сохранении символа'
  }
}

const toggleDreamSymbol = async (symbol: AdminDreamSymbol) => {
  symbol.isActive = !symbol.isActive
  await saveDreamSymbol(symbol)
}

const removeDreamSymbol = async (symbol: AdminDreamSymbol) => {
  if (symbol.id == null) return
  if (!confirm(`Удалить символ «${symbol.name}» насовсем? Для временного скрытия используйте выключатель.`)) return
  dreamSymbolsError.value = null
  try {
    await adminApi.deleteDreamSymbol(symbol.id)
    dreamSymbolsSuccess.value = `Символ «${symbol.name}» удалён`
    await loadDreamSymbols()
  } catch (e: any) {
    dreamSymbolsError.value = e.response?.data?.message || 'Ошибка при удалении символа'
  }
}

// ── Блокировки чувствительного контента ───────────────────────────────────

const sensitiveEntries = ref<SensitiveQueryLogEntry[]>([])
const sensitiveLoading = ref(false)
const sensitivePage = ref(0)
const sensitiveTotalPages = ref(1)
const sensitiveCategory = ref<SensitiveCategory | ''>('')
const expandedSensitiveId = ref<number | null>(null)

const sensitiveCategories: { value: SensitiveCategory; label: string }[] = [
  { value: 'SELF_HARM_SUICIDE',      label: '⚠️ Суицид' },
  { value: 'DEATH_MORTALITY',        label: '💀 Смерть' },
  { value: 'MILITARY_CONFLICT',      label: '🪖 СВО/война' },
  { value: 'HEALTH_MEDICAL',         label: '🏥 Диагноз/лечение' },
  { value: 'CRIME_VIOLENCE',         label: '🔪 Преступления' },
  { value: 'POLITICAL_RELIGIOUS',    label: '🏛️ Политика/религия' },
  { value: 'LEGAL_FINANCIAL_ADVICE', label: '⚖️ Юр./фин. совет' },
  { value: 'GAMBLING_INVESTMENT',    label: '🎰 Азарт/инвестиции' },
  { value: 'MISSING_PERSONS_GUILT',  label: '🔍 Поиск/вина' },
  { value: 'LLM_REFUSED',            label: '🤖 LLM отказал' },
]

const sensitiveCategoryLabel = (cat: SensitiveCategory): string =>
  sensitiveCategories.find(c => c.value === cat)?.label ?? cat

const loadSensitiveQueries = async (page = 0) => {
  sensitiveLoading.value = true
  try {
    const res = await adminApi.getSensitiveQueries(page, 20, sensitiveCategory.value || undefined)
    sensitiveEntries.value = res.data.content
    sensitiveTotalPages.value = res.data.totalPages || 1
    sensitivePage.value = res.data.number
  } catch {
    sensitiveEntries.value = []
  } finally {
    sensitiveLoading.value = false
  }
}

const setSensitiveCategory = (cat: SensitiveCategory | '') => {
  sensitiveCategory.value = cat
  loadSensitiveQueries(0)
}

const openSensitiveTab = () => {
  activeTab.value = 'sensitive'
  if (sensitiveEntries.value.length === 0) loadSensitiveQueries(0)
}

// ── Транзакции (покупки знаков) ───────────────────────────────────────────

const transactions = ref<TransactionSummary[]>([])
const txLoading = ref(false)
const txPage = ref(0)
const txTotalPages = ref(1)

const txStatusFilter = ref<TransactionStatus | ''>('')
const txProviderFilter = ref<TransactionProvider | ''>('')
const txSearch = ref('')
const txFrom = ref('')
const txTo = ref('')
let txSearchTimer: ReturnType<typeof setTimeout> | null = null

const txStatuses: { value: TransactionStatus; label: string }[] = [
  { value: 'PENDING',   label: '⏳ В процессе' },
  { value: 'SUCCEEDED', label: '✅ Подтверждена' },
  { value: 'FAILED',    label: '❌ Отклонена' },
  { value: 'CANCELLED', label: '🚫 Отменена' },
]

const txProviders: { value: TransactionProvider; label: string }[] = [
  { value: 'YOOKASSA',       label: '💳 ЮKassa' },
  { value: 'ROBOKASSA',      label: '💳 Robokassa' },
  { value: 'TELEGRAM_STARS', label: '⭐ Telegram Stars' },
]

const txHasFilters = computed(() =>
  !!txStatusFilter.value || !!txProviderFilter.value || !!txSearch.value || !!txFrom.value || !!txTo.value
)

const loadTransactions = async (page = 0) => {
  txLoading.value = true
  try {
    const res = await adminApi.getTransactions(
      page, 20,
      txStatusFilter.value || undefined,
      txProviderFilter.value || undefined,
      txSearch.value || undefined,
      txFrom.value || undefined,
      txTo.value || undefined,
    )
    transactions.value = res.data.content
    txTotalPages.value = res.data.totalPages || 1
    txPage.value = res.data.number
  } catch {
    transactions.value = []
  } finally {
    txLoading.value = false
  }
}

const setTxStatus = (s: TransactionStatus | '') => {
  txStatusFilter.value = s
  loadTransactions(0)
}

const onTxSearchInput = () => {
  if (txSearchTimer) clearTimeout(txSearchTimer)
  txSearchTimer = setTimeout(() => loadTransactions(0), 400)
}

const resetTxFilters = () => {
  txStatusFilter.value = ''
  txProviderFilter.value = ''
  txSearch.value = ''
  txFrom.value = ''
  txTo.value = ''
  loadTransactions(0)
}

const openPaymentsTab = () => {
  activeTab.value = 'payments'
  if (transactions.value.length === 0) loadTransactions(0)
}

// ── Детали транзакции ─────────────────────────────────────────────────────
const selectedTransaction = ref<TransactionDetails | null>(null)
const showRawPayload = ref(false)

const openTransactionDetails = async (id: number) => {
  showRawPayload.value = false
  try {
    const res = await adminApi.getTransaction(id)
    selectedTransaction.value = res.data
  } catch { /* ignore */ }
}

const providerLabel = (p: TransactionProvider): string =>
  txProviders.find(x => x.value === p)?.label ?? p

const txStatusLabel = (s: TransactionStatus): string =>
  txStatuses.find(x => x.value === s)?.label ?? s

const webhookStatusLabel = (s: 'PENDING' | 'PROCESSED' | 'FAILED'): string => {
  if (s === 'PROCESSED') return '✅ Обработан'
  if (s === 'FAILED') return '❌ Ошибка обработки'
  return '⏳ Ожидает обработки'
}

/** amountMinor → строка с символом валюты. RUB хранится в копейках, XTR (Stars) — в штуках. */
const formatAmount = (amountMinor: number, currency: string): string =>
  currency === 'RUB' ? rubFormat(amountMinor) : `${fmt(amountMinor)} ★`

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

/** Возраст в годах по дате рождения (YYYY-MM-DD). null если дата не задана. */
const calcAge = (birthDate: string): number | null => {
  if (!birthDate) return null
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

onMounted(async () => {
  // Определяем роль — чтобы скрыть или показать элементы управления
  try {
    const res = await adminApi.checkSession()
    if (res.data.role) {
      userRole.value = res.data.role
    }
  } catch { /* при ошибке остаётся ADMIN по умолчанию — безопасно, т.к. бэк всё равно блокирует */ }

  loadUsers(0)
  loadSources()
})
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
.dash-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dash-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}
.role-badge {
  font-size: 12px;
  color: #94a3b8;
  background: rgba(148, 163, 184, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 6px;
  padding: 3px 8px;
}

/* ── Tabs ── */
.tabs {
  display: flex;
  gap: 0;
  border-bottom: 1px solid #1e293b;
  padding: 0 24px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
}
.tabs::-webkit-scrollbar { display: none; }
.tab {
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: #64748b;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  padding: 12px 12px;
  margin-bottom: -1px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: color 0.15s, border-color 0.15s;
  white-space: nowrap;
  flex-shrink: 0;
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

.btn-reset-sort {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s;
}
.btn-reset-sort:hover {
  color: #e2e8f0;
  border-color: #6366f1;
}

.btn-toggle-inactive {
  background: transparent;
  color: #94a3b8;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
  transition: color 0.15s, border-color 0.15s, background 0.15s;
}
.btn-toggle-inactive:hover {
  color: #e2e8f0;
  border-color: #6366f1;
}
.btn-toggle-inactive.active {
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  border-color: #6366f1;
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
.th-sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}
.th-sortable:hover { color: #cbd5e1; }
.sort-icon {
  display: inline-block;
  width: 14px;
  color: #475569;
  font-size: 11px;
  margin-left: 2px;
}

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

/* ── Транзакции: статус-бейджи ── */
.tx-badge--pending   { background: rgba(250,204,21,0.15);  color: #fde68a; }
.tx-badge--succeeded { background: rgba(34,197,94,0.15);   color: #86efac; }
.tx-badge--failed    { background: rgba(239,68,68,0.15);   color: #fca5a5; }
.tx-badge--cancelled { background: rgba(148,163,184,0.1);  color: #64748b; }

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

/* ── Символы снов (Сонник) ── */
.dream-symbols-hint { font-size: 13px; color: #64748b; margin-bottom: 14px; line-height: 1.5; }
.dream-symbols-table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
.dream-symbols-table th {
  text-align: left;
  font-size: 12px;
  color: #64748b;
  font-weight: 600;
  padding: 6px 8px 6px 0;
}
.dream-symbols-table td { padding: 4px 8px 4px 0; }
.symbol-inactive { opacity: 0.45; }
.symbol-input { width: 100%; box-sizing: border-box; }
.symbol-input--wide { min-width: 200px; }
.symbol-actions { display: flex; gap: 6px; white-space: nowrap; }
.btn-small { padding: 5px 9px; font-size: 12px; }
.btn-danger { color: #fca5a5; border-color: rgba(252,165,165,0.3); }
.dream-symbol-new {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
  padding-top: 10px;
  border-top: 1px solid #1e293b;
}
.dream-symbol-new .symbol-input--wide { flex: 1; min-width: 220px; }

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

/* ── Sensitive queries ── */
.sensitive-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  white-space: nowrap;
  background: #334155;
  color: #94a3b8;
}
.sensitive-badge--self_harm_suicide   { background: rgba(239,68,68,0.15);  color: #fca5a5; }
.sensitive-badge--death_mortality     { background: rgba(71,85,105,0.4);   color: #94a3b8; }
.sensitive-badge--military_conflict   { background: rgba(234,179,8,0.15);  color: #fde047; }
.sensitive-badge--health_medical      { background: rgba(234,179,8,0.1);   color: #fde68a; }
.sensitive-badge--crime_violence      { background: rgba(249,115,22,0.15); color: #fdba74; }
.sensitive-badge--political_religious { background: rgba(99,102,241,0.15); color: #a5b4fc; }
.sensitive-badge--legal_financial_advice { background: rgba(99,102,241,0.1); color: #c4b5fd; }
.sensitive-badge--gambling_investment { background: rgba(168,85,247,0.15); color: #d8b4fe; }
.sensitive-badge--missing_persons_guilt { background: rgba(100,116,139,0.2); color: #94a3b8; }
.sensitive-badge--llm_refused         { background: rgba(51,65,85,0.4);    color: #64748b; }

.sensitive-question {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  cursor: pointer;
  color: #94a3b8;
  font-size: 13px;
  max-width: 420px;
  transition: color 0.15s;
}
.sensitive-question:hover { color: #e2e8f0; }
.sensitive-question.expanded {
  display: block;
  -webkit-line-clamp: unset;
  overflow: visible;
  color: #e2e8f0;
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

/* ── Premium badge ── */
.premium-star {
  font-size: 12px;
  margin-left: 4px;
  vertical-align: middle;
}
.badge-premium {
  background: rgba(250, 204, 21, 0.12);
  color: #fde68a;
  border: 1px solid rgba(250, 204, 21, 0.3);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
}

/* ── Visit count cell ── */
.visit-count {
  color: #94a3b8;
}

/* ── User actions (lazy history) ── */
.actions-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  overflow-y: auto;
}
.action-item {
  background: #0f172a;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 10px 12px;
}
.action-label {
  font-size: 13px;
  font-weight: 500;
  color: #e2e8f0;
  margin-bottom: 4px;
}
.action-meta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}
.action-details {
  font-size: 12px;
  color: #64748b;
  flex: 1;
  line-height: 1.4;
  word-break: break-word;
}
.action-date {
  font-size: 11px;
  color: #475569;
  white-space: nowrap;
  flex-shrink: 0;
}
.actions-empty {
  font-size: 13px;
  color: #475569;
  text-align: center;
  padding: 16px 0;
}
.action-item--expandable {
  cursor: default;
}
.action-interpretation {
  margin-top: 10px;
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  border-top: 1px solid #334155;
  padding-top: 8px;
}
.action-expand-btn {
  margin-top: 8px;
  background: transparent;
  border: none;
  color: #6366f1;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  display: block;
}
.action-expand-btn:hover {
  color: #a5b4fc;
}

/* ── Action feedback ── */
.action-item--positive {
  border-left: 3px solid #22c55e;
  padding-left: 9px;
}
.action-item--negative {
  border-left: 3px solid #ef4444;
  padding-left: 9px;
}
.feedback-badge {
  display: inline-block;
  margin-left: 6px;
  font-size: 13px;
  vertical-align: middle;
}
.feedback-comment {
  margin-top: 6px;
  font-size: 12px;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 6px;
  padding: 6px 8px;
  line-height: 1.5;
  word-break: break-word;
}

/* ── Action feedback ── */
.action-item--positive {
  border-left: 3px solid #22c55e;
  padding-left: 9px;
}
.action-item--negative {
  border-left: 3px solid #ef4444;
  padding-left: 9px;
}
.feedback-badge {
  display: inline-block;
  margin-left: 6px;
  font-size: 13px;
  vertical-align: middle;
}
.feedback-comment {
  margin-top: 6px;
  font-size: 12px;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.08);
  border-radius: 6px;
  padding: 6px 8px;
  line-height: 1.5;
  word-break: break-word;
}

/* ── Range report tab ── */
.range-toolbar {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}
.range-inputs {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.range-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.range-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #64748b;
}
.range-date-input {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  padding: 9px 12px;
  outline: none;
  cursor: pointer;
  min-width: 160px;
}
.range-date-input:focus { border-color: #6366f1; }
.range-date-input::-webkit-calendar-picker-indicator {
  filter: invert(0.6);
  cursor: pointer;
}
.range-period-title {
  font-size: 13px;
  color: #64748b;
  font-style: italic;
  margin-top: -16px;
}

/* ── Broadcast photo url input ── */
.bc-code {
  font-family: monospace;
  background: rgba(99,102,241,0.15);
  color: #a5b4fc;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 11px;
}

/* ── Recipient buttons ── */
.bc-recipient-btn {
  font-size: 14px;
  color: #94a3b8;
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.15s;
}
.bc-recipient-btn:hover { color: #e2e8f0; border-color: #6366f1; }
.bc-recipient-btn.active {
  color: #818cf8;
  border-color: rgba(99,102,241,0.5);
  background: rgba(99,102,241,0.08);
}

/* ── File upload ── */
.bc-file-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-wrap: wrap;
}
.bc-file-input {
  display: none;
}
.bc-file-btn {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #94a3b8;
  font-size: 13px;
  padding: 8px 14px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.bc-file-label:hover .bc-file-btn {
  border-color: #6366f1;
  color: #e2e8f0;
}
.bc-file-name {
  font-size: 13px;
  color: #a5b4fc;
  word-break: break-all;
}
.bc-file-hint {
  font-size: 12px;
  color: #475569;
}

/* ── Photo preview ── */
.bc-photo-preview {
  position: relative;
  display: inline-block;
}

/* ── Цены платных функций ── */
.prices-form {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}
.price-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 180px;
}
.price-label {
  font-size: 13px;
  color: #94a3b8;
}
.price-input {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 14px;
  padding: 10px 14px;
  outline: none;
  box-sizing: border-box;
  width: 100%;
}
.price-input:focus { border-color: #6366f1; }

/* ── Source filter ── */
.source-select {
  background: #1e293b;
  border: 1px solid #334155;
  border-radius: 8px;
  color: #e2e8f0;
  font-size: 13px;
  padding: 8px 12px;
  outline: none;
  cursor: pointer;
  min-width: 160px;
}
.source-select:focus { border-color: #6366f1; }

.source-filter-badge {
  margin: 0 24px 8px;
  font-size: 13px;
  color: #94a3b8;
  display: flex;
  align-items: center;
  gap: 8px;
}
.source-filter-badge strong { color: #a5b4fc; }
.source-filter-clear {
  background: none;
  border: none;
  color: #64748b;
  cursor: pointer;
  font-size: 13px;
  padding: 0 4px;
}
.source-filter-clear:hover { color: #e2e8f0; }

/* ── Source cell in users table ── */
.source-cell { max-width: 140px; }
.source-badge {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.15);
  color: #a5b4fc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
}
.source-badge--organic {
  background: rgba(148, 163, 184, 0.1);
  color: #64748b;
}

</style>

<template>
  <div class="screen-wrap scrollbar-hide">
    <div class="content">

      <div class="header-bar">
        <button class="back-btn haptic" @click="navigate('profile')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div class="header-title serif">История</div>
        <div style="width:36px"></div>
      </div>

      <!-- Filter chips -->
      <div class="filter-row">
        <button
          v-for="f in filters" :key="f.id"
          class="filter-chip haptic"
          :class="{ active: activeFilter === f.id }"
          @click="activeFilter = f.id"
        >{{ f.label }}</button>
      </div>

      <!-- List -->
      <div class="history-list">
        <div
          v-for="item in filteredHistory" :key="item.id"
          class="history-item glass haptic"
        >
          <div class="item-icon-wrap">
            <span class="item-icon">{{ item.icon }}</span>
          </div>
          <div class="item-body">
            <div class="item-head">
              <div class="item-title">{{ item.title }}</div>
              <div class="item-date">{{ item.date }}</div>
            </div>
            <div class="item-desc">{{ item.description }}</div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-if="filteredHistory.length === 0" class="empty-state">
          <div class="empty-icon">📜</div>
          <div class="empty-title serif">Пусто</div>
          <div class="empty-sub">Здесь появятся ваши расклады и расчёты</div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, inject } from 'vue'

const navigate = inject<(r: string) => void>('navigate')

const activeFilter = ref('all')

const filters = [
  { id: 'all',           label: 'Все' },
  { id: 'tarot',         label: 'Таро' },
  { id: 'numerology',    label: 'Числа' },
  { id: 'compatibility', label: 'Совместимость' },
]

const history = [
  { id: 1, type: 'tarot',         title: 'Расклад дня',           description: 'Маг — новые возможности',    date: '13 апр', icon: '🔮' },
  { id: 2, type: 'compatibility',  title: 'Совместимость',          description: 'Анна & Иван — 85%',         date: '12 апр', icon: '💕' },
  { id: 3, type: 'numerology',     title: 'Число дня',              description: 'Период продуктивности',     date: '11 апр', icon: '✨' },
  { id: 4, type: 'tarot',         title: 'Расклад на любовь',      description: 'Влюбленные · Два кубков · Звезда', date: '10 апр', icon: '🔮' },
  { id: 5, type: 'numerology',     title: 'Число жизни',            description: 'Мудрец — путь к истине',   date: '9 апр',  icon: '🌟' },
]

const filteredHistory = computed(() =>
  activeFilter.value === 'all' ? history : history.filter(i => i.type === activeFilter.value)
)
</script>

<style scoped>
.screen-wrap { min-height: 100vh; padding-bottom: 90px; overflow-y: auto; }
.content { padding: 56px 20px 20px; }

.header-bar { display:flex; align-items:center; justify-content:space-between; margin-bottom:22px; }
.back-btn {
  width:36px; height:36px; border-radius:12px;
  background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.1);
  display:flex; align-items:center; justify-content:center; cursor:pointer; color:#F5ECFF;
}
.header-title { font-size:18px; }

/* Filter */
.filter-row { display:flex; gap:8px; margin-bottom:18px; overflow-x:auto; padding-bottom:2px; }
.filter-chip {
  padding:7px 14px; border-radius:100px; white-space:nowrap;
  background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1);
  font-size:12px; font-weight:600; color:rgba(255,255,255,.6);
  cursor:pointer; transition:all .2s; font-family:'Manrope',sans-serif;
}
.filter-chip.active {
  background:linear-gradient(135deg, rgba(182,84,255,.25), rgba(233,74,168,.15));
  border-color:rgba(182,84,255,.5); color:#F5ECFF;
}

/* History list */
.history-list { display:flex; flex-direction:column; gap:10px; }
.history-item {
  display:flex; align-items:center; gap:14px; padding:14px 16px; cursor:pointer;
}
.item-icon-wrap {
  width:44px; height:56px; flex-shrink:0;
  border-radius:10px;
  background:linear-gradient(135deg, rgba(182,84,255,.2), rgba(233,74,168,.1));
  border:1px solid rgba(182,84,255,.25);
  display:flex; align-items:center; justify-content:center;
}
.item-icon { font-size:22px; }
.item-body { flex:1; min-width:0; }
.item-head { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:4px; }
.item-title { font-size:14px; font-weight:600; color:#F5ECFF; }
.item-date  { font-size:11px; color:rgba(255,255,255,.4); flex-shrink:0; }
.item-desc  { font-size:12px; color:rgba(255,255,255,.55); line-height:1.4; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* Empty */
.empty-state { text-align:center; padding:48px 0; }
.empty-icon  { font-size:48px; margin-bottom:14px; }
.empty-title { font-size:22px; margin-bottom:8px; }
.empty-sub   { font-size:13px; color:rgba(255,255,255,.5); line-height:1.6; }
</style>

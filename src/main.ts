import { createApp } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './styles/index.css'
import { adminApi } from './utils/adminApi'

// Eruda — мобильная консоль разработчика.
// Включается только при наличии ?eruda=1 в URL, чтобы не грузить в продакшене.
if (new URLSearchParams(window.location.search).get('eruda') === '1') {
  const script = document.createElement('script')
  script.src = 'https://cdn.jsdelivr.net/npm/eruda'
  script.onload = () => (window as any).eruda.init()
  document.head.appendChild(script)
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // Основное Telegram MiniApp
    {
      path: '/',
      name: 'app',
      component: App,
    },
    // Админ-панель: страница входа
    {
      path: '/admin',
      name: 'admin-login',
      component: () => import('./views/admin/AdminLoginView.vue'),
    },
    // Админ-панель: дашборд (защищён guard'ом ниже)
    {
      path: '/admin/dashboard',
      name: 'admin-dashboard',
      component: () => import('./views/admin/AdminDashboardView.vue'),
      meta: { requiresAdminAuth: true },
    },
  ],
})

// Navigation guard: перед входом на /admin/dashboard проверяем сессию через /api/admin/auth/me.
// Если сессии нет — редиректим на /admin (страницу входа).
router.beforeEach(async (to) => {
  if (to.meta.requiresAdminAuth) {
    try {
      const res = await adminApi.checkSession()
      if (!res.data.authenticated) {
        return { name: 'admin-login' }
      }
    } catch {
      return { name: 'admin-login' }
    }
  }
})

// Монтируем RouterView как корневой элемент — каждый роут рендерит свой компонент
const app = createApp(RouterView)

app.use(router)
app.use(MotionPlugin)

app.mount('#app')

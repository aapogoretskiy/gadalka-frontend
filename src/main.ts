import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './styles/index.css'

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
    {
      path: '/',
      name: 'app',
      component: App
    }
  ]
})

const app = createApp(App)

app.use(router)
app.use(MotionPlugin)

app.mount('#app')

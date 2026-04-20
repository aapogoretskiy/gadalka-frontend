import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './styles/index.css'

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

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// TDesign
import TDesign from 'tdesign-vue-next'
import 'tdesign-vue-next/es/style/index.css'

// Highlight.js styles
import 'highlight.js/styles/github.css'

// 全局样式
import './assets/styles/main.css'

// 认证 Store
import { useAuthStore } from '@/stores/auth'
// 主题 Store
import { useThemeStore } from '@/stores/theme'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(TDesign)

app.mount('#app')

// 初始化主题（必须在 mount 之后调用，因为需要访问 DOM）
const themeStore = useThemeStore()
themeStore.initialize()

// 页面卸载时清理认证状态
window.addEventListener('beforeunload', () => {
  try {
    const authStore = useAuthStore()
    if (authStore.cleanup) {
      authStore.cleanup()
    }
  } catch (error) {
    // 忽略错误，避免影响页面卸载
  }
})

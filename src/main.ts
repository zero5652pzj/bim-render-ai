import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'

// TDesign 样式
import 'tdesign-vue-next/es/style/index.css'
import '@tdesign-vue-next/chat/style/index.css'

// 全局样式
import './assets/styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

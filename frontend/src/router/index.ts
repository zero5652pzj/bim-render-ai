import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      name: 'main',
      component: () => import('@/views/MainView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('@/views/ChatView.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/mcp-test',
      name: 'mcp-test',
      component: () => import('@/views/MCPTestView.vue'),
      meta: { requiresAuth: false },
    },
  ],
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  try {
    // 初始化认证状态（只执行一次）
    if (!authStore.user && !authStore.loading) {
      await authStore.initialize()
    }

    const requiresAuth = to.meta.requiresAuth === true

    // 防止无限重定向：检查目标路由是否是当前路由
    const isCurrentRoute = to.name === from.name

    // 调试日志
    console.log('[Router Guard]', {
      to: to.name,
      from: from.name,
      isAuthenticated: authStore.isAuthenticated,
      requiresAuth,
      isCurrentRoute
    })

    if (requiresAuth && !authStore.isAuthenticated) {
      // 需要认证但未登录，跳转登录页
      console.log('[Router Guard] Redirecting to login: requires auth but not authenticated')
      next({ name: 'login', query: { redirect: to.fullPath } })
    } else if (!requiresAuth && authStore.isAuthenticated && !isCurrentRoute) {
      // 已登录用户访问登录/注册页，跳转主页（但不在主页时）
      if (to.name === 'login' || to.name === 'register') {
        console.log('[Router Guard] Redirecting to main: authenticated user visiting auth pages')
        next({ name: 'main' })
      } else {
        next()
      }
    } else {
      next()
    }
  } catch (error) {
    console.error('[Router Guard] Error in route guard:', error)
    // 如果发生错误，允许继续导航
    next()
  }
})

export default router

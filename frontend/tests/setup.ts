// 测试环境设置
import { beforeAll, beforeEach, afterEach, afterAll } from 'vitest'

// 模拟 Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    })),
  },
}))

// 模拟路由器
vi.mock('vue-router', async () => {
  const actual = await vi.importActual('vue-router')
  return {
    ...actual,
    useRouter: () => ({
      push: vi.fn(),
      go: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      replace: vi.fn(),
    }),
    useRoute: () => ({
      query: {},
      params: {},
      path: '/',
      name: 'home',
      hash: '',
      fullPath: '/',
      matched: [],
    }),
    useCurrentRoute: () => ({
      value: {
        query: {},
        params: {},
        path: '/',
        name: 'home',
        hash: '',
        fullPath: '/',
        matched: [],
      },
    }),
    createRouter: vi.fn(),
    createWebHistory: vi.fn(),
    createWebHashHistory: vi.fn(),
  }
})

// 模拟 Pinia
vi.mock('pinia', async () => {
  const actual = await vi.importActual('pinia')
  return {
    ...actual,
    defineStore: vi.fn(() => ({
      $state: {},
      $patch: vi.fn(),
      $reset: vi.fn(),
    })),
  }
})

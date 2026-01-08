import { describe, it, expect, vi, beforeEach } from 'vitest'

// 模拟依赖
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn((event: string, callback: (event: string, session: any) => void) => {
        // 模拟返回取消订阅函数
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
      update: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
    })),
  },
}))

describe('Auth Store', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with default state', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const authStore = useAuthStore()

    expect(authStore.user.value).toBeNull()
    expect(authStore.profile.value).toBeNull()
    expect(authStore.loading.value).toBe(false)
    expect(authStore.isAuthenticated.value).toBe(false)
  })

  it('handles login success', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const { supabase } = await import('@/lib/supabase')

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    })

    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: {
        session: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
      },
    })

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          id: 'test-user-id',
          full_name: 'Test User',
        },
        error: null,
      }),
      update: vi.fn().mockResolvedValue({
        error: null,
      }),
    } as any)

    const authStore = useAuthStore()
    const result = await authStore.loginWithPassword('test@example.com', 'password')

    expect(result.success).toBe(true)
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password',
    })
  })

  it('handles login failure', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const { supabase } = await import('@/lib/supabase')

    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid credentials' },
    })

    const authStore = useAuthStore()
    const result = await authStore.loginWithPassword('test@example.com', 'wrong-password')

    expect(result.success).toBe(false)
    expect(result.error).toBe('Invalid credentials')
  })

  it('handles registration success', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const { supabase } = await import('@/lib/supabase')

    vi.mocked(supabase.auth.signUp).mockResolvedValue({
      data: {
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
      },
      error: null,
    })

    const authStore = useAuthStore()
    const result = await authStore.registerWithEmail('test@example.com', 'password', 'Test User')

    expect(result.success).toBe(true)
    expect(supabase.auth.signUp).toHaveBeenCalled()
  })

  it('handles logout', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const { supabase } = await import('@/lib/supabase')

    vi.mocked(supabase.auth.signOut).mockResolvedValue({
      error: null,
    })

    const authStore = useAuthStore()
    await authStore.logout()

    expect(supabase.auth.signOut).toHaveBeenCalled()
  })

  it('loads user profile', async () => {
    const { useAuthStore } = await import('@/stores/auth')
    const { supabase } = await import('@/lib/supabase')

    const profileData = {
      id: 'test-user-id',
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    }

    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: profileData,
        error: null,
      }),
    } as any)

    const authStore = useAuthStore()
    authStore.user.value = { id: 'test-user-id' } as any
    await authStore.loadProfile()

    expect(authStore.profile.value).toBeDefined()
    expect(authStore.profile.value?.full_name).toBe('Test User')
  })
})

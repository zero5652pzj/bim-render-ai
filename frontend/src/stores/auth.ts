import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Tables } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Tables<'profiles'> | null>(null)
  const loading = ref(false)
  const initialized = ref(false)
  let authSubscription: any = null
  let currentAbortController: AbortController | null = null

  const isAuthenticated = computed(() => !!user.value)

  // 初始化认证状态
  async function initialize() {
    if (initialized.value) {
      return
    }

    loading.value = true
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        user.value = data.session.user
        await loadProfile()
      }
    } finally {
      loading.value = false
      initialized.value = true
    }

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[Auth State Change]', event, session?.user?.id)

      try {
        if (event === 'SIGNED_IN' && session?.user) {
          user.value = session.user
          await loadProfile()
        } else if (event === 'SIGNED_OUT') {
          console.log('[Auth State Change] Handling SIGNED_OUT event')
          // 清理状态
          user.value = null
          profile.value = null
        } else if (event === 'TOKEN_REFRESHED') {
          console.log('[Auth State Change] Token refreshed')
          if (session?.user) {
            user.value = session.user
          }
        }
      } catch (error) {
        console.error('[Auth State Change] Error handling auth state change:', error)
        // 即使处理出错，也保持基本状态一致性
        if (event === 'SIGNED_OUT' && !session?.user) {
          user.value = null
          profile.value = null
        }
      }
    })

    authSubscription = subscription
  }

  // 清理认证状态监听
  function cleanup() {
    if (authSubscription && typeof authSubscription.unsubscribe === 'function') {
      console.log('[Auth Cleanup] Unsubscribing from auth state changes')
      authSubscription.unsubscribe()
      authSubscription = null
    }
    // 不重置 initialized 状态，因为应用可能需要重新初始化
    // initialized.value = false
  }

  // 加载用户资料
  async function loadProfile() {
    if (!user.value) {
      console.log('[loadProfile] No user found, skipping profile load')
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) {
        console.error('[loadProfile] Error loading profile:', error)
        return
      }

      profile.value = data
      console.log('[loadProfile] Profile loaded:', data?.full_name)
    } catch (error) {
      console.error('[loadProfile] Exception:', error)
    }
  }

  // 邮箱密码登录
  async function loginWithPassword(email: string, password: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      user.value = data.user
      await loadProfile()

      // 更新最后登录时间
      await supabase
        .from('profiles')
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', data.user.id)

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登录失败'
      }
    } finally {
      loading.value = false
    }
  }

  // 手机号密码登录
  async function loginWithPhonePassword(phone: string, password: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        phone,
        password,
      })

      if (error) throw error

      // 不直接设置 user，让 onAuthStateChange 处理
      // user.value = data.user
      // await loadProfile()

      // 更新最后登录时间
      if (data.user) {
        await supabase
          .from('profiles')
          .update({ last_login_at: new Date().toISOString() })
          .eq('id', data.user.id)
      }

      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '登录失败'
      }
    } finally {
      loading.value = false
    }
  }

  // 手机号验证码登录
  async function requestPhoneOtp(phone: string) {
    loading.value = true
    try {
      const { error } = await supabase.auth.signInWithOtp({ phone })
      if (error) throw error
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '验证码发送失败'
      }
    } finally {
      loading.value = false
    }
  }

  async function verifyPhoneOtp(phone: string, token: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      })
      if (error) throw error

      user.value = data.user
      await loadProfile()
      return { success: true }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '验证码验证失败'
      }
    } finally {
      loading.value = false
    }
  }

  // 邮箱注册
  async function registerWithEmail(email: string, password: string, fullName: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '注册失败'
      }
    } finally {
      loading.value = false
    }
  }

  // 手机号注册
  async function registerWithPhone(phone: string, password: string, fullName: string) {
    loading.value = true
    try {
      const { data, error } = await supabase.auth.signUp({
        phone,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (error) throw error

      return { success: true, data }
    } catch (error: any) {
      return {
        success: false,
        error: error.message || '注册失败'
      }
    } finally {
      loading.value = false
    }
  }

  // 登出
  async function logout() {
    try {
      loading.value = true
      console.log('[Logout] Starting logout process...')

      // 创建新的 AbortController 以防之前的请求还在进行中
      if (currentAbortController) {
        currentAbortController.abort()
      }
      currentAbortController = new AbortController()

      const { error } = await supabase.auth.signOut()

      if (error) {
        console.error('[Logout] Error signing out:', error)

        // 如果是被中止的请求，说明登出可能已经完成
        if (error.name === 'AbortError' || error.message.includes('signal is aborted')) {
          console.log('[Logout] SignOut was aborted, cleaning up local state')
          user.value = null
          profile.value = null
          return { success: true, message: '登出成功' }
        }

        throw error
      }

      // 等待一小段时间让 Supabase 完成登出流程
      await new Promise(resolve => setTimeout(resolve, 100))

      // 手动清理状态（作为备份）
      user.value = null
      profile.value = null

      console.log('[Logout] Successfully logged out')
      return { success: true, message: '登出成功' }
    } catch (error: any) {
      console.error('[Logout] Failed to logout:', error)

      // 如果是 AbortError，说明请求被中止，这通常不是严重问题
      if (error.name === 'AbortError' || error.message.includes('signal is aborted')) {
        console.log('[Logout] Abort detected, treating as success')
        // 清理本地状态
        user.value = null
        profile.value = null
        return { success: true, message: '登出成功' }
      }

      throw error
    } finally {
      loading.value = false
      currentAbortController = null
    }
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    initialized,
    initialize,
    loadProfile,
    loginWithPassword,
    loginWithPhonePassword,
    requestPhoneOtp,
    verifyPhoneOtp,
    registerWithEmail,
    registerWithPhone,
    logout,
    cleanup,
  }
})

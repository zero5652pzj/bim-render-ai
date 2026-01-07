import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase, type Tables } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Tables<'profiles'> | null>(null)
  const loading = ref(false)

  const isAuthenticated = computed(() => !!user.value)

  // 初始化认证状态
  async function initialize() {
    loading.value = true
    try {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        user.value = data.session.user
        await loadProfile()
      }
    } finally {
      loading.value = false
    }

    // 监听认证状态变化
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        user.value = session.user
        await loadProfile()
      } else if (event === 'SIGNED_OUT') {
        user.value = null
        profile.value = null
      }
    })
  }

  // 加载用户资料
  async function loadProfile() {
    if (!user.value) return

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.value.id)
      .single()

    profile.value = data
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
    await supabase.auth.signOut()
    user.value = null
    profile.value = null
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    initialize,
    loadProfile,
    loginWithPassword,
    requestPhoneOtp,
    verifyPhoneOtp,
    registerWithEmail,
    registerWithPhone,
    logout,
  }
})

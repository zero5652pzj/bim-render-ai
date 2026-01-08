// Supabase 连接测试工具
import { supabase } from '@/lib/supabase'

export async function testSupabaseConnection() {
  console.log('🔍 测试 Supabase 连接...')

  try {
    // 测试基本连接
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('❌ Supabase 连接失败:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ Supabase 连接成功')
    console.log('📊 当前会话:', data.session ? '已登录' : '未登录')

    return { success: true, session: data.session }
  } catch (err: any) {
    console.error('❌ 连接测试失败:', err.message)
    return { success: false, error: err.message }
  }
}

export async function testRegister(email: string, password: string, fullName: string) {
  console.log('📝 测试用户注册...')

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

    if (error) {
      console.error('❌ 注册失败:', error.message)
      return { success: false, error: error.message }
    }

    console.log('✅ 注册成功')
    console.log('📧 用户邮箱:', data.user?.email)
    console.log('🆔 用户ID:', data.user?.id)

    // 检查是否需要邮箱验证
    if (!data.session) {
      console.log('📧 请检查邮箱并点击验证链接')
    }

    return { success: true, data }
  } catch (err: any) {
    console.error('❌ 注册测试失败:', err.message)
    return { success: false, error: err.message }
  }
}

// 在浏览器控制台中使用：
// import { testSupabaseConnection, testRegister } from '@/utils/testSupabase'
// testSupabaseConnection()
// testRegister('test@example.com', 'password123', '测试用户')

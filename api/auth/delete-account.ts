import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 从请求头获取 Authorization Token
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ code: 401, message: 'Unauthorized' })
    }

    // 创建 Supabase 客户端（使用 Service Role Key）
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // 验证 Token 获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return res.status(401).json({ code: 401, message: 'Invalid token' })
    }

    // 删除用户账号（级联删除）
    const { error } = await supabase.auth.admin.deleteUser(user.id)
    
    if (error) {
      throw error
    }

    return res.status(200).json({
      code: 200,
      message: 'success'
    })
  } catch (error: any) {
    console.error('API error:', error)
    return res.status(500).json({
      code: 500,
      message: 'Internal server error',
      error: error.message
    })
  }
}

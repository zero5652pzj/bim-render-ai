import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // 从请求头获取 Authorization Token
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ code: 401, message: 'Unauthorized', error: 'No token provided' })
    }

    // 创建 Supabase 客户端
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL!,
      process.env.VITE_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    )

    // 验证 Token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ code: 401, message: 'Invalid token' })
    }

    // 获取用户资料
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    return res.status(200).json({
      code: 200,
      data: {
        user,
        profile
      },
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

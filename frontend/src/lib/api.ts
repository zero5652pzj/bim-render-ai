import axios from 'axios'
import { supabase } from './supabase'

// 创建 axios 实例
const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 自动添加 Token
api.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理 401 错误
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token 过期，清除认证信息
      supabase.auth.signOut()
      window.location.href = '/login?expired=1'
    }
    return Promise.reject(error)
  }
)

export default api

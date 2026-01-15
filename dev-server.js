#!/usr/bin/env node

/**
 * 开发服务器
 * 用于处理前端开发环境中的API请求
 */

const express = require('express')
const { createProxyMiddleware } = require('http-proxy-middleware')
const cors = require('cors')
const path = require('path')

const app = express()
const PORT = process.env.PORT || 3004

// 启用CORS
app.use(cors({
  origin: ['http://localhost:5175', 'http://localhost:5173', 'http://localhost:4173'],
  credentials: true
}))

// 解析JSON
app.use(express.json())

// 代理到Vite开发服务器（用于静态文件）
app.use('/api', createProxyMiddleware({
  target: 'http://localhost:5175',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api', // 保持/api路径
  },
}))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 开发服务器运行在端口 ${PORT}`)
  console.log(`📝 API代理: http://localhost:${PORT}/api -> http://localhost:5175/api`)
  console.log(`🌐 前端地址: http://localhost:5175`)
})

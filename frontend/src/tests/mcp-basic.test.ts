/**
 * 基础MCP功能验证测试
 */

import { describe, it, expect } from 'vitest'

describe('MCP基础功能验证', () => {
  it('MCP依赖包应该已安装', () => {
    // 检查package.json中是否包含MCP依赖
    const packageJson = require('../package.json')

    expect(packageJson.dependencies).toHaveProperty('@ai-sdk/mcp')
    expect(packageJson.dependencies).toHaveProperty('zod')
  })

  it('MCP客户端模块应该可以导入', () => {
    // 验证MCP客户端文件是否存在
    const fs = require('fs')
    const path = require('path')

    const mcpClientPath = path.join(__dirname, '../lib/simple-mcp-client.ts')
    expect(fs.existsSync(mcpClientPath)).toBe(true)
  })

  it('MCP服务器模块应该存在', () => {
    const fs = require('fs')
    const path = require('path')

    const mcpServerPath = path.join(__dirname, '../../api/mcp/server.ts')
    expect(fs.existsSync(mcpServerPath)).toBe(true)
  })

  it('MCP演示组件应该存在', () => {
    const fs = require('fs')
    const path = require('path')

    const demoComponentPath = path.join(__dirname, '../components/MCPChatDemo.vue')
    expect(fs.existsSync(demoComponentPath)).toBe(true)
  })

  it('增强聊天模块应该存在', () => {
    const fs = require('fs')
    const path = require('path')

    const enhancedChatPath = path.join(__dirname, '../lib/enhanced-chat.ts')
    expect(fs.existsSync(enhancedChatPath)).toBe(true)
  })
})
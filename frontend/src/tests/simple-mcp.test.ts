/**
 * 简化版MCP集成测试
 * 验证基本MCP功能
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  initMCPClient,
  closeMCPClient,
  getMCPTools,
  executeMCPTool,
  isMCPClientReady
} from '../lib/simple-mcp-client'

describe('简化版MCP测试', () => {
  beforeEach(async () => {
    await closeMCPClient()
  })

  afterEach(async () => {
    await closeMCPClient()
  })

  it('应该成功初始化MCP客户端', async () => {
    console.log('[测试] 开始MCP客户端初始化测试')

    await expect(initMCPClient()).resolves.not.toThrow()
    expect(isMCPClientReady()).toBe(true)

    console.log('[测试] MCP客户端初始化成功')
  })

  it('应该获取工具列表', async () => {
    await initMCPClient()

    const tools = getMCPTools()
    expect(tools).toBeDefined()
    expect(Object.keys(tools).length).toBeGreaterThan(0)

    console.log('[测试] 工具列表获取成功:', Object.keys(tools))
  })

  it('应该正确关闭MCP客户端', async () => {
    await initMCPClient()
    expect(isMCPClientReady()).toBe(true)

    await closeMCPClient()
    expect(isMCPClientReady()).toBe(false)

    console.log('[测试] MCP客户端关闭成功')
  })
})
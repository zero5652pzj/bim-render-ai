/**
 * 官方MCP客户端实现
 * 使用 @ai-sdk/mcp 符合MCP标准的客户端
 */

import { createMCPClient } from '@ai-sdk/mcp'
import { z } from 'zod'

// 工具输入/输出架构定义
const WeatherInputSchema = z.object({
  location: z.string().describe('城市名称，支持中英文')
})

const WeatherOutputSchema = z.object({
  location: z.string(),
  temperature: z.number(),
  humidity: z.number(),
  description: z.string(),
  windSpeed: z.number(),
  pressure: z.number(),
  visibility: z.number(),
  timestamp: z.string()
})

const NewsInputSchema = z.object({
  category: z.string().optional().describe('新闻分类'),
  count: z.number().optional().describe('新闻数量'),
  country: z.string().optional().describe('国家代码')
})

const NewsOutputSchema = z.array(z.object({
  title: z.string(),
  description: z.string(),
  source: z.string(),
  publishedAt: z.string(),
  url: z.string()
}))

const ExchangeRateInputSchema = z.object({
  from: z.string().optional().describe('源货币代码'),
  to: z.string().optional().describe('目标货币代码')
})

const ExchangeRateOutputSchema = z.object({
  from: z.string(),
  to: z.string(),
  rate: z.number(),
  amount: z.number(),
  convertedAmount: z.number(),
  lastUpdate: z.string()
})

const MapInputSchema = z.object({
  origin: z.string().optional().describe('起点地址'),
  destination: z.string().optional().describe('终点地址'),
  query: z.string().optional().describe('搜索关键词')
})

const MapOutputSchema = z.object({
  origin: z.string().optional(),
  destination: z.string().optional(),
  distance: z.string().optional(),
  duration: z.string().optional(),
  steps: z.array(z.object({
    instruction: z.string(),
    distance: z.string(),
    duration: z.string()
  })).optional()
}).or(z.array(z.object({
  name: z.string(),
  displayName: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  type: z.string()
})))

/**
 * MCP客户端实例
 */
let mcpClient: any = null
let mcpTools: any = null

/**
 * 初始化官方MCP客户端
 */
export async function initMCPClient(): Promise<void> {
  try {
    console.log('[MCP客户端] 初始化官方MCP客户端...')

    // 创建MCP客户端 - 使用HTTP传输
    const mcpUrl = `${window.location.origin}/api/mcp`
    console.log('[MCP客户端] 构造URL:', mcpUrl)

    mcpClient = await createMCPClient({
      transport: {
        type: 'http',
        url: mcpUrl,
        headers: {
          'Content-Type': 'application/json',
          'MCP-Protocol-Version': '2024-11-05'
        }
      }
    })

    console.log('[MCP客户端] 客户端创建成功')

    // 使用架构定义方式获取工具（推荐）
    mcpTools = await mcpClient.tools({
      schemas: {
        getWeather: {
          inputSchema: WeatherInputSchema,
          outputSchema: WeatherOutputSchema
        },
        getNews: {
          inputSchema: NewsInputSchema,
          outputSchema: NewsOutputSchema
        },
        getExchangeRate: {
          inputSchema: ExchangeRateInputSchema,
          outputSchema: ExchangeRateOutputSchema
        },
        searchLocation: {
          inputSchema: z.object({
            query: z.string().describe('搜索关键词')
          }),
          outputSchema: z.array(z.object({
            name: z.string(),
            displayName: z.string(),
            latitude: z.number(),
            longitude: z.number(),
            type: z.string()
          }))
        },
        getRoute: {
          inputSchema: z.object({
            origin: z.string().describe('起点地址'),
            destination: z.string().describe('终点地址')
          }),
          outputSchema: z.object({
            origin: z.string(),
            destination: z.string(),
            distance: z.string(),
            duration: z.string(),
            steps: z.array(z.object({
              instruction: z.string(),
              distance: z.string(),
              duration: z.string()
            }))
          })
        }
      }
    })

    console.log('[MCP客户端] 工具列表:', Object.keys(mcpTools))
    console.log('[MCP客户端] 初始化完成')

  } catch (error: any) {
    console.error('[MCP客户端] 初始化失败:', error)
    throw new Error(`MCP客户端初始化失败: ${error.message}`)
  }
}

/**
 * 获取MCP工具实例
 */
export function getMCPTools() {
  if (!mcpTools) {
    throw new Error('MCP客户端未初始化，请先调用 initMCPClient()')
  }
  return mcpTools
}

/**
 * 关闭MCP客户端
 */
export async function closeMCPClient(): Promise<void> {
  if (mcpClient) {
    await mcpClient.close()
    mcpClient = null
    mcpTools = null
    console.log('[MCP客户端] 客户端已关闭')
  }
}

/**
 * 执行MCP工具（带类型安全）
 */
export async function executeMCPTool<T extends keyof typeof mcpTools>(
  toolName: T,
  parameters: z.infer<typeof mcpTools[T]['inputSchema']>
): Promise<z.infer<typeof mcpTools[T]['outputSchema']>> {
  try {
    const tools = getMCPTools()

    if (!tools[toolName]) {
      throw new Error(`工具 ${toolName} 不存在`)
    }

    console.log(`[MCP工具] 执行工具: ${toolName}`, parameters)

    const result = await tools[toolName].execute(
      parameters,
      {
        messages: [],
        toolCallId: `${toolName}-${Date.now()}`
      }
    )

    console.log(`[MCP工具] ${toolName} 执行成功`)
    return result

  } catch (error: any) {
    console.error(`[MCP工具] ${toolName} 执行失败:`, error)
    throw error
  }
}

/**
 * 获取MCP资源列表
 */
export async function listMCPResources() {
  if (!mcpClient) {
    throw new Error('MCP客户端未初始化')
  }

  try {
    const resources = await mcpClient.listResources()
    console.log('[MCP资源] 获取资源列表:', resources)
    return resources
  } catch (error: any) {
    console.error('[MCP资源] 获取失败:', error)
    return []
  }
}

/**
 * 读取MCP资源
 */
export async function readMCPResource(uri: string) {
  if (!mcpClient) {
    throw new Error('MCP客户端未初始化')
  }

  try {
    const resourceData = await mcpClient.readResource({ uri })
    console.log(`[MCP资源] 读取资源 ${uri}:`, resourceData)
    return resourceData
  } catch (error: any) {
    console.error(`[MCP资源] 读取 ${uri} 失败:`, error)
    throw error
  }
}

/**
 * 检查MCP客户端状态
 */
export function isMCPClientReady(): boolean {
  return mcpClient !== null && mcpTools !== null
}

/**
 * 获取可用工具列表
 */
export function getAvailableTools(): string[] {
  if (!mcpTools) {
    return []
  }
  return Object.keys(mcpTools)
}

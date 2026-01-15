/**
 * 增强版聊天功能 - 集成官方MCP工具
 * 支持类型安全的工具调用和自动发现
 */

import { generateText, streamText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { initMCPClient, getMCPTools, closeMCPClient, isMCPClientReady } from './simple-mcp-client'

// MiniMax API 配置
const MINIMAX_BASE_URL = import.meta.env.VITE_MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1'
const MINIMAX_MODEL_NAME = import.meta.env.VITE_MINIMAX_MODEL_NAME || 'MiniMax-M2.1'
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY

// 创建 MiniMax 的 OpenAI 兼容客户端
const minimax = createOpenAI({
  baseURL: MINIMAX_BASE_URL,
  apiKey: MINIMAX_API_KEY,
})

// 消息接口定义
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// AI 响应接口
export interface ChatResponse {
  message: string
  success: boolean
  error?: string
}

/**
 * 初始化增强聊天功能
 */
export async function initEnhancedChat(): Promise<void> {
  try {
    console.log('[增强聊天] 初始化MCP客户端...')

    // 确保MCP客户端已初始化
    if (!isMCPClientReady()) {
      await initMCPClient()
    }

    console.log('[增强聊天] MCP客户端就绪')

  } catch (error: any) {
    console.error('[增强聊天] 初始化失败:', error)
    throw error
  }
}

/**
 * 增强版聊天功能 - 支持MCP工具
 */
export async function enhancedChatWithMinimax(
  messages: ChatMessage[],
  options: {
    enableTools?: boolean
    stream?: boolean
    onProgress?: (text: string) => void
  } = {}
): Promise<ChatResponse> {
  const { enableTools = true, stream = false, onProgress } = options

  try {
    console.log('[增强聊天] 开始聊天请求:', {
      消息数量: messages.length,
      启用工具: enableTools,
      流式响应: stream
    })

    let tools = undefined

    // 如果启用工具，获取MCP工具
    if (enableTools) {
      if (!isMCPClientReady()) {
        await initMCPClient()
      }

      tools = getMCPTools()
      console.log('[增强聊天] MCP工具已加载，工具数量:', Object.keys(tools).length)
    }

    // 准备系统消息
    const systemMessage = {
      role: 'system' as const,
      content: `你是一个专业的 BIM 桥梁设计助手。你的职责是：
1. 理解用户的桥梁设计需求
2. 提供专业的桥梁设计建议
3. 生成符合工程规范的桥梁参数
4. 使用工具函数创建 3D 桥梁模型

你可以使用以下工具来帮助回答用户问题：
- getWeather: 获取指定城市的实时天气信息
- getNews: 获取最新新闻资讯
- getExchangeRate: 查询货币汇率信息
- searchLocation: 搜索地点和位置信息
- getRoute: 规划两点之间的路线

当需要使用工具时，请明确指出要使用的工具和参数。如果不需要工具，请直接回答桥梁设计相关问题。

请用简洁专业的语言回答，必要时使用 Markdown 格式。`
    }

    // 准备完整消息列表
    const fullMessages = [systemMessage, ...messages]

    if (stream) {
      // 流式响应
      return await streamEnhancedChat(fullMessages, tools, onProgress)
    } else {
      // 非流式响应
      return await nonStreamEnhancedChat(fullMessages, tools)
    }

  } catch (error: any) {
    console.error('[增强聊天] 调用失败:', error)

    // 返回错误响应
    return {
      message: `抱歉，处理您的消息时发生了错误：${error.message}\n\n请稍后再试。`,
      success: false,
      error: error.message
    }
  }
}

/**
 * 流式增强聊天
 */
async function streamEnhancedChat(
  messages: any[],
  tools: any,
  onProgress?: (text: string) => void
): Promise<ChatResponse> {
  return new Promise((resolve, reject) => {
    let fullText = ''

    try {
      streamText({
        model: minimax(MINIMAX_MODEL_NAME) as any,
        messages,
        tools: tools as any,
        maxTokens: 2048,
        temperature: 0.7,
        onChunk({ chunk }) {
          const text = chunk.type === 'text-delta' ? chunk.textDelta : ''
          fullText += text
          if (onProgress) {
            onProgress(fullText)
          }
        },
        onFinish() {
          resolve({
            message: fullText,
            success: true
          })
        }
      })
    } catch (error: any) {
      console.error('[流式聊天] 异常:', error)
      reject(error)
    }
  })
}

/**
 * 非流式增强聊天
 */
async function nonStreamEnhancedChat(
  messages: any[],
  tools: any
): Promise<ChatResponse> {
  try {
    const { text } = await generateText({
      model: minimax(MINIMAX_MODEL_NAME) as any,
      messages,
      tools: tools as any,
      maxTokens: 2048,
      temperature: 0.7,
    })

    if (text) {
      console.log('[非流式聊天] 成功获得AI回复')
      return {
        message: text,
        success: true
      }
    } else {
      throw new Error('MiniMax API 返回了空的响应')
    }
  } catch (error: any) {
    console.error('[非流式聊天] Vercel AI SDK 调用失败:', error)
    throw error
  }
}

/**
 * 直接调用MCP工具（不通过AI）
 */
export async function callMCPToolDirectly<T>(
  toolName: string,
  parameters: Record<string, any>
): Promise<T> {
  try {
    console.log(`[直接工具调用] ${toolName}:`, parameters)

    if (!isMCPClientReady()) {
      await initMCPClient()
    }

    const { executeMCPTool } = await import('./mcp-client')
    const result = await executeMCPTool<T>(toolName, parameters)

    console.log(`[直接工具调用] ${toolName} 成功`)
    return result

  } catch (error: any) {
    console.error(`[直接工具调用] ${toolName} 失败:`, error)
    throw error
  }
}

/**
 * 获取MCP资源
 */
export async function getMCPResource(uri: string) {
  try {
    console.log(`[MCP资源] 获取资源: ${uri}`)

    if (!isMCPClientReady()) {
      await initMCPClient()
    }

    const { readMCPResource } = await import('./mcp-client')
    const result = await readMCPResource(uri)

    return {
      success: true,
      data: result,
      message: `资源 ${uri} 获取成功`
    }

  } catch (error: any) {
    console.error(`[MCP资源] 获取 ${uri} 失败:`, error)
    return {
      success: false,
      error: error.message,
      message: `资源 ${uri} 获取失败`
    }
  }
}

/**
 * 获取MCP提示
 */
export async function getMCPPrompt(name: string, arguments_: Record<string, any> = {}) {
  try {
    console.log(`[MCP提示] 获取提示: ${name}`, arguments_)

    if (!isMCPClientReady()) {
      await initMCPClient()
    }

    const { getMCPPrompt: getPrompt } = await import('./mcp-client')
    const result = await getPrompt(name, arguments_)

    return {
      success: true,
      data: result,
      message: `提示 ${name} 获取成功`
    }

  } catch (error: any) {
    console.error(`[MCP提示] 获取 ${name} 失败:`, error)
    return {
      success: false,
      error: error.message,
      message: `提示 ${name} 获取失败`
    }
  }
}

/**
 * 检查MCP功能是否可用
 */
export async function checkMCPHealth(): Promise<boolean> {
  try {
    if (!isMCPClientReady()) {
      await initMCPClient()
    }

    // 尝试获取工具列表
    const tools = getMCPTools()
    const toolCount = Object.keys(tools).length

    console.log(`[MCP健康检查] 工具数量: ${toolCount}`)

    return toolCount > 0

  } catch (error: any) {
    console.error('[MCP健康检查] 失败:', error)
    return false
  }
}

/**
 * 关闭MCP客户端
 */
export async function shutdownEnhancedChat(): Promise<void> {
  try {
    await closeMCPClient()
    console.log('[增强聊天] MCP客户端已关闭')
  } catch (error: any) {
    console.error('[增强聊天] 关闭失败:', error)
  }
}

/**
 * 生成降级响应
 */

/**
 * 工具辅助函数 - 格式化天气信息
 */
export function formatWeatherResponse(weatherData: any): string {
  return `🌤️ **${weatherData.location}天气信息**

🌡️ 温度: ${weatherData.temperature}°C
💧 湿度: ${weatherData.humidity}%
☁️ 天气: ${weatherData.description}
💨 风速: ${weatherData.windSpeed}km/h
📊 气压: ${weatherData.pressure}hPa
👁️ 能见度: ${weatherData.visibility}km
🕒 更新时间: ${weatherData.timestamp}

这是通过官方MCP工具获取的实时信息。如果您有桥梁设计相关的问题，我也很乐意为您解答！`
}

/**
 * 工具辅助函数 - 格式化汇率信息
 */
export function formatExchangeResponse(exchangeData: any): string {
  if (Array.isArray(exchangeData)) {
    // 常用汇率
    const rates = exchangeData.map(rate =>
      `• 1 ${rate.from} = ${rate.rate.toFixed(4)} ${rate.to}`
    ).join('\n')

    return `💱 **常用汇率信息** (${exchangeData.length}条)

${rates}

🕒 更新时间: ${exchangeData[0]?.lastUpdate || '未知'}

这是通过官方MCP工具获取的信息。如果您有桥梁设计相关的问题，我也很乐意为您解答！`
  } else {
    // 单个汇率
    return `💱 **汇率信息**

💰 汇率: 1 ${exchangeData.from} = ${exchangeData.rate.toFixed(4)} ${exchangeData.to}
💵 金额: ${exchangeData.amount} ${exchangeData.from} = ${exchangeData.convertedAmount.toFixed(2)} ${exchangeData.to}
🕒 更新时间: ${exchangeData.lastUpdate}

这是通过官方MCP工具获取的信息。如果您有桥梁设计相关的问题，我也很乐意为您解答！`
  }
}

/**
 * 工具辅助函数 - 格式化新闻信息
 */
export function formatNewsResponse(newsData: any[]): string {
  const newsList = newsData.map((news, index) =>
    `**${index + 1}. ${news.title}**
${news.description}
📱 来源: ${news.source}
🕒 时间: ${news.publishedAt}
🔗 [查看详情](${news.url})`
  ).join('\n\n')

  return `📰 **新闻资讯** (${newsData.length}条)

${newsList}

这是通过官方MCP工具获取的信息。如果您有桥梁设计相关的问题，我也很乐意为您解答！`
}
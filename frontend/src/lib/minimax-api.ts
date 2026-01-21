import { generateText, streamText, type CoreMessage } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { initMCPClient, getMCPTools } from './simple-mcp-client'

// MiniMax API 配置 - 使用 OpenAI 兼容接口
const MINIMAX_BASE_URL = import.meta.env.VITE_MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1'
const MINIMAX_MODEL_NAME = import.meta.env.VITE_MINIMAX_MODEL_NAME || 'MiniMax-M2.1'
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY

// 创建 MiniMax 的 OpenAI 兼容客户端
const minimax = createOpenAI({
  baseURL: MINIMAX_BASE_URL,
  apiKey: MINIMAX_API_KEY,
})

// MCP 客户端初始化状态
let isMCPInitialized = false

// 验证必要的环境变量
if (!MINIMAX_API_KEY) {
  console.warn('[MiniMax API] 警告: 未找到 VITE_MINIMAX_API_KEY 环境变量')
}

// 消息接口定义
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// 转换为 CoreMessage 格式
function toCoreMessages(messages: ChatMessage[]): CoreMessage[] {
  return messages.map(m => ({
    role: m.role,
    content: m.content
  }))
}

// AI 响应接口
export interface ChatResponse {
  message: string
  success: boolean
  error?: string
}

// 流式响应回调接口
export interface StreamCallbacks {
  onText?: (text: string) => void
  onToolCall?: (toolName: string, toolArgs: any) => void
  onToolResult?: (toolName: string, result: any) => void
  onComplete?: (fullText: string) => void
  onError?: (error: Error) => void
}

// 纯前端 MiniMax AI 聊天方法（支持 MCP 工具）
export async function chatWithMinimax(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    console.log('[MiniMax Chat] 开始聊天请求:', {
      消息数量: messages.length,
      最后一条消息: messages[messages.length - 1]?.content?.substring(0, 50)
    })

    // 使用 Vercel AI SDK 调用 MiniMax API
    return await callMinimaxAPI(messages)

  } catch (error: any) {
    console.error('[MiniMax Chat] 调用失败:', error)

    // 返回错误响应
    return {
      message: `抱歉，处理您的消息时发生了错误：${error.message}\n\n请稍后再试。`,
      success: false,
      error: error.message
    }
  }
}

// 初始化 MCP 客户端
async function initializeMCPIfNeeded(): Promise<void> {
  if (!isMCPInitialized) {
    try {
      await initMCPClient()
      isMCPInitialized = true
      console.log('[MiniMax Chat] MCP 客户端初始化成功')
    } catch (error) {
      console.warn('[MiniMax Chat] MCP 客户端初始化失败，将使用纯聊天模式:', error)
    }
  }
}

// 使用 Vercel AI SDK 调用 MiniMax API（支持手动工具调用）
async function callMinimaxAPI(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    console.log('[MiniMax Chat] 使用 Vercel AI SDK 调用 MiniMax API')

    // 准备消息格式
    const aiMessages: CoreMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的 BIM 桥梁设计助手。你的职责是：
1. 理解用户的桥梁设计需求
2. 提供专业的桥梁设计建议
3. 生成符合工程规范的桥梁参数
4. 使用工具函数创建 3D 桥梁模型

当用户询问需要实时信息（如天气、新闻、汇率、地点查询等）时，请在回复中直接回答（模拟数据）。

可用的工具：
- getWeather: 获取天气信息（模拟：温度 25°C，湿度 60%，晴天）
- getNews: 获取新闻资讯（模拟：AI 技术突破，全球经济复苏）
- getExchangeRate: 查询汇率（模拟：1 USD = 7.2 CNY）

请用简洁专业的语言回答，必要时使用 Markdown 格式。当用户询问这些信息时，请直接给出答案，不需要调用工具。`
      },
      ...toCoreMessages(messages)
    ]

    // 直接调用，不使用工具（简化版本）
    const result = await (generateText as any)({
      model: minimax(MINIMAX_MODEL_NAME),
      messages: aiMessages,
      maxTokens: 2048,
      temperature: 0.7,
    })

    if (result.text) {
      console.log('[MiniMax Chat] 成功获得AI回复')
      return {
        message: result.text,
        success: true
      }
    } else {
      throw new Error('MiniMax API 返回了空的响应')
    }
  } catch (error: any) {
    console.error('[MiniMax Chat] Vercel AI SDK 调用失败:', error)
    throw error
  }
}


// 健康检查方法
export async function checkMinimaxHealth(): Promise<boolean> {
  try {
    console.log('[MiniMax API] 执行健康检查')

    // 使用简单的 generateText 进行健康检查
    const result = await (generateText as any)({
      model: minimax(MINIMAX_MODEL_NAME),
      messages: [
        {
          role: 'user' as const,
          content: '你好'
        } as CoreMessage
      ],
      maxTokens: 10
    })

    return !!result.text
  } catch (error) {
    console.warn('[MiniMax API] 健康检查失败:', error)
    return false
  }
}

// 流式聊天方法
export async function streamChatWithMinimax(
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  try {
    console.log('[MiniMax Stream] 开始流式聊天请求')

    // 准备消息格式
    const aiMessages: CoreMessage[] = [
      {
        role: 'system',
        content: `你是一个专业的 BIM 桥梁设计助手。你的职责是：
1. 理解用户的桥梁设计需求
2. 提供专业的桥梁设计建议
3. 生成符合工程规范的桥梁参数
4. 使用工具函数创建 3D 桥梁模型

当用户询问需要实时信息（如天气、新闻、汇率、地点查询等）时，请在回复中直接回答（模拟数据）。

可用的工具：
- getWeather: 获取天气信息（模拟：温度 25°C，湿度 60%，晴天）
- getNews: 获取新闻资讯（模拟：AI 技术突破，全球经济复苏）
- getExchangeRate: 查询汇率（模拟：1 USD = 7.2 CNY）

请用简洁专业的语言回答，必要时使用 Markdown 格式。当用户询问这些信息时，请直接给出答案，不需要调用工具。`
      },
      ...toCoreMessages(messages)
    ]

    let fullText = ''

    // 流式调用，不使用工具
    const { textStream } = await (streamText as any)({
      model: minimax(MINIMAX_MODEL_NAME),
      messages: aiMessages,
      maxTokens: 2048,
      temperature: 0.7,
    })

    // 处理流式文本
    for await (const textDelta of textStream) {
      fullText += textDelta
      callbacks.onText?.(fullText)
    }

    callbacks.onComplete?.(fullText)

  } catch (error: any) {
    console.error('[MiniMax Stream] 流式调用失败:', error)
    callbacks.onError?.(error)
  }
}

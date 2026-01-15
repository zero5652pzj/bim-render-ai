import { generateText, streamText } from 'ai'
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

// AI 响应接口
export interface ChatResponse {
  message: string
  success: boolean
  error?: string
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

// 使用 Vercel AI SDK 调用 MiniMax API（支持自动工具调用）
async function callMinimaxAPI(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    console.log('[MiniMax Chat] 使用 Vercel AI SDK 调用 MiniMax API')

    // 准备消息格式
    const aiMessages = [
      {
        role: 'system',
        content: `你是一个专业的 BIM 桥梁设计助手。你的职责是：
1. 理解用户的桥梁设计需求
2. 提供专业的桥梁设计建议
3. 生成符合工程规范的桥梁参数
4. 使用工具函数创建 3D 桥梁模型

当用户询问需要实时信息（如天气、新闻、汇率、地点查询等）时，请使用可用的工具来获取最新信息。

请用简洁专业的语言回答，必要时使用 Markdown 格式。`
      },
      ...messages.map(m => ({ role: m.role, content: m.content }))
    ]

    // 初始化 MCP 客户端（如果需要）
    await initializeMCPIfNeeded()

    let result

    if (isMCPInitialized) {
      // 使用 MCP 工具进行自动工具调用
      try {
        const tools = getMCPTools()

        console.log('[MiniMax Chat] 使用 MCP 工具调用，工具列表:', Object.keys(tools))

        // 使用 Vercel AI SDK 的 generateText，传入 MCP 工具
        result = await generateText({
          model: minimax(MINIMAX_MODEL_NAME),
          messages: aiMessages,
          tools, // 传递 MCP 工具给 AI，让 AI 自动决定何时使用
          maxTokens: 2048,
          temperature: 0.7,
        })

        console.log('[MiniMax Chat] MCP 工具调用成功')
      } catch (mcpError) {
        console.warn('[MiniMax Chat] MCP 工具调用失败，降级到纯聊天模式:', mcpError)
        // 如果 MCP 工具调用失败，降级到纯聊天模式
        result = await generateText({
          model: minimax(MINIMAX_MODEL_NAME),
          messages: aiMessages,
          maxTokens: 2048,
          temperature: 0.7,
        })
      }
    } else {
      // 不使用 MCP 工具，纯聊天模式
      result = await generateText({
        model: minimax(MINIMAX_MODEL_NAME),
        messages: aiMessages,
        maxTokens: 2048,
        temperature: 0.7,
      })
    }

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
    const result = await generateText({
      model: minimax(MINIMAX_MODEL_NAME),
      messages: [
        {
          role: 'user',
          content: '你好'
        }
      ],
      maxTokens: 10
    })

    return !!result.text
  } catch (error) {
    console.warn('[MiniMax API] 健康检查失败:', error)
    return false
  }
}

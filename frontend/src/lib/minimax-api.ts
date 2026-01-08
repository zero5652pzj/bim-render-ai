import axios from 'axios'

// MiniMax API 配置 - 从环境变量读取
const MINIMAX_BASE_URL = import.meta.env.VITE_MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1'
const MINIMAX_MODEL_NAME = import.meta.env.VITE_MINIMAX_MODEL_NAME || 'MiniMax-M2.1'
const MINIMAX_API_KEY = import.meta.env.VITE_MINIMAX_API_KEY

// 验证必要的环境变量
if (!MINIMAX_API_KEY) {
  console.warn('[MiniMax API] 警告: 未找到 VITE_MINIMAX_API_KEY 环境变量')
}

// 创建 axios 实例
const minimaxClient = axios.create({
  baseURL: MINIMAX_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${MINIMAX_API_KEY}`,
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
minimaxClient.interceptors.request.use(
  (config) => {
    console.log('[MiniMax API] 请求:', {
      url: config.url,
      method: config.method,
      data: config.data
    })
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
minimaxClient.interceptors.response.use(
  (response) => {
    console.log('[MiniMax API] 响应:', {
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('[MiniMax API] 错误:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

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

// 纯前端 MiniMax AI 聊天方法
export async function chatWithMinimax(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    console.log('[MiniMax Chat] 开始聊天请求:', {
      消息数量: messages.length,
      最后一条消息: messages[messages.length - 1]?.content?.substring(0, 50)
    })

    // 准备请求数据
    const requestData = {
      model: MINIMAX_MODEL_NAME,
      messages: [
        {
          role: 'system',
          content: `你是一个专业的 BIM 桥梁设计助手。你的职责是：
1. 理解用户的桥梁设计需求
2. 提供专业的桥梁设计建议
3. 生成符合工程规范的桥梁参数
4. 使用工具函数创建 3D 桥梁模型

请用简洁专业的语言回答，必要时使用 Markdown 格式。`
        },
        ...messages
      ],
      max_tokens: 2048,
      temperature: 0.7,
      stream: false
    }

    // 调用 MiniMax API
    const response = await minimaxClient.post('/chat/completions', requestData)

    // 解析响应
    const aiMessage = response.data?.choices?.[0]?.message?.content

    if (aiMessage) {
      console.log('[MiniMax Chat] 成功获得AI回复')
      return {
        message: aiMessage,
        success: true
      }
    } else {
      throw new Error('MiniMax API 返回了空的响应')
    }

  } catch (error: any) {
    console.error('[MiniMax Chat] 调用失败:', error)

    // 如果是网络错误，返回降级响应
    if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      return {
        message: generateFallbackResponse(messages),
        success: true
      }
    }

    // 如果是 API 错误，返回模拟响应
    if (error.response?.status >= 400) {
      return {
        message: generateFallbackResponse(messages),
        success: true
      }
    }

    // 其他错误
    return {
      message: generateFallbackResponse(messages),
      success: true
    }
  }
}

// 生成降级响应
function generateFallbackResponse(messages: ChatMessage[]): string {
  const lastMessage = messages[messages.length - 1]?.content || ''

  // 简单的关键词匹配响应
  if (lastMessage.includes('桥') || lastMessage.includes('设计')) {
    return `您好！我是AI+BIM桥梁设计助手。我注意到您提到了"${lastMessage}"。

作为专业的桥梁设计助手，我可以帮您：

1. **设计桥梁类型** - 简支梁桥、连续梁桥、拱桥、斜拉桥等
2. **计算桥梁参数** - 跨径、梁高、材料规格等
3. **生成3D模型** - 创建可视化的桥梁结构

请告诉我您的具体设计需求，我会为您提供专业的建议！

例如：
- 生成一座100米的简支梁桥
- 设计三跨连续梁桥，每跨30米
- 创建一个拱桥，跨径50米

💡 当前使用降级响应，MiniMax API服务可能暂时不可用。`
  }

  return `您好！我是AI+BIM桥梁设计助手。

我注意到您发送了"${lastMessage}"，但这似乎不是桥梁设计相关的问题。

请告诉我您关于桥梁设计的具体需求，例如：
- "帮我设计一座100米的桥"
- "介绍简支梁桥的特点"
- "计算桥梁的承重参数"

我会为您提供专业的BIM桥梁设计建议！`
}

// 健康检查方法
export async function checkMinimaxHealth(): Promise<boolean> {
  try {
    await minimaxClient.post('/chat/completions', {
      model: MINIMAX_MODEL_NAME,
      messages: [
        {
          role: 'user',
          content: '你好'
        }
      ],
      max_tokens: 10
    })
    return true
  } catch (error) {
    console.warn('[MiniMax API] 健康检查失败:', error)
    return false
  }
}

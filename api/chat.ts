import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'

export const config = {
  runtime: 'edge',
}

// 初始化 OpenAI 客户端（支持兼容 API，如 MiniMax）
const openai = createOpenAI({
  baseURL: process.env.MINIMAX_BASE_URL || process.env.OPENAI_BASE_URL,
  apiKey: process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY,
})

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  try {
    const { messages } = await req.json()

    const result = await streamText({
      model: openai(process.env.MINIMAX_MODEL_NAME || process.env.AI_MODEL_NAME || 'gpt-4') as any,
      messages,
      maxTokens: 2048,
      temperature: 0.7,
      system: `你是一个专业的 BIM 桥梁设计助手。你的职责是：
1. 理解用户的桥梁设计需求
2. 提供专业的桥梁设计建议
3. 生成符合工程规范的桥梁参数
4. 使用工具函数创建 3D 桥梁模型

请用简洁专业的语言回答，必要时使用 Markdown 格式。`,
      tools: {
        createBridge: {
          description: '创建桥梁模型',
          parameters: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                description: '桥梁名称'
              },
              length: {
                type: 'number',
                description: '桥梁总长（米）'
              },
              bridgeType: {
                type: 'string',
                enum: ['simple', 'continuous', 'arch', 'cable-stayed'],
                description: '桥梁类型：简支梁/连续梁/拱桥/斜拉桥'
              },
              spanCount: {
                type: 'number',
                description: '跨数'
              },
            },
            required: ['name', 'length', 'bridgeType'],
          },
        },
      },
    })

    return result.toDataStreamResponse()
  } catch (error: any) {
    console.error('Chat API error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

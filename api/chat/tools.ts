// 工具处理器 - 处理AI工具调用
import { generateObject, generateText, convertToCoreMessages } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { handleToolCall, formatToolResponse, ToolResult } from '../mcp/manager'

// 初始化 OpenAI 客户端
const openai = createOpenAI({
  baseURL: process.env.MINIMAX_BASE_URL || process.env.OPENAI_BASE_URL,
  apiKey: process.env.MINIMAX_API_KEY || process.env.OPENAI_API_KEY,
})

/**
 * 执行工具调用
 * @param toolName 工具名称
 * @param parameters 工具参数
 * @returns Promise<string> 格式化的工具响应
 */
export async function executeToolCall(
  toolName: string,
  parameters: Record<string, any>
): Promise<string> {
  try {
    console.log(`[工具执行] ${toolName}:`, parameters)

    // 调用MCP工具管理器
    const toolResult: ToolResult = await handleToolCall(toolName, parameters)

    // 格式化响应
    const formattedResponse = formatToolResponse(toolResult)

    return formattedResponse

  } catch (error: any) {
    console.error(`[工具执行错误] ${toolName}:`, error)
    return `❌ **工具执行错误**\n\n错误: ${error.message}\n\n请稍后再试或联系管理员。`
  }
}

/**
 * 处理AI消息中的工具调用
 * @param messages 消息列表
 * @returns Promise<string> AI响应
 */
export async function processMessagesWithTools(messages: any[]): Promise<string> {
  try {
    console.log('[消息处理] 开始处理消息，消息数量:', messages.length)

    // 使用 convertToCoreMessages 转换消息格式
    const coreMessages = convertToCoreMessages(messages)

    // 第一轮：让AI决定是否需要调用工具
    const firstResponse = await generateText({
      model: openai(process.env.MINIMAX_MODEL_NAME || process.env.AI_MODEL_NAME || 'gpt-4') as any,
      messages: coreMessages,
      maxTokens: 1024,
      temperature: 0.7,
      system: `你是一个专业的BIM桥梁设计助手。当用户询问需要工具帮助的信息时，请明确指出需要调用什么工具，并说明原因。

可用的工具：
1. getWeather - 获取天气信息
2. getNews - 获取新闻资讯
3. getMap - 地图查询和路线规划
4. getExchangeRate - 汇率查询

请根据用户需求，选择合适的工具调用。`,
    })

    console.log('[消息处理] 第一轮AI响应:', firstResponse.text.substring(0, 200))

    // 检查是否需要调用工具
    const needsToolCall = shouldCallTool(firstResponse.text)

    if (!needsToolCall) {
      // 不需要调用工具，直接返回响应
      return firstResponse.text
    }

    // 提取工具调用信息
    const toolCallInfo = extractToolCallInfo(firstResponse.text)

    if (!toolCallInfo) {
      // 无法提取工具调用信息，返回原响应
      return firstResponse.text
    }

    // 执行工具调用
    const toolResponse = await executeToolCall(toolCallInfo.toolName, toolCallInfo.parameters)

    // 第二轮：将工具结果传递给AI，让其生成最终响应
    const finalMessages = [
      ...coreMessages,
      {
        role: 'assistant' as const,
        content: `我需要先调用工具获取信息。工具调用结果：\n\n${toolResponse}`
      }
    ]

    const finalResponse = await generateText({
      model: openai(process.env.MINIMAX_MODEL_NAME || process.env.AI_MODEL_NAME || 'gpt-4') as any,
      messages: finalMessages,
      maxTokens: 2048,
      temperature: 0.7,
      system: `你是一个专业的BIM桥梁设计助手。根据刚才获取的工具信息，为用户提供准确、有用的回答。

请用简洁专业的语言回答，必要时使用Markdown格式。如果工具返回的信息与用户问题相关，请详细解释这些信息。`,
    })

    console.log('[消息处理] 最终响应生成完成')
    return finalResponse.text

  } catch (error: any) {
    console.error('[消息处理错误]:', error)
    return `抱歉，处理您的消息时发生了错误：${error.message}\n\n请稍后再试。`
  }
}

/**
 * 判断是否需要调用工具
 * @param response AI响应
 * @returns boolean
 */
function shouldCallTool(response: string): boolean {
  const toolKeywords = [
    '调用工具',
    '使用工具',
    '需要查询',
    '需要获取',
    '需要搜索',
    'getWeather',
    'getNews',
    'getMap',
    'getExchangeRate'
  ]

  return toolKeywords.some(keyword => response.includes(keyword))
}

/**
 * 从AI响应中提取工具调用信息
 * @param response AI响应
 * @returns { toolName: string, parameters: Record<string, any> } | null
 */
function extractToolCallInfo(response: string): { toolName: string, parameters: Record<string, any> } | null {
  const toolPatterns: Record<string, RegExp> = {
    getWeather: /getWeather\s*\(\s*([^)]+)\s*\)/i,
    getNews: /getNews\s*\(\s*([^)]+)\s*\)/i,
    getMap: /getMap\s*\(\s*([^)]+)\s*\)/i,
    getExchangeRate: /getExchangeRate\s*\(\s*([^)]+)\s*\)/i
  }

  for (const [toolName, pattern] of Object.entries(toolPatterns)) {
    const match = response.match(pattern)
    if (match) {
      try {
        // 尝试解析参数
        const paramsStr = match[1]
        let parameters: Record<string, any> = {}

        if (paramsStr) {
          // 简单的参数解析
          const paramPairs = paramsStr.split(',').map(p => p.trim())
          paramPairs.forEach(pair => {
            const [key, value] = pair.split('=').map(s => s.trim())
            if (key && value) {
              // 移除引号
              const cleanValue = value.replace(/['"]/g, '')
              // 尝试转换为数字
              const numValue = Number(cleanValue)
              parameters[key] = isNaN(numValue) ? cleanValue : numValue
            }
          })
        }

        return { toolName, parameters }
      } catch (error) {
        console.error('参数解析错误:', error)
        return { toolName, parameters: {} }
      }
    }
  }

  return null
}

/**
 * 传统工具调用处理（保持与现有代码的兼容性）
 * @param toolName 工具名称
 * @param parameters 工具参数
 * @returns Promise<string> 工具响应
 */
export async function handleTraditionalToolCall(
  toolName: string,
  parameters: Record<string, any>
): Promise<string> {
  switch (toolName) {
    case 'createBridge':
      return handleCreateBridge(parameters)
    default:
      return `未知的工具: ${toolName}`
  }
}

/**
 * 处理桥梁创建工具调用
 */
async function handleCreateBridge(parameters: Record<string, any>): Promise<string> {
  const { name, length, bridgeType, spanCount } = parameters

  if (!name || !length || !bridgeType) {
    return `❌ **工具参数不完整**\n\n创建桥梁需要以下参数：\n- name: 桥梁名称\n- length: 桥梁长度\n- bridgeType: 桥梁类型`
  }

  const bridgeTypes: Record<string, string> = {
    'simple': '简支梁桥',
    'continuous': '连续梁桥',
    'arch': '拱桥',
    'cable-stayed': '斜拉桥'
  }

  const bridgeTypeName = bridgeTypes[bridgeType] || bridgeType

  return `🏗️ **桥梁创建成功**\n\n` +
         `📋 **桥梁详情**:\n` +
         `• 名称: ${name}\n` +
         `• 类型: ${bridgeTypeName}\n` +
         `• 长度: ${length}米\n` +
         `• 跨数: ${spanCount || '未指定'}\n\n` +
         `✅ 桥梁模型已创建并保存。\n\n` +
         `💡 您可以进一步调整桥梁参数或查看3D模型预览。`
}

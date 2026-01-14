// MCP工具管理器
// 统一管理所有MCP工具的调用和响应

import { getWeather } from './tools/weather'
import { getNews } from './tools/news'
import { searchLocation, getRoute, geocode } from './tools/map'
import { getExchangeRate, getCommonExchangeRates } from './tools/exchange'

export interface ToolResult {
  success: boolean
  data?: any
  error?: string
  message?: string
}

/**
 * 处理工具调用
 * @param toolName 工具名称
 * @param parameters 工具参数
 * @returns Promise<ToolResult>
 */
export async function handleToolCall(
  toolName: string,
  parameters: Record<string, any>
): Promise<ToolResult> {
  try {
    console.log(`[MCP工具调用] ${toolName}:`, parameters)

    switch (toolName) {
      case 'getWeather':
        return await handleGetWeather(parameters)

      case 'getNews':
        return await handleGetNews(parameters)

      case 'getMap':
        return await handleGetMap(parameters)

      case 'getExchangeRate':
        return await handleGetExchangeRate(parameters)

      default:
        return {
          success: false,
          error: 'UNKNOWN_TOOL',
          message: `未知的工具: ${toolName}`
        }
    }

  } catch (error: any) {
    console.error(`[MCP工具错误] ${toolName}:`, error)
    return {
      success: false,
      error: 'TOOL_EXECUTION_ERROR',
      message: `工具执行错误: ${error.message}`
    }
  }
}

/**
 * 处理天气查询
 */
async function handleGetWeather(parameters: Record<string, any>): Promise<ToolResult> {
  const { location } = parameters

  if (!location || typeof location !== 'string') {
    return {
      success: false,
      error: 'INVALID_PARAMETERS',
      message: '天气查询需要有效的位置参数'
    }
  }

  const result = await getWeather(location)

  if ('error' in result) {
    return {
      success: false,
      error: result.error,
      message: result.message
    }
  }

  return {
    success: true,
    data: result,
    message: `已获取${result.location}的天气信息`
  }
}

/**
 * 处理新闻查询
 */
async function handleGetNews(parameters: Record<string, any>): Promise<ToolResult> {
  const { category, count } = parameters

  // 默认参数
  const newsCategory = category || 'general'
  const newsCount = count && typeof count === 'number' ? Math.min(Math.max(count, 1), 10) : 5

  const result = await getNews(newsCategory, newsCount)

  if ('error' in result) {
    return {
      success: false,
      error: result.error,
      message: result.message
    }
  }

  return {
    success: true,
    data: result,
    message: `已获取${newsCount}条${newsCategory}类新闻`
  }
}

/**
 * 处理地图查询
 */
async function handleGetMap(parameters: Record<string, any>): Promise<ToolResult> {
  const { origin, destination, query } = parameters

  try {
    if (origin && destination) {
      // 路线查询
      const result = await getRoute(origin, destination)

      if ('error' in result) {
        return {
          success: false,
          error: result.error,
          message: result.message
        }
      }

      return {
        success: true,
        data: result,
        message: `已获取从${origin}到${destination}的路线信息`
      }

    } else if (query) {
      // 地点搜索
      const result = await searchLocation(query)

      if ('error' in result) {
        return {
          success: false,
          error: result.error,
          message: result.message
        }
      }

      return {
        success: true,
        data: result,
        message: `已找到${result.length}个与"${query}"相关的地点`
      }

    } else {
      return {
        success: false,
        error: 'INVALID_PARAMETERS',
        message: '地图查询需要提供起点终点或搜索关键词'
      }
    }

  } catch (error: any) {
    return {
      success: false,
      error: 'MAP_QUERY_ERROR',
      message: `地图查询错误: ${error.message}`
    }
  }
}

/**
 * 处理汇率查询
 */
async function handleGetExchangeRate(parameters: Record<string, any>): Promise<ToolResult> {
  const { from, to } = parameters

  if (!from || !to) {
    // 如果没有指定具体货币，返回常用汇率
    const result = await getCommonExchangeRates()

    if ('error' in result) {
      return {
        success: false,
        error: result.error,
        message: result.message
      }
    }

    return {
      success: true,
      data: result,
      message: '已获取常用货币汇率信息'
    }
  }

  if (typeof from !== 'string' || typeof to !== 'string') {
    return {
      success: false,
      error: 'INVALID_PARAMETERS',
      message: '汇率查询需要有效的货币代码参数'
    }
  }

  const result = await getExchangeRate(from, to)

  if ('error' in result) {
    return {
      success: false,
      error: result.error,
      message: result.message
    }
  }

  return {
    success: true,
    data: result,
    message: `已获取${result.from}到${result.to}的汇率信息`
  }
}

/**
 * 格式化工具响应用于AI
 * @param toolResult 工具执行结果
 * @returns string 格式化的响应
 */
export function formatToolResponse(toolResult: ToolResult): string {
  if (!toolResult.success) {
    return `❌ **工具调用失败**\n\n错误: ${toolResult.error}\n消息: ${toolResult.message}`
  }

  const { data, message } = toolResult

  // 根据数据类型格式化响应
  if (data && typeof data === 'object') {
    if ('temperature' in data) {
      // 天气数据
      return `🌤️ **${data.location}天气信息**\n\n` +
             `🌡️ 温度: ${data.temperature}°C\n` +
             `💧 湿度: ${data.humidity}%\n` +
             `☁️ 天气: ${data.description}\n` +
             `💨 风速: ${data.windSpeed}km/h\n` +
             `📊 气压: ${data.pressure}hPa\n` +
             `👁️ 能见度: ${data.visibility}km\n` +
             `🕒 更新时间: ${data.timestamp}\n\n` +
             `${message || '天气信息获取成功'}`

    } else if (Array.isArray(data) && data.length > 0 && 'title' in data[0]) {
      // 新闻数据
      let response = `📰 **新闻资讯** (${data.length}条)\n\n`

      data.forEach((news: any, index: number) => {
        response += `**${index + 1}. ${news.title}**\n`
        response += `${news.description}\n`
        response += `📱 来源: ${news.source}\n`
        response += `🕒 时间: ${news.publishedAt}\n`
        response += `🔗 [查看详情](${news.url})\n\n`
      })

      response += `${message || '新闻获取成功'}`
      return response

    } else if ('distance' in data && 'duration' in data) {
      // 路线数据
      return `🗺️ **路线规划**\n\n` +
             `📍 路线: ${data.origin} → ${data.destination}\n` +
             `📏 距离: ${data.distance}\n` +
             `⏱️ 时间: ${data.duration}\n\n` +
             `🛣️ **路线步骤**:\n` +
             data.steps.map((step: any, index: number) =>
               `${index + 1}. ${step.instruction} (${step.distance}, ${step.duration})`
             ).join('\n') +
             `\n\n${message || '路线信息获取成功'}`

    } else if ('from' in data && 'to' in data) {
      // 汇率数据
      return `💱 **汇率信息**\n\n` +
             `💰 汇率: 1 ${data.from} = ${data.rate.toFixed(4)} ${data.to}\n` +
             `💵 金额: ${data.amount} ${data.from} = ${data.convertedAmount.toFixed(2)} ${data.to}\n` +
             `🕒 更新时间: ${data.lastUpdate}\n\n` +
             `${message || '汇率信息获取成功'}`

    } else if (Array.isArray(data)) {
      // 通用数组数据
      let response = `📊 **查询结果** (${data.length}项)\n\n`

      data.forEach((item: any, index: number) => {
        if (item.name) {
          response += `${index + 1}. **${item.name}**\n`
          if (item.displayName) {
            response += `   📍 ${item.displayName}\n`
          }
          if (item.latitude && item.longitude) {
            response += `   🌍 坐标: ${item.latitude}, ${item.longitude}\n`
          }
          response += '\n'
        } else {
          response += `${index + 1}. ${JSON.stringify(item, null, 2)}\n\n`
        }
      })

      response += `${message || '数据获取成功'}`
      return response

    } else {
      // 其他数据
      return `📊 **查询结果**\n\n` +
             `\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`\n\n` +
             `${message || '数据获取成功'}`
    }
  }

  return `${message || '数据获取成功'}\n\n${JSON.stringify(data, null, 2)}`
}

/**
 * 检查工具是否可用
 * @param toolName 工具名称
 * @returns boolean
 */
export function isToolAvailable(toolName: string): boolean {
  const availableTools = ['getWeather', 'getNews', 'getMap', 'getExchangeRate']
  return availableTools.includes(toolName)
}

/**
 * 获取工具描述
 * @param toolName 工具名称
 * @returns string
 */
export function getToolDescription(toolName: string): string {
  const descriptions: Record<string, string> = {
    getWeather: '获取指定城市的实时天气信息',
    getNews: '获取最新新闻资讯，支持不同分类',
    getMap: '搜索地点或规划路线',
    getExchangeRate: '查询货币汇率信息'
  }

  return descriptions[toolName] || '未知工具'
}

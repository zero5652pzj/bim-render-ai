/**
 * 官方MCP服务器实现
 * 符合Model Context Protocol标准，支持工具、资源和提示
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

// 工具实现
import { getWeather, WeatherData } from './tools/weather'
import { getNews, NewsItem } from './tools/news'
import { getExchangeRate, ExchangeRateData } from './tools/exchange'
import { searchLocation, getRoute, LocationInfo, RouteInfo } from './tools/map'

// MCP服务器配置
const SERVER_NAME = 'bim-ai-tools'
const SERVER_VERSION = '1.0.0'

// 创建MCP服务器实例
const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {}, // 支持工具
      resources: {}, // 支持资源（可选）
      prompts: {}, // 支持提示（可选）
      logging: {}, // 支持日志
    },
  }
)

// 工具列表定义
const TOOLS = [
  {
    name: 'getWeather',
    description: '获取指定城市的实时天气信息',
    inputSchema: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: '城市名称，支持中英文',
        },
      },
      required: ['location'],
    },
  },
  {
    name: 'getNews',
    description: '获取最新新闻资讯，支持不同分类',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: '新闻分类：business, entertainment, general, health, science, sports, technology',
        },
        count: {
          type: 'number',
          description: '新闻数量，1-20之间',
          default: 5,
        },
        country: {
          type: 'string',
          description: '国家代码',
          default: 'cn',
        },
      },
      required: [],
    },
  },
  {
    name: 'getExchangeRate',
    description: '查询货币汇率信息',
    inputSchema: {
      type: 'object',
      properties: {
        from: {
          type: 'string',
          description: '源货币代码，如 USD、CNY',
        },
        to: {
          type: 'string',
          description: '目标货币代码，如 EUR、JPY',
        },
      },
      required: [],
    },
  },
  {
    name: 'searchLocation',
    description: '搜索地点和位置信息',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: '搜索关键词',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'getRoute',
    description: '规划两点之间的路线',
    inputSchema: {
      type: 'object',
      properties: {
        origin: {
          type: 'string',
          description: '起点地址',
        },
        destination: {
          type: 'string',
          description: '终点地址',
        },
      },
      required: ['origin', 'destination'],
    },
  },
]

// 资源定义（可选）
const RESOURCES = [
  {
    uri: 'bridge://design/standards',
    name: '桥梁设计规范',
    description: '国内外桥梁设计标准和规范',
    mimeType: 'application/json',
  },
  {
    uri: 'bridge://materials/database',
    name: '材料数据库',
    description: '常用建筑材料性能参数',
    mimeType: 'application/json',
  },
  {
    uri: 'weather://current/{location}',
    name: '实时天气数据',
    description: '指定位置的实时天气信息',
    mimeType: 'application/json',
  },
]

// 提示模板（可选）
const PROMPTS = [
  {
    name: 'bridge_design_template',
    description: '桥梁设计提示模板',
    arguments: [
      {
        name: 'bridge_type',
        description: '桥梁类型',
        required: false,
      },
      {
        name: 'span_length',
        description: '跨径长度',
        required: false,
      },
      {
        name: 'load_requirements',
        description: '荷载要求',
        required: false,
      },
    ],
  },
  {
    name: 'weather_analysis',
    description: '天气分析提示模板',
    arguments: [
      {
        name: 'location',
        description: '分析地点',
        required: true,
      },
      {
        name: 'analysis_type',
        description: '分析类型',
        required: false,
      },
    ],
  },
]

// 注册工具列表处理器
server.setRequestHandler('tools/list', async () => {
  console.log('[MCP服务器] 处理 tools/list 请求')

  return {
    tools: TOOLS.map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    })),
  }
})

// 注册工具调用处理器
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  console.log(`[MCP服务器] 处理工具调用: ${name}`, args)

  try {
    let result: any

    switch (name) {
      case 'getWeather': {
        const { location } = args

        if (!location || typeof location !== 'string') {
          throw new Error('location参数是必需的且必须为字符串')
        }

        const weatherData = await getWeather(location)

        if ('error' in weatherData) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 天气查询失败: ${weatherData.message}`,
              },
            ],
            isError: true,
          }
        }

        // 返回结构化内容
        return {
          content: [
            {
              type: 'text',
              text: `🌤️ ${weatherData.location}天气信息\n\n` +
                    `🌡️ 温度: ${weatherData.temperature}°C\n` +
                    `💧 湿度: ${weatherData.humidity}%\n` +
                    `☁️ 天气: ${weatherData.description}\n` +
                    `💨 风速: ${weatherData.windSpeed}km/h\n` +
                    `📊 气压: ${weatherData.pressure}hPa\n` +
                    `👁️ 能见度: ${weatherData.visibility}km\n` +
                    `🕒 更新时间: ${weatherData.timestamp}`,
            },
          ],
          // 包含结构化内容供AI SDK使用
          structuredContent: weatherData,
        }
      }

      case 'getNews': {
        const { category, count = 5, country = 'cn' } = args

        const newsData = await getNews(category, count, country)

        if ('error' in newsData) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 新闻查询失败: ${newsData.message}`,
              },
            ],
            isError: true,
          }
        }

        const newsText = newsData.map((news, index) =>
          `**${index + 1}. ${news.title}**\n` +
          `${news.description}\n` +
          `📱 来源: ${news.source}\n` +
          `🕒 时间: ${news.publishedAt}\n` +
          `🔗 [查看详情](${news.url})\n`
        ).join('\n')

        return {
          content: [
            {
              type: 'text',
              text: `📰 **新闻资讯** (${newsData.length}条)\n\n${newsText}`,
            },
          ],
          structuredContent: newsData,
        }
      }

      case 'getExchangeRate': {
        const { from, to } = args

        if (from && to) {
          const exchangeData = await getExchangeRate(from, to)

          if ('error' in exchangeData) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 汇率查询失败: ${exchangeData.message}`,
                },
              ],
              isError: true,
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: `💱 **汇率信息**\n\n` +
                      `💰 汇率: 1 ${exchangeData.from} = ${exchangeData.rate.toFixed(4)} ${exchangeData.to}\n` +
                      `💵 金额: ${exchangeData.amount} ${exchangeData.from} = ${exchangeData.convertedAmount.toFixed(2)} ${exchangeData.to}\n` +
                      `🕒 更新时间: ${exchangeData.lastUpdate}`,
              },
            ],
            structuredContent: exchangeData,
          }
        } else {
          // 返回常用汇率
          const { getCommonExchangeRates } = await import('./tools/exchange')
          const commonRates = await getCommonExchangeRates()

          if ('error' in commonRates) {
            return {
              content: [
                {
                  type: 'text',
                  text: `❌ 汇率查询失败: ${commonRates.message}`,
                },
              ],
              isError: true,
            }
          }

          return {
            content: [
              {
                type: 'text',
                text: `💱 **常用汇率信息** (${commonRates.length}条)\n\n` +
                      commonRates.map(rate =>
                        `• 1 ${rate.from} = ${rate.rate.toFixed(4)} ${rate.to}`
                      ).join('\n'),
              },
            ],
            structuredContent: commonRates,
          }
        }
      }

      case 'searchLocation': {
        const { query } = args

        if (!query || typeof query !== 'string') {
          throw new Error('query参数是必需的且必须为字符串')
        }

        const locationData = await searchLocation(query)

        if ('error' in locationData) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 地点搜索失败: ${locationData.message}`,
              },
            ],
            isError: true,
          }
        }

        const locationText = locationData.map((location, index) =>
          `**${index + 1}. ${location.name}**\n` +
          `📍 ${location.displayName}\n` +
          `🌍 坐标: ${location.latitude}, ${location.longitude}\n` +
          `🏷️ 类型: ${location.type}\n`
        ).join('\n')

        return {
          content: [
            {
              type: 'text',
              text: `🗺️ **地点搜索结果** (${locationData.length}项)\n\n${locationText}`,
            },
          ],
          structuredContent: locationData,
        }
      }

      case 'getRoute': {
        const { origin, destination } = args

        if (!origin || !destination) {
          throw new Error('origin和destination参数都是必需的')
        }

        const routeData = await getRoute(origin, destination)

        if ('error' in routeData) {
          return {
            content: [
              {
                type: 'text',
                text: `❌ 路线规划失败: ${routeData.message}`,
              },
            ],
            isError: true,
          }
        }

        const routeText = `🗺️ **路线规划**\n\n` +
                         `📍 路线: ${routeData.origin} → ${routeData.destination}\n` +
                         `📏 距离: ${routeData.distance}\n` +
                         `⏱️ 时间: ${routeData.duration}\n\n` +
                         `🛣️ **路线步骤**:\n` +
                         routeData.steps.map((step, index) =>
                           `${index + 1}. ${step.instruction} (${step.distance}, ${step.duration})`
                         ).join('\n')

        return {
          content: [
            {
              type: 'text',
              text: routeText,
            },
          ],
          structuredContent: routeData,
        }
      }

      default:
        throw new Error(`未知工具: ${name}`)
    }
  } catch (error: any) {
    console.error(`[MCP服务器] 工具调用失败: ${name}`, error)

    return {
      content: [
        {
          type: 'text',
          text: `❌ 工具执行失败: ${error.message}`,
        },
      ],
      isError: true,
    }
  }
})

// 注册资源列表处理器（可选）
server.setRequestHandler('resources/list', async () => {
  console.log('[MCP服务器] 处理 resources/list 请求')

  return {
    resources: RESOURCES.map(resource => ({
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      mimeType: resource.mimeType,
    })),
  }
})

// 注册资源读取处理器（可选）
server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params

  console.log(`[MCP服务器] 处理资源读取: ${uri}`)

  try {
    // 处理动态资源URI
    if (uri.startsWith('weather://current/')) {
      const location = uri.replace('weather://current/', '')

      const weatherData = await getWeather(location)

      if ('error' in weatherData) {
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: JSON.stringify({ error: weatherData.message }),
            },
          ],
        }
      }

      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(weatherData),
          },
        ],
      }
    }

    // 静态资源
    const resource = RESOURCES.find(r => r.uri === uri)

    if (!resource) {
      throw new Error(`资源未找到: ${uri}`)
    }

    // 返回模拟数据
    const resourceData = {
      uri: resource.uri,
      name: resource.name,
      description: resource.description,
      data: '这是模拟资源数据',
    }

    return {
      contents: [
        {
          uri,
          mimeType: resource.mimeType,
          text: JSON.stringify(resourceData),
        },
      ],
    }
  } catch (error: any) {
    console.error(`[MCP服务器] 资源读取失败: ${uri}`, error)

    return {
      contents: [
        {
          uri,
          mimeType: 'application/json',
          text: JSON.stringify({ error: error.message }),
        },
      ],
    }
  }
})

// 注册提示列表处理器（可选，实验性）
server.setRequestHandler('experimental/prompts/list', async () => {
  console.log('[MCP服务器] 处理 prompts/list 请求')

  return {
    prompts: PROMPTS.map(prompt => ({
      name: prompt.name,
      description: prompt.description,
      arguments: prompt.arguments,
    })),
  }
})

// 注册提示获取处理器（可选，实验性）
server.setRequestHandler('experimental/prompts/get', async (request) => {
  const { name, arguments: args } = request.params

  console.log(`[MCP服务器] 处理提示获取: ${name}`, args)

  try {
    let prompt: any

    switch (name) {
      case 'bridge_design_template': {
        const bridgeType = args?.bridge_type || '简支梁桥'
        const spanLength = args?.span_length || '50m'
        const loadRequirements = args?.load_requirements || '公路-I级'

        prompt = {
          description: '桥梁设计提示模板',
          messages: [
            {
              role: 'user',
              content: `请设计一座${bridgeType}，跨径为${spanLength}，荷载要求为${loadRequirements}。请提供详细的设计参数、结构方案和材料选择。`,
            },
          ],
        }
        break
      }

      case 'weather_analysis': {
        const location = args?.location || '北京'
        const analysisType = args?.analysis_type || 'current'

        prompt = {
          description: '天气分析提示模板',
          messages: [
            {
              role: 'user',
              content: `请分析${location}的${analysisType}天气情况，并结合天气条件对桥梁施工的影响提出建议。`,
            },
          ],
        }
        break
      }

      default:
        throw new Error(`未知提示: ${name}`)
    }

    return prompt
  } catch (error: any) {
    console.error(`[MCP服务器] 提示获取失败: ${name}`, error)
    throw error
  }
})

// 导出服务器实例和处理器
export { server }

// 暴露处理器以便HTTP服务器使用
export const handlers = {
  'tools/list': server._handlers['tools/list'],
  'tools/call': server._handlers['tools/call'],
  'resources/list': server._handlers['resources/list'],
  'resources/read': server._handlers['resources/read'],
  'experimental/prompts/list': server._handlers['experimental/prompts/list'],
  'experimental/prompts/get': server._handlers['experimental/prompts/get'],
}

// 如果直接运行此文件，则启动stdio服务器
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const transport = new StdioServerTransport()
  server.connect(transport)
  console.log('[MCP服务器] Stdio服务器已启动')
}
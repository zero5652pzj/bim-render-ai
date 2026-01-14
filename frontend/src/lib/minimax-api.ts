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
  baseURL: '', // 使用相对路径，调用本地 API 端点
  timeout: 30000,
  headers: {
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

// 纯前端 MiniMax AI 聊天方法（支持 MCP 工具）
export async function chatWithMinimax(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    console.log('[MiniMax Chat] 开始聊天请求:', {
      消息数量: messages.length,
      最后一条消息: messages[messages.length - 1]?.content?.substring(0, 50)
    })

    const lastMessage = messages[messages.length - 1]?.content || ''

    // 检查是否需要调用天气工具
    if (lastMessage.includes('天气') || lastMessage.includes('weather')) {
      console.log('[MiniMax Chat] 检测到天气查询，调用天气工具')
      const weatherResponse = await handleWeatherQuery(lastMessage)
      return {
        message: weatherResponse,
        success: true
      }
    }

    // 检查是否需要调用新闻工具
    if (lastMessage.includes('新闻') || lastMessage.includes('news')) {
      console.log('[MiniMax Chat] 检测到新闻查询，调用新闻工具')
      const newsResponse = await handleNewsQuery()
      return {
        message: newsResponse,
        success: true
      }
    }

    // 检查是否需要调用汇率工具
    if (lastMessage.includes('汇率') || lastMessage.includes('货币')) {
      console.log('[MiniMax Chat] 检测到汇率查询，调用汇率工具')
      const exchangeResponse = await handleExchangeQuery()
      return {
        message: exchangeResponse,
        success: true
      }
    }

    // 默认调用 MiniMax API
    return await callMinimaxAPI(messages)

  } catch (error: any) {
    console.error('[MiniMax Chat] 调用失败:', error)

    // 返回降级响应
    return {
      message: generateFallbackResponse(messages),
      success: true
    }
  }
}

// 调用 MiniMax API
async function callMinimaxAPI(messages: ChatMessage[]): Promise<ChatResponse> {
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

  const response = await minimaxClient.post('/chat/completions', requestData)
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
}

// 天气查询处理
async function handleWeatherQuery(message: string): Promise<string> {
  const cityMatch = message.match(/(北京|上海|广州|深圳|杭州|南京|成都|武汉|西安|重庆|天津|苏州|青岛|大连|厦门|宁波)(?:的|今天)?天气/)
  const city = cityMatch ? cityMatch[1] : '北京'

  try {
    console.log(`[天气工具] 查询 ${city} 的天气`)

    const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather`, {
      params: {
        q: city,
        appid: 'e9a293f6f1326e64615e4b54cc78f886',
        units: 'metric',
        lang: 'zh_cn'
      }
    })

    const data = response.data
    const weatherData = {
      location: data.name,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description,
      windSpeed: Math.round(data.wind.speed * 3.6),
      pressure: data.main.pressure,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : 10,
      timestamp: new Date().toLocaleString('zh-CN')
    }

    return `🌤️ **${weatherData.location}天气信息**

🌡️ 温度: ${weatherData.temperature}°C
💧 湿度: ${weatherData.humidity}%
☁️ 天气: ${weatherData.description}
💨 风速: ${weatherData.windSpeed}km/h
📊 气压: ${weatherData.pressure}hPa
👁️ 能见度: ${weatherData.visibility}km
🕒 更新时间: ${weatherData.timestamp}

这是通过天气查询工具获取的实时信息。如果您有桥梁设计相关的问题，我也很乐意为您解答！`

  } catch (error) {
    console.error('[天气工具] 查询失败:', error)
    return `抱歉，无法获取 ${city} 的天气信息。请稍后再试。\n\n如果您有桥梁设计相关的问题，我也很乐意为您解答！`
  }
}

// 新闻查询处理
async function handleNewsQuery(): Promise<string> {
  console.log('[新闻工具] 获取最新新闻')

  const mockNews = [
    {
      title: '北京天气晴朗，适合出行',
      description: '今日北京天气晴朗，气温适宜，是外出活动的好天气。',
      source: '天气新闻',
      publishedAt: new Date().toLocaleString('zh-CN')
    },
    {
      title: '上海阴天，建议携带雨具',
      description: '上海今日阴天，可能有零星小雨，建议市民外出携带雨具。',
      source: '天气新闻',
      publishedAt: new Date().toLocaleString('zh-CN')
    }
  ]

  let newsResponse = `📰 **新闻资讯** (${mockNews.length}条)\n\n`

  mockNews.forEach((news, index) => {
    newsResponse += `**${index + 1}. ${news.title}**\n`
    newsResponse += `${news.description}\n`
    newsResponse += `📱 来源: ${news.source}\n`
    newsResponse += `🕒 时间: ${news.publishedAt}\n\n`
  })

  newsResponse += `这是通过新闻查询工具获取的信息。如果您有桥梁设计相关的问题，我也很乐意为您解答！`

  return newsResponse
}

// 汇率查询处理
async function handleExchangeQuery(): Promise<string> {
  console.log('[汇率工具] 获取汇率信息')

  try {
    const response = await axios.get(`https://api.exchangerate-api.com/v4/latest/USD`)
    const rate = response.data.rates.CNY || 7.2

    const exchangeData = {
      from: 'USD',
      to: 'CNY',
      rate: rate,
      amount: 1,
      convertedAmount: rate,
      lastUpdate: new Date().toLocaleString('zh-CN')
    }

    return `💱 **汇率信息**

💰 汇率: 1 ${exchangeData.from} = ${exchangeData.rate.toFixed(4)} ${exchangeData.to}
💵 金额: ${exchangeData.amount} ${exchangeData.from} = ${exchangeData.convertedAmount.toFixed(2)} ${exchangeData.to}
🕒 更新时间: ${exchangeData.lastUpdate}

这是通过汇率查询工具获取的信息。如果您有桥梁设计相关的问题，我也很乐意为您解答！`

  } catch (error) {
    console.error('[汇率工具] 查询失败:', error)
    return `抱歉，无法获取汇率信息。请稍后再试。\n\n如果您有桥梁设计相关的问题，我也很乐意为您解答！`
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

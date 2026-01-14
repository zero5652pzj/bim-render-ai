// 新闻查询工具实现
// 使用NewsAPI（需要API Key）
// 免费版本：https://newsapi.org/

export interface NewsItem {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string
}

export interface NewsError {
  error: string
  message: string
}

// 新闻API配置
const NEWS_API_KEY = process.env.NEWS_API_KEY
const NEWS_BASE_URL = 'https://newsapi.org/v2'

/**
 * 获取新闻
 * @param category 新闻分类（business, entertainment, general, health, science, sports, technology）
 * @param count 新闻数量
 * @param country 国家代码（us, cn, gb, fr, de等）
 * @returns Promise<NewsItem[] | NewsError>
 */
export async function getNews(
  category?: string,
  count: number = 5,
  country: string = 'cn'
): Promise<NewsItem[] | NewsError> {
  try {
    if (!NEWS_API_KEY) {
      return {
        error: 'API_KEY_MISSING',
        message: '新闻API密钥未配置'
      }
    }

    if (count < 1 || count > 20) {
      return {
        error: 'INVALID_COUNT',
        message: '新闻数量必须在1-20之间'
      }
    }

    let url = `${NEWS_BASE_URL}/top-headlines?country=${country}&pageSize=${count}&apiKey=${NEWS_API_KEY}`

    // 如果指定了分类，添加到请求中
    if (category && category !== 'general') {
      url = `${NEWS_BASE_URL}/top-headlines?country=${country}&category=${category}&pageSize=${count}&apiKey=${NEWS_API_KEY}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 429) {
        return {
          error: 'RATE_LIMIT',
          message: 'API请求频率超限，请稍后再试'
        }
      }
      return {
        error: 'API_ERROR',
        message: `新闻API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (data.status !== 'ok') {
      return {
        error: 'API_ERROR',
        message: '新闻API返回错误状态'
      }
    }

    // 处理新闻数据
    const newsItems: NewsItem[] = data.articles.map((article: any) => ({
      title: article.title || '无标题',
      description: article.description || article.content || '无描述',
      url: article.url,
      source: article.source?.name || '未知来源',
      publishedAt: new Date(article.publishedAt).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
      }),
      imageUrl: article.urlToImage
    }))

    return newsItems

  } catch (error: any) {
    console.error('新闻查询错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 搜索新闻
 * @param query 搜索关键词
 * @param count 新闻数量
 * @param sortBy 排序方式（relevancy, popularity, publishedAt）
 * @returns Promise<NewsItem[] | NewsError>
 */
export async function searchNews(
  query: string,
  count: number = 5,
  sortBy: 'relevancy' | 'popularity' | 'publishedAt' = 'publishedAt'
): Promise<NewsItem[] | NewsError> {
  try {
    if (!NEWS_API_KEY) {
      return {
        error: 'API_KEY_MISSING',
        message: '新闻API密钥未配置'
      }
    }

    if (!query.trim()) {
      return {
        error: 'INVALID_QUERY',
        message: '搜索关键词不能为空'
      }
    }

    if (count < 1 || count > 20) {
      return {
        error: 'INVALID_COUNT',
        message: '新闻数量必须在1-20之间'
      }
    }

    const encodedQuery = encodeURIComponent(query.trim())
    const url = `${NEWS_BASE_URL}/everything?q=${encodedQuery}&sortBy=${sortBy}&pageSize=${count}&apiKey=${NEWS_API_KEY}`

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 429) {
        return {
          error: 'RATE_LIMIT',
          message: 'API请求频率超限，请稍后再试'
        }
      }
      return {
        error: 'API_ERROR',
        message: `新闻API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (data.status !== 'ok') {
      return {
        error: 'API_ERROR',
        message: '新闻API返回错误状态'
      }
    }

    // 处理新闻数据
    const newsItems: NewsItem[] = data.articles.map((article: any) => ({
      title: article.title || '无标题',
      description: article.description || article.content || '无描述',
      url: article.url,
      source: article.source?.name || '未知来源',
      publishedAt: new Date(article.publishedAt).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
      }),
      imageUrl: article.urlToImage
    }))

    return newsItems

  } catch (error: any) {
    console.error('新闻搜索错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取科技新闻
 * @param count 新闻数量
 * @returns Promise<NewsItem[] | NewsError>
 */
export async function getTechNews(count: number = 5): Promise<NewsItem[] | NewsError> {
  return getNews('technology', count)
}

/**
 * 获取体育新闻
 * @param count 新闻数量
 * @returns Promise<NewsItem[] | NewsError>
 */
export async function getSportsNews(count: number = 5): Promise<NewsItem[] | NewsError> {
  return getNews('sports', count)
}

/**
 * 获取娱乐新闻
 * @param count 新闻数量
 * @returns Promise<NewsItem[] | NewsError>
 */
export async function getEntertainmentNews(count: number = 5): Promise<NewsItem[] | NewsError> {
  return getNews('entertainment', count)
}

/**
 * 获取健康新闻
 * @param count 新闻数量
 * @returns Promise<NewsItem[] | NewsError>
 */
export async function getHealthNews(count: number = 5): Promise<NewsItem[] | NewsError> {
  return getNews('health', count)
}

/**
 * 获取商业新闻
 * @param count 新闻数量
 * @returns Promise<NewsItem[] | NewsError>
 */
export async function getBusinessNews(count: number = 5): Promise<NewsItem[] | NewsError> {
  return getNews('business', count)
}

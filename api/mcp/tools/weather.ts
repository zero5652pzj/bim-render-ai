// 天气查询工具实现
// 使用OpenWeatherMap API（需要API Key）
// 免费版本：https://openweathermap.org/api

export interface WeatherData {
  location: string
  temperature: number
  humidity: number
  description: string
  windSpeed: number
  pressure: number
  visibility: number
  uvIndex?: number
  timestamp: string
}

export interface WeatherError {
  error: string
  message: string
}

// 天气API配置
const WEATHER_API_KEY = process.env.WEATHER_API_KEY
const WEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

/**
 * 获取天气信息
 * @param location 位置名称
 * @returns Promise<WeatherData | WeatherError>
 */
export async function getWeather(location: string): Promise<WeatherData | WeatherError> {
  try {
    if (!WEATHER_API_KEY) {
      return {
        error: 'API_KEY_MISSING',
        message: '天气API密钥未配置'
      }
    }

    // 编码位置名称
    const encodedLocation = encodeURIComponent(location)

    // 调用OpenWeatherMap API
    const response = await fetch(
      `${WEATHER_BASE_URL}/weather?q=${encodedLocation}&appid=${WEATHER_API_KEY}&units=metric&lang=zh_cn`
    )

    if (!response.ok) {
      if (response.status === 404) {
        return {
          error: 'LOCATION_NOT_FOUND',
          message: `未找到位置"${location}"的天气信息`
        }
      }
      return {
        error: 'API_ERROR',
        message: `天气API错误: ${response.status}`
      }
    }

    const data = await response.json()

    // 构建返回数据
    const weatherData: WeatherData = {
      location: data.name || location,
      temperature: Math.round(data.main.temp),
      humidity: data.main.humidity,
      description: data.weather[0].description || '未知',
      windSpeed: Math.round(data.wind?.speed || 0),
      pressure: data.main.pressure,
      visibility: Math.round((data.visibility || 10000) / 1000), // 转换为公里
      uvIndex: data.uvi ? Math.round(data.uvi) : undefined,
      timestamp: new Date().toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
      })
    }

    return weatherData

  } catch (error: any) {
    console.error('天气查询错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取未来几天天气预报
 * @param location 位置名称
 * @param days 天数（1-5天）
 * @returns Promise<WeatherForecast | WeatherError>
 */
export async function getWeatherForecast(
  location: string,
  days: number = 5
): Promise<WeatherData[] | WeatherError> {
  try {
    if (!WEATHER_API_KEY) {
      return {
        error: 'API_KEY_MISSING',
        message: '天气API密钥未配置'
      }
    }

    if (days < 1 || days > 5) {
      return {
        error: 'INVALID_DAYS',
        message: '天气预报天数必须在1-5天之间'
      }
    }

    const encodedLocation = encodeURIComponent(location)

    // 使用5天天气预报API
    const response = await fetch(
      `${WEATHER_BASE_URL}/forecast?q=${encodedLocation}&appid=${WEATHER_API_KEY}&units=metric&lang=zh_cn`
    )

    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `天气预报API错误: ${response.status}`
      }
    }

    const data = await response.json()

    // 处理预报数据（每3小时一个数据点）
    const dailyForecasts: WeatherData[] = []
    const forecastMap = new Map<string, any[]>()

    // 按日期分组
    data.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toDateString()
      if (!forecastMap.has(date)) {
        forecastMap.set(date, [])
      }
      forecastMap.get(date)!.push(item)
    })

    // 取每天中午12点的数据作为当天预报
    Array.from(forecastMap.keys()).slice(0, days).forEach(date => {
      const dayData = forecastMap.get(date)!
      const noonData = dayData.find(item => {
        const hour = new Date(item.dt * 1000).getHours()
        return hour >= 11 && hour <= 13
      }) || dayData[0] // 如果没有中午数据，取第一个

      if (noonData) {
        dailyForecasts.push({
          location: data.city?.name || location,
          temperature: Math.round(noonData.main.temp),
          humidity: noonData.main.humidity,
          description: noonData.weather[0].description || '未知',
          windSpeed: Math.round(noonData.wind?.speed || 0),
          pressure: noonData.main.pressure,
          visibility: Math.round((noonData.visibility || 10000) / 1000),
          timestamp: new Date(noonData.dt * 1000).toLocaleDateString('zh-CN')
        })
      }
    })

    return dailyForecasts

  } catch (error: any) {
    console.error('天气预报查询错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取当前位置的天气（使用IP定位）
 * @returns Promise<WeatherData | WeatherError>
 */
export async function getWeatherByLocation(): Promise<WeatherData | WeatherError> {
  try {
    // 使用免费的IP地理定位服务
    const geoResponse = await fetch('https://ipapi.co/json/')

    if (!geoResponse.ok) {
      return {
        error: 'LOCATION_ERROR',
        message: '无法获取当前位置信息'
      }
    }

    const geoData = await geoResponse.json()
    const city = geoData.city || geoData.region || '北京'

    return getWeather(city)

  } catch (error: any) {
    console.error('位置获取错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `无法获取位置信息: ${error.message}`
    }
  }
}

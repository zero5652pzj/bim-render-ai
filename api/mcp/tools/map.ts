// 地图查询工具实现
// 使用OpenStreetMap Nominatim API（免费，无需API Key）
// https://nominatim.openstreetmap.org/

export interface LocationInfo {
  name: string
  displayName: string
  latitude: number
  longitude: number
  country: string
  state?: string
  city?: string
  type: string
  importance: number
}

export interface RouteInfo {
  distance: string
  duration: string
  steps: RouteStep[]
}

export interface RouteStep {
  instruction: string
  distance: string
  duration: string
}

export interface MapError {
  error: string
  message: string
}

// 地图API配置
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

/**
 * 搜索地点
 * @param query 搜索关键词
 * @param limit 结果数量限制
 * @returns Promise<LocationInfo[] | MapError>
 */
export async function searchLocation(
  query: string,
  limit: number = 5
): Promise<LocationInfo[] | MapError> {
  try {
    if (!query.trim()) {
      return {
        error: 'INVALID_QUERY',
        message: '搜索关键词不能为空'
      }
    }

    if (limit < 1 || limit > 10) {
      return {
        error: 'INVALID_LIMIT',
        message: '结果数量限制必须在1-10之间'
      }
    }

    const encodedQuery = encodeURIComponent(query.trim())
    const url = `${NOMINATIM_BASE_URL}/search?q=${encodedQuery}&format=json&limit=${limit}&addressdetails=1&countrycodes=cn`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BIM-Bridge-AI/1.0'
      }
    })

    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `地图API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: `未找到"${query}"相关的地点信息`
      }
    }

    // 处理地点数据
    const locations: LocationInfo[] = data.map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      country: item.address?.country || '',
      state: item.address?.state,
      city: item.address?.city || item.address?.town || item.address?.village,
      type: item.type || 'unknown',
      importance: parseFloat(item.importance) || 0
    }))

    return locations

  } catch (error: any) {
    console.error('地点搜索错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取地理编码（地址转坐标）
 * @param address 地址
 * @returns Promise<LocationInfo | MapError>
 */
export async function geocode(address: string): Promise<LocationInfo | MapError> {
  try {
    if (!address.trim()) {
      return {
        error: 'INVALID_ADDRESS',
        message: '地址不能为空'
      }
    }

    const encodedAddress = encodeURIComponent(address.trim())
    const url = `${NOMINATIM_BASE_URL}/search?q=${encodedAddress}&format=json&limit=1&addressdetails=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BIM-Bridge-AI/1.0'
      }
    })

    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `地理编码API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: `未找到地址"${address}"的坐标信息`
      }
    }

    const item = data[0]
    const location: LocationInfo = {
      name: item.name || address,
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      country: item.address?.country || '',
      state: item.address?.state,
      city: item.address?.city || item.address?.town || item.address?.village,
      type: item.type || 'unknown',
      importance: parseFloat(item.importance) || 0
    }

    return location

  } catch (error: any) {
    console.error('地理编码错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取逆地理编码（坐标转地址）
 * @param latitude 纬度
 * @param longitude 经度
 * @returns Promise<LocationInfo | MapError>
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number
): Promise<LocationInfo | MapError> {
  try {
    if (latitude < -90 || latitude > 90) {
      return {
        error: 'INVALID_LATITUDE',
        message: '纬度必须在-90到90之间'
      }
    }

    if (longitude < -180 || longitude > 180) {
      return {
        error: 'INVALID_LONGITUDE',
        message: '经度必须在-180到180之间'
      }
    }

    const url = `${NOMINATIM_BASE_URL}/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BIM-Bridge-AI/1.0'
      }
    })

    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `逆地理编码API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (!data || !data.lat) {
      return {
        error: 'NO_RESULTS',
        message: `坐标(${latitude}, ${longitude})附近没有找到地址信息`
      }
    }

    const location: LocationInfo = {
      name: data.name || data.display_name.split(',')[0],
      displayName: data.display_name,
      latitude: parseFloat(data.lat),
      longitude: parseFloat(data.lon),
      country: data.address?.country || '',
      state: data.address?.state,
      city: data.address?.city || data.address?.town || data.address?.village,
      type: data.type || 'unknown',
      importance: parseFloat(data.importance) || 0
    }

    return location

  } catch (error: any) {
    console.error('逆地理编码错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取两点之间的路线（简化版）
 * @param origin 起点
 * @param destination 终点
 * @returns Promise<RouteInfo | MapError>
 */
export async function getRoute(
  origin: string,
  destination: string
): Promise<RouteInfo | MapError> {
  try {
    if (!origin.trim() || !destination.trim()) {
      return {
        error: 'INVALID_ROUTE',
        message: '起点和终点都不能为空'
      }
    }

    // 使用OSRM路线规划API（免费）
    const osrmBaseUrl = 'https://router.project-osrm.org'

    // 先获取起点和终点的坐标
    const originLocation = await geocode(origin)
    const destinationLocation = await geocode(destination)

    if ('error' in originLocation) {
      return originLocation
    }

    if ('error' in destinationLocation) {
      return destinationLocation
    }

    // 调用OSRM路线API
    const routeUrl = `${osrmBaseUrl}/route/v1/driving/${originLocation.longitude},${originLocation.latitude};${destinationLocation.longitude},${destinationLocation.latitude}?overview=full&geometries=geojson&steps=true&language=zh`

    const response = await fetch(routeUrl)

    if (!response.ok) {
      // 如果OSRM失败，返回简化信息
      return {
        distance: '距离未知',
        duration: '时间未知',
        steps: [{
          instruction: `从${origin}到${destination}`,
          distance: '距离未知',
          duration: '时间未知'
        }]
      }
    }

    const data = await response.json()

    if (!data.routes || data.routes.length === 0) {
      return {
        error: 'NO_ROUTE',
        message: `无法找到从${origin}到${destination}的路线`
      }
    }

    const route = data.routes[0]
    const distance = (route.distance / 1000).toFixed(1) // 转换为公里
    const duration = Math.round(route.duration / 60) // 转换为分钟

    // 处理路线步骤
    const steps: RouteStep[] = []
    route.legs.forEach((leg: any) => {
      leg.steps.forEach((step: any) => {
        steps.push({
          instruction: step.maneuver?.instruction || step.name || '继续前进',
          distance: (step.distance / 1000).toFixed(1) + 'km',
          duration: Math.round(step.duration / 60) + '分钟'
        })
      })
    })

    return {
      distance: `${distance}公里`,
      duration: `${duration}分钟`,
      steps
    }

  } catch (error: any) {
    console.error('路线规划错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 搜索附近的地点
 * @param latitude 纬度
 * @param longitude 经度
 * @param query 搜索关键词
 * @param radius 搜索半径（米）
 * @returns Promise<LocationInfo[] | MapError>
 */
export async function searchNearby(
  latitude: number,
  longitude: number,
  query: string = 'restaurant',
  radius: number = 1000
): Promise<LocationInfo[] | MapError> {
  try {
    if (latitude < -90 || latitude > 90) {
      return {
        error: 'INVALID_LATITUDE',
        message: '纬度必须在-90到90之间'
      }
    }

    if (longitude < -180 || longitude > 180) {
      return {
        error: 'INVALID_LONGITUDE',
        message: '经度必须在-180到180之间'
      }
    }

    if (!query.trim()) {
      return {
        error: 'INVALID_QUERY',
        message: '搜索关键词不能为空'
      }
    }

    const encodedQuery = encodeURIComponent(query.trim())
    const url = `${NOMINATIM_BASE_URL}/search?lat=${latitude}&lon=${longitude}&q=${encodedQuery}&format=json&limit=10&addressdetails=1&bounded=1&viewbox=${longitude - 0.01},${latitude + 0.01},${longitude + 0.01},${latitude - 0.01}`

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'BIM-Bridge-AI/1.0'
      }
    })

    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `附近搜索API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (!Array.isArray(data) || data.length === 0) {
      return {
        error: 'NO_RESULTS',
        message: `附近没有找到"${query}"相关的地点`
      }
    }

    const locations: LocationInfo[] = data.map((item: any) => ({
      name: item.name || item.display_name.split(',')[0],
      displayName: item.display_name,
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      country: item.address?.country || '',
      state: item.address?.state,
      city: item.address?.city || item.address?.town || item.address?.village,
      type: item.type || 'unknown',
      importance: parseFloat(item.importance) || 0
    }))

    return locations

  } catch (error: any) {
    console.error('附近搜索错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

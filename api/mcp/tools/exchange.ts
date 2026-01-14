// 汇率查询工具实现
// 使用ExchangeRate-API（免费版本）
// https://exchangerate-api.com/

export interface ExchangeRateData {
  from: string
  to: string
  rate: number
  amount: number
  convertedAmount: number
  lastUpdate: string
}

export interface CurrencyList {
  code: string
  name: string
  symbol: string
}

export interface ExchangeError {
  error: string
  message: string
}

// 汇率API配置
const EXCHANGE_API_KEY = process.env.EXCHANGE_API_KEY
const EXCHANGE_BASE_URL = 'https://v6.exchangerate-api.com/v6'

// 支持的货币代码和名称
export const CURRENCIES: CurrencyList[] = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'CAD', name: '加拿大元', symbol: 'C$' },
  { code: 'AUD', name: '澳大利亚元', symbol: 'A$' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$' },
  { code: 'THB', name: '泰铢', symbol: '฿' },
  { code: 'INR', name: '印度卢比', symbol: '₹' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$' },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽' },
  { code: 'ZAR', name: '南非兰特', symbol: 'R' },
  { code: 'MXN', name: '墨西哥比索', symbol: '$' }
]

/**
 * 获取汇率信息
 * @param from 源货币代码
 * @param to 目标货币代码
 * @param amount 金额（默认为1）
 * @returns Promise<ExchangeRateData | ExchangeError>
 */
export async function getExchangeRate(
  from: string,
  to: string,
  amount: number = 1
): Promise<ExchangeRateData | ExchangeError> {
  try {
    if (!EXCHANGE_API_KEY) {
      return {
        error: 'API_KEY_MISSING',
        message: '汇率API密钥未配置'
      }
    }

    if (!from || !to) {
      return {
        error: 'INVALID_CURRENCY',
        message: '货币代码不能为空'
      }
    }

    if (amount <= 0) {
      return {
        error: 'INVALID_AMOUNT',
        message: '金额必须大于0'
      }
    }

    // 转换为大写
    const fromCode = from.toUpperCase()
    const toCode = to.toUpperCase()

    const url = `${EXCHANGE_BASE_URL}/${EXCHANGE_API_KEY}/pair/${fromCode}/${toCode}/${amount}`

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 400) {
        return {
          error: 'CURRENCY_NOT_SUPPORTED',
          message: `不支持的货币代码: ${fromCode} -> ${toCode}`
        }
      }
      return {
        error: 'API_ERROR',
        message: `汇率API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (data.result !== 'success') {
      return {
        error: 'API_ERROR',
        message: '汇率API返回错误'
      }
    }

    const exchangeData: ExchangeRateData = {
      from: data.base_code,
      to: data.target_code,
      rate: parseFloat(data.conversion_rate),
      amount: data.base_code_amount,
      convertedAmount: parseFloat(data.conversion_result),
      lastUpdate: new Date(data.time_last_update_utc).toLocaleString('zh-CN', {
        timeZone: 'Asia/Shanghai',
        hour12: false
      })
    }

    return exchangeData

  } catch (error: any) {
    console.error('汇率查询错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取所有支持的货币列表
 * @returns Promise<CurrencyList[] | ExchangeError>
 */
export async function getSupportedCurrencies(): Promise<CurrencyList[] | ExchangeError> {
  try {
    if (!EXCHANGE_API_KEY) {
      return {
        error: 'API_KEY_MISSING',
        message: '汇率API密钥未配置'
      }
    }

    const url = `${EXCHANGE_BASE_URL}/${EXCHANGE_API_KEY}/codes`

    const response = await fetch(url)

    if (!response.ok) {
      return {
        error: 'API_ERROR',
        message: `获取货币列表API错误: ${response.status}`
      }
    }

    const data = await response.json()

    if (data.result !== 'success') {
      return {
        error: 'API_ERROR',
        message: '获取货币列表API返回错误'
      }
    }

    // 过滤出我们支持的货币
    const supportedCodes = new Set(CURRENCIES.map(c => c.code))
    const supportedCurrencies: CurrencyList[] = data.supported_codes
      .filter(([code]: [string, string]) => supportedCodes.has(code))
      .map(([code, name]: [string, string]) => {
        const currency = CURRENCIES.find(c => c.code === code)
        return {
          code,
          name: currency?.name || name,
          symbol: currency?.symbol || code
        }
      })

    return supportedCurrencies

  } catch (error: any) {
    console.error('获取货币列表错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 批量获取汇率（从一种货币到多种货币）
 * @param from 源货币代码
 * @param toCodes 目标货币代码数组
 * @param amount 金额
 * @returns Promise<ExchangeRateData[] | ExchangeError>
 */
export async function getBatchExchangeRates(
  from: string,
  toCodes: string[],
  amount: number = 1
): Promise<ExchangeRateData[] | ExchangeError> {
  try {
    if (!EXCHANGE_API_KEY) {
      return {
        error: 'API_KEY_MISSING',
        message: '汇率API密钥未配置'
      }
    }

    const fromCode = from.toUpperCase()
    const results: ExchangeRateData[] = []

    // 逐个查询（因为免费版本不支持批量查询）
    for (const toCode of toCodes) {
      const result = await getExchangeRate(fromCode, toCode, amount)
      if ('error' in result) {
        // 如果某个货币查询失败，继续查询其他货币
        continue
      }
      results.push(result)
    }

    return results

  } catch (error: any) {
    console.error('批量汇率查询错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取货币代码对应的货币信息
 * @param code 货币代码
 * @returns CurrencyList | undefined
 */
export function getCurrencyInfo(code: string): CurrencyList | undefined {
  return CURRENCIES.find(c => c.code === code.toUpperCase())
}

/**
 * 格式化金额显示
 * @param amount 金额
 * @param currency 货币代码
 * @returns string
 */
export function formatCurrency(amount: number, currency: string): string {
  const currencyInfo = getCurrencyInfo(currency)

  if (!currencyInfo) {
    return `${amount.toFixed(2)} ${currency}`
  }

  const symbol = currencyInfo.symbol
  const formattedAmount = amount.toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })

  // 根据货币类型决定符号位置
  if (['USD', 'CAD', 'AUD', 'SGD', 'HKD'].includes(currency.toUpperCase())) {
    return `${symbol}${formattedAmount}`
  } else {
    return `${formattedAmount}${symbol}`
  }
}

/**
 * 获取常用汇率
 * @returns Promise<ExchangeRateData[] | ExchangeError>
 */
export async function getCommonExchangeRates(): Promise<ExchangeRateData[] | ExchangeError> {
  try {
    const fromCode = 'USD' // 以美元为基准
    const toCodes = ['CNY', 'EUR', 'GBP', 'JPY', 'KRW']

    return getBatchExchangeRates(fromCode, toCodes)

  } catch (error: any) {
    console.error('获取常用汇率错误:', error)
    return {
      error: 'NETWORK_ERROR',
      message: `网络错误: ${error.message}`
    }
  }
}

/**
 * 获取人民币汇率
 * @param toCode 目标货币代码
 * @param amount 金额
 * @returns Promise<ExchangeRateData | ExchangeError>
 */
export async function getCNYExchangeRate(
  toCode: string,
  amount: number = 1
): Promise<ExchangeRateData | ExchangeError> {
  return getExchangeRate('CNY', toCode, amount)
}

/**
 * 获取美元汇率
 * @param toCode 目标货币代码
 * @param amount 金额
 * @returns Promise<ExchangeRateData | ExchangeError>
 */
export async function getUSDExchangeRate(
  toCode: string,
  amount: number = 1
): Promise<ExchangeRateData | ExchangeError> {
  return getExchangeRate('USD', toCode, amount)
}

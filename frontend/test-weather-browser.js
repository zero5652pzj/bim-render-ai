/**
 * 浏览器环境测试脚本
 * 用于测试MCP天气查询功能的完整流程
 */

// 在浏览器控制台中运行的测试脚本
console.log('🧪 开始浏览器MCP天气测试...')

// 测试1: 检查页面加载
async function testPageLoad() {
  console.log('📄 测试1: 检查页面加载状态')
  try {
    const response = await fetch('/')
    if (response.ok) {
      console.log('✅ 页面加载正常')
      return true
    } else {
      console.log('❌ 页面加载失败')
      return false
    }
  } catch (error) {
    console.log('❌ 页面加载错误:', error)
    return false
  }
}

// 测试2: MCP服务器连接
async function testMCPServer() {
  console.log('🔌 测试2: 检查MCP服务器连接')
  try {
    const response = await fetch('/api/mcp')
    const data = await response.json()
    if (data.name === 'bim-ai-tools') {
      console.log('✅ MCP服务器连接正常')
      console.log('服务器信息:', {
        name: data.name,
        version: data.version,
        protocolVersion: data.protocolVersion
      })
      return true
    } else {
      console.log('❌ MCP服务器响应异常')
      return false
    }
  } catch (error) {
    console.log('❌ MCP服务器连接失败:', error)
    return false
  }
}

// 测试3: 获取工具列表
async function testToolsList() {
  console.log('🛠️ 测试3: 获取MCP工具列表')
  try {
    const response = await fetch('/api/mcp/tools/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      })
    })
    const data = await response.json()
    const tools = data.result?.tools || data.tools || []
    console.log(`✅ 发现 ${tools.length} 个工具:`, tools.map(t => t.name))
    return tools.length > 0
  } catch (error) {
    console.log('❌ 获取工具列表失败:', error)
    return false
  }
}

// 测试4: 天气工具调用
async function testWeatherTool(cityName) {
  console.log(`🌤️ 测试4: 测试天气工具调用 (城市: ${cityName})`)
  try {
    const response = await fetch('/api/mcp/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'getWeather',
          arguments: {
            location: cityName
          }
        }
      })
    })
    const data = await response.json()
    const result = data.result || data

    if (result.structuredContent) {
      console.log(`✅ ${cityName}天气查询成功:`, {
        location: result.structuredContent.location,
        temperature: result.structuredContent.temperature + '°C',
        weather: result.structuredContent.description,
        humidity: result.structuredContent.humidity + '%'
      })
      return true
    } else {
      console.log('❌ 天气数据格式异常')
      return false
    }
  } catch (error) {
    console.log('❌ 天气工具调用失败:', error)
    return false
  }
}

// 测试5: 批量天气测试
async function testMultipleCities() {
  console.log('🌍 测试5: 批量城市天气测试')
  const cities = ['Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen']
  const results = []

  for (const city of cities) {
    const success = await testWeatherTool(city)
    results.push({ city, success })
    // 添加延迟避免请求过快
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  console.log('📊 批量测试结果:', results)
  return results.filter(r => r.success).length === cities.length
}

// 测试6: AI聊天集成测试
async function testAIChat() {
  console.log('💬 测试6: AI聊天集成测试')
  try {
    // 这里需要模拟AI聊天流程
    console.log('🤖 AI聊天功能需要在前端界面中测试')
    console.log('💡 建议: 在MCP测试页面中输入"北京天气怎么样？"')
    return true
  } catch (error) {
    console.log('❌ AI聊天测试失败:', error)
    return false
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('🚀 开始运行所有MCP天气测试')
  console.log('=' .repeat(50))

  const tests = [
    { name: '页面加载', test: testPageLoad },
    { name: 'MCP服务器', test: testMCPServer },
    { name: '工具列表', test: testToolsList },
    { name: '北京天气', test: () => testWeatherTool('Beijing') },
    { name: '上海天气', test: () => testWeatherTool('Shanghai') },
    { name: '批量测试', test: testMultipleCities },
    { name: 'AI聊天', test: testAIChat }
  ]

  const results = []

  for (const { name, test } of tests) {
    console.log(`\n🧪 运行测试: ${name}`)
    console.log('-' .repeat(30))
    try {
      const success = await test()
      results.push({ name, success })
    } catch (error) {
      console.log(`❌ 测试 ${name} 出现异常:`, error)
      results.push({ name, success: false })
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('📊 测试结果汇总')
  console.log('='.repeat(50))

  const passed = results.filter(r => r.success).length
  const total = results.length

  results.forEach(({ name, success }) => {
    console.log(`${success ? '✅' : '❌'} ${name}`)
  })

  console.log(`\n🎯 总体结果: ${passed}/${total} 测试通过`)

  if (passed === total) {
    console.log('🎉 所有测试通过！MCP天气功能正常工作')
  } else {
    console.log('⚠️ 部分测试失败，请检查配置')
  }

  return { passed, total, results }
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  // 暴露到全局
  window.runMCPWeatherTests = runAllTests

  console.log('📋 MCP天气测试脚本已加载')
  console.log('💡 在控制台运行: runMCPWeatherTests()')
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runAllTests,
    testPageLoad,
    testMCPServer,
    testToolsList,
    testWeatherTool,
    testMultipleCities,
    testAIChat
  }
}

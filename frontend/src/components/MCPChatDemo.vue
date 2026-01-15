<template>
  <div class="mcp-chat-demo">
    <div class="demo-header">
      <h2>🤖 官方MCP工具演示</h2>
      <div class="status-indicator">
        <span :class="['status-dot', mcpStatus ? 'active' : 'inactive']"></span>
        <span class="status-text">
          {{ mcpStatus ? 'MCP已连接' : 'MCP未连接' }}
        </span>
        <button @click="initializeMCP" :disabled="initializing" class="btn-connect">
          {{ initializing ? '连接中...' : '连接MCP' }}
        </button>
      </div>
    </div>

    <div class="demo-content">
      <!-- 聊天区域 -->
      <div class="chat-section">
        <h3>💬 增强聊天（支持MCP工具）</h3>
        <div class="chat-messages" ref="messagesContainer">
          <div
            v-for="message in messages"
            :key="message.id"
            :class="['message', message.role]"
          >
            <div class="message-content">
              <div class="message-role">{{ message.role === 'user' ? '用户' : 'AI' }}</div>
              <div class="message-text">{{ message.content }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="currentMessage"
            @keyup.enter="sendMessage"
            placeholder="输入消息...（试试问天气或汇率）"
            :disabled="!mcpStatus"
            class="input-field"
          />
          <button @click="sendMessage" :disabled="!currentMessage || !mcpStatus" class="btn-send">
            发送
          </button>
        </div>
      </div>

      <!-- 工具演示区域 -->
      <div class="tools-section">
        <h3>🔧 直接工具调用演示</h3>
        <div class="tool-grid">
          <!-- 天气工具 -->
          <div class="tool-card">
            <h4>🌤️ 天气查询</h4>
            <div class="tool-controls">
              <input
                v-model="weatherLocation"
                placeholder="输入城市名"
                class="input-small"
              />
              <button @click="callWeatherTool" :disabled="!weatherLocation" class="btn-tool">
                查询天气
              </button>
            </div>
            <div v-if="weatherResult" class="tool-result">
              <pre>{{ JSON.stringify(weatherResult, null, 2) }}</pre>
            </div>
          </div>

          <!-- 汇率工具 -->
          <div class="tool-card">
            <h4>💱 汇率查询</h4>
            <div class="tool-controls">
              <input
                v-model="fromCurrency"
                placeholder="从 (如USD)"
                class="input-small"
              />
              <input
                v-model="toCurrency"
                placeholder="到 (如CNY)"
                class="input-small"
              />
              <button @click="callExchangeTool" :disabled="!fromCurrency || !toCurrency" class="btn-tool">
                查询汇率
              </button>
            </div>
            <div v-if="exchangeResult" class="tool-result">
              <pre>{{ JSON.stringify(exchangeResult, null, 2) }}</pre>
            </div>
          </div>

          <!-- 新闻工具 -->
          <div class="tool-card">
            <h4>📰 新闻查询</h4>
            <div class="tool-controls">
              <select v-model="newsCategory" class="select-small">
                <option value="">全部</option>
                <option value="technology">科技</option>
                <option value="business">商业</option>
                <option value="sports">体育</option>
              </select>
              <button @click="callNewsTool" class="btn-tool">
                获取新闻
              </button>
            </div>
            <div v-if="newsResult" class="tool-result">
              <pre>{{ JSON.stringify(newsResult, null, 2) }}</pre>
            </div>
          </div>

          <!-- 地图工具 -->
          <div class="tool-card">
            <h4>🗺️ 地点搜索</h4>
            <div class="tool-controls">
              <input
                v-model="locationQuery"
                placeholder="搜索地点"
                class="input-small"
              />
              <button @click="callLocationTool" :disabled="!locationQuery" class="btn-tool">
                搜索地点
              </button>
            </div>
            <div v-if="locationResult" class="tool-result">
              <pre>{{ JSON.stringify(locationResult, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>

      <!-- MCP状态和调试信息 -->
      <div class="debug-section">
        <h3>🔍 MCP调试信息</h3>
        <div class="debug-info">
          <div class="debug-item">
            <strong>工具数量:</strong> {{ toolsCount }}
          </div>
          <div class="debug-item">
            <strong>可用工具:</strong>
            <code>{{ availableTools.join(', ') }}</code>
          </div>
          <div class="debug-item">
            <strong>连接状态:</strong>
            <span :class="mcpStatus ? 'status-connected' : 'status-disconnected'">
              {{ mcpStatus ? '已连接' : '未连接' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import {
  initMCPClient,
  closeMCPClient,
  getMCPTools,
  executeMCPTool,
  isMCPClientReady
} from '../lib/simple-mcp-client'
import {
  enhancedChatWithMinimax,
  initEnhancedChat,
  shutdownEnhancedChat,
  checkMCPHealth
} from '../lib/enhanced-chat'

// 响应式数据
const mcpStatus = ref(false)
const initializing = ref(false)
const messages = ref<Array<{ id: string; role: string; content: string }>>([])
const currentMessage = ref('')
const toolsCount = ref(0)
const availableTools = ref<string[]>([])

// 工具演示数据
const weatherLocation = ref('Beijing')
const weatherResult = ref<any>(null)
const fromCurrency = ref('USD')
const toCurrency = ref('CNY')
const exchangeResult = ref<any>(null)
const newsCategory = ref('')
const newsResult = ref<any>(null)
const locationQuery = ref('北京大学')
const locationResult = ref<any>(null)

// DOM引用
const messagesContainer = ref<HTMLElement>()

// 方法
const initializeMCP = async () => {
  if (initializing.value) return

  try {
    initializing.value = true
    console.log('[MCP演示] 开始初始化...')

    // 初始化MCP客户端
    await initMCPClient()

    // 初始化增强聊天
    await initEnhancedChat()

    // 更新状态
    mcpStatus.value = isMCPClientReady()

    if (mcpStatus.value) {
      const tools = getMCPTools()
      toolsCount.value = Object.keys(tools).length
      availableTools.value = Object.keys(tools)

      // 添加欢迎消息
      addMessage('assistant', `🎉 MCP工具已连接！可用工具: ${availableTools.value.join(', ')}`)
    }

    console.log('[MCP演示] 初始化完成')

  } catch (error: any) {
    console.error('[MCP演示] 初始化失败:', error)
    addMessage('assistant', `❌ MCP连接失败: ${error.message}`)
  } finally {
    initializing.value = false
  }
}

const sendMessage = async () => {
  if (!currentMessage.value.trim() || !mcpStatus.value) return

  const message = currentMessage.value.trim()
  addMessage('user', message)
  currentMessage.value = ''

  try {
    const response = await enhancedChatWithMinimax(
      messages.value.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content })),
      {
        enableTools: true,
        stream: false
      }
    )

    if (response.success) {
      addMessage('assistant', response.message)
    } else {
      addMessage('assistant', `❌ 聊天失败: ${response.error}`)
    }
  } catch (error: any) {
    console.error('[聊天] 错误:', error)
    addMessage('assistant', `❌ 聊天错误: ${error.message}`)
  }
}

const callWeatherTool = async () => {
  if (!weatherLocation.value.trim()) return

  try {
    const result = await executeMCPTool('getWeather', {
      location: weatherLocation.value.trim()
    })

    weatherResult.value = result
    const weatherData = result as any
    addMessage('assistant', `🌤️ ${weatherData.location} 天气: ${weatherData.temperature}°C, ${weatherData.description}`)

  } catch (error: any) {
    console.error('[天气工具] 错误:', error)
    weatherResult.value = { error: error.message }
  }
}

const callExchangeTool = async () => {
  if (!fromCurrency.value.trim() || !toCurrency.value.trim()) return

  try {
    const result = await executeMCPTool('getExchangeRate', {
      from: fromCurrency.value.trim().toUpperCase(),
      to: toCurrency.value.trim().toUpperCase()
    })

    exchangeResult.value = result
    const exchangeData = result as any
    addMessage('assistant', `💱 汇率: 1 ${exchangeData.from} = ${exchangeData.rate.toFixed(4)} ${exchangeData.to}`)

  } catch (error: any) {
    console.error('[汇率工具] 错误:', error)
    exchangeResult.value = { error: error.message }
  }
}

const callNewsTool = async () => {
  try {
    const result = await executeMCPTool('getNews', {
      category: newsCategory.value || undefined,
      count: 3
    })

    newsResult.value = result
    const newsData = result as any[]
    addMessage('assistant', `📰 获取到 ${newsData.length} 条新闻`)

  } catch (error: any) {
    console.error('[新闻工具] 错误:', error)
    newsResult.value = { error: error.message }
  }
}

const callLocationTool = async () => {
  if (!locationQuery.value.trim()) return

  try {
    const result = await executeMCPTool('searchLocation', {
      query: locationQuery.value.trim()
    })

    locationResult.value = result
    const locationData = result as any[]
    addMessage('assistant', `🗺️ 找到 ${locationData.length} 个相关地点`)

  } catch (error: any) {
    console.error('[地图工具] 错误:', error)
    locationResult.value = { error: error.message }
  }
}

const addMessage = (role: string, content: string) => {
  messages.value.push({
    id: Date.now().toString(),
    role,
    content
  })

  // 滚动到底部
  nextTick(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  })
}

// 生命周期
onMounted(async () => {
  // 自动初始化
  await initializeMCP()

  // 检查MCP健康状态
  const isHealthy = await checkMCPHealth()
  if (isHealthy) {
    addMessage('assistant', '✅ MCP健康检查通过')
  } else {
    addMessage('assistant', '⚠️ MCP健康检查失败')
  }
})

onUnmounted(async () => {
  // 清理资源
  await shutdownEnhancedChat()
  await closeMCPClient()
})
</script>

<style scoped>
.mcp-chat-demo {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.demo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 12px;
}

.demo-header h2 {
  margin: 0;
  font-size: 24px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.status-dot.active {
  background-color: #4ade80;
}

.status-dot.inactive {
  background-color: #ef4444;
}

.status-text {
  font-weight: 500;
}

.btn-connect {
  padding: 8px 16px;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-connect:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-connect:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.demo-content {
  display: grid;
  gap: 30px;
}

.chat-section, .tools-section, .debug-section {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.chat-section h3, .tools-section h3, .debug-section h3 {
  margin-top: 0;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 10px;
}

.chat-messages {
  height: 300px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
  background: #f9fafb;
}

.message {
  margin-bottom: 16px;
  display: flex;
}

.message.user {
  justify-content: flex-end;
}

.message.assistant {
  justify-content: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
}

.message.user .message-content {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.message.assistant .message-content {
  background: #e5e7eb;
  color: #1f2937;
}

.message-role {
  font-size: 12px;
  font-weight: bold;
  margin-bottom: 4px;
  opacity: 0.8;
}

.message-text {
  line-height: 1.5;
}

.chat-input {
  display: flex;
  gap: 12px;
}

.input-field {
  flex: 1;
  padding: 12px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 14px;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.btn-send {
  padding: 12px 24px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.3s;
}

.btn-send:hover:not(:disabled) {
  background: #5a67d8;
}

.btn-send:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.tool-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f9fafb;
}

.tool-card h4 {
  margin-top: 0;
  color: #374151;
  border-bottom: 1px solid #d1d5db;
  padding-bottom: 8px;
}

.tool-controls {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.input-small, .select-small {
  padding: 8px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 12px;
  flex: 1;
  min-width: 80px;
}

.select-small {
  min-width: 100px;
}

.btn-tool {
  padding: 8px 16px;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: background-color 0.3s;
  white-space: nowrap;
}

.btn-tool:hover:not(:disabled) {
  background: #059669;
}

.btn-tool:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.tool-result {
  background: #1f2937;
  color: #f9fafb;
  padding: 12px;
  border-radius: 6px;
  font-size: 12px;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.tool-result pre {
  margin: 0;
  white-space: pre-wrap;
}

.debug-info {
  display: grid;
  gap: 12px;
}

.debug-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.debug-item strong {
  min-width: 100px;
  color: #374151;
}

.debug-item code {
  background: #f3f4f6;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-connected {
  color: #10b981;
  font-weight: 500;
}

.status-disconnected {
  color: #ef4444;
  font-weight: 500;
}

@media (max-width: 768px) {
  .mcp-chat-demo {
    padding: 10px;
  }

  .demo-header {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .tool-grid {
    grid-template-columns: 1fr;
  }

  .chat-input {
    flex-direction: column;
  }

  .tool-controls {
    flex-direction: column;
  }

  .input-small, .select-small, .btn-tool {
    width: 100%;
  }
}
</style>
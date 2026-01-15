<template>
  <div class="mcp-test-container">
    <div class="header">
      <h1>🤖 MCP 功能测试页面</h1>
      <p>测试官方 Model Context Protocol (MCP) 功能</p>
    </div>

    <div class="test-section">
      <h2>📋 测试项目</h2>
      <div class="test-grid">
        <!-- MCP 服务器状态 -->
        <div class="test-card">
          <h3>🔌 MCP 服务器状态</h3>
          <div class="status" :class="{ 'online': mcpStatus.online, 'offline': !mcpStatus.online }">
            {{ mcpStatus.online ? '✅ 在线' : '❌ 离线' }}
          </div>
          <div v-if="mcpStatus.serverInfo" class="server-info">
            <p><strong>名称:</strong> {{ mcpStatus.serverInfo.name }}</p>
            <p><strong>版本:</strong> {{ mcpStatus.serverInfo.version }}</p>
            <p><strong>协议版本:</strong> {{ mcpStatus.serverInfo.protocolVersion }}</p>
          </div>
          <button @click="checkMCPServer" :disabled="loading">
            {{ loading ? '检测中...' : '检查服务器状态' }}
          </button>
        </div>

        <!-- 工具列表 -->
        <div class="test-card">
          <h3>🛠️ 可用工具</h3>
          <div v-if="toolsList.length > 0" class="tools-list">
            <div v-for="tool in toolsList" :key="tool.name" class="tool-item">
              <strong>{{ tool.name }}</strong>
              <p>{{ tool.description }}</p>
              <small v-if="tool.inputSchema?.properties">
                参数: {{ Object.keys(tool.inputSchema.properties).join(', ') }}
              </small>
            </div>
          </div>
          <div v-else-if="!loading">
            <p>未发现工具</p>
          </div>
          <button @click="fetchToolsList" :disabled="loading">
            {{ loading ? '获取中...' : '获取工具列表' }}
          </button>
        </div>

        <!-- 天气工具测试 -->
        <div class="test-card">
          <h3>🌤️ 天气工具测试</h3>
          <div class="input-group">
            <input
              v-model="weatherLocation"
              placeholder="输入城市名称 (如: Beijing)"
              class="city-input"
            />
            <button @click="testWeatherTool" :disabled="loading || !weatherLocation">
              {{ loading ? '查询中...' : '获取天气' }}
            </button>
          </div>
          <div v-if="weatherResult" class="result weather-result">
            <div v-if="weatherResult.structuredContent">
              <h4>{{ weatherResult.structuredContent.location }} 天气</h4>
              <p>🌡️ 温度: {{ weatherResult.structuredContent.temperature }}°C</p>
              <p>💧 湿度: {{ weatherResult.structuredContent.humidity }}%</p>
              <p>☁️ 天气: {{ weatherResult.structuredContent.description }}</p>
              <p>💨 风速: {{ weatherResult.structuredContent.windSpeed }}km/h</p>
            </div>
            <div v-else>
              {{ weatherResult.content?.[0]?.text || '未知结果' }}
            </div>
          </div>
        </div>

        <!-- AI 聊天测试 -->
        <div class="test-card">
          <h3>💬 AI 聊天测试</h3>
          <div class="chat-container">
            <div class="messages">
              <div v-for="message in chatMessages" :key="message.id" class="message" :class="message.role">
                <strong>{{ message.role === 'user' ? '用户' : 'AI' }}:</strong>
                <p>{{ message.content }}</p>
              </div>
            </div>
            <div class="input-group">
              <input
                v-model="chatInput"
                placeholder="输入消息 (如: 北京天气怎么样？)"
                class="chat-input"
                @keyup.enter="sendChatMessage"
              />
              <button @click="sendChatMessage" :disabled="loading || !chatInput">
                {{ loading ? '发送中...' : '发送' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误信息 -->
    <div v-if="error" class="error-message">
      ❌ {{ error }}
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner"></div>
      <p>处理中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { generateText } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'

// MCP 客户端导入
import { initMCPClient, getMCPTools, isMCPClientReady } from '../lib/simple-mcp-client'

// 响应式数据
const loading = ref(false)
const error = ref('')
const mcpStatus = ref({
  online: false,
  serverInfo: null as any
})
const toolsList = ref<any[]>([])
const weatherLocation = ref('Beijing')
const weatherResult = ref<any>(null)
const chatMessages = ref<any[]>([])
const chatInput = ref('')

// MiniMax 客户端配置
const minimax = createOpenAI({
  baseURL: import.meta.env.VITE_MINIMAX_BASE_URL || 'https://api.minimaxi.com/v1',
  apiKey: import.meta.env.VITE_MINIMAX_API_KEY,
})

// 检查 MCP 服务器状态
async function checkMCPServer() {
  try {
    loading.value = true
    error.value = ''

    const response = await fetch('/api/mcp')
    const data = await response.json()

    mcpStatus.value = {
      online: !!data.name,
      serverInfo: data
    }
  } catch (err) {
    console.error('MCP服务器检查失败:', err)
    error.value = '无法连接到MCP服务器'
    mcpStatus.value.online = false
  } finally {
    loading.value = false
  }
}

// 获取工具列表
async function fetchToolsList() {
  try {
    loading.value = true
    error.value = ''

    const response = await fetch('/api/mcp/tools/list', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'tools/list'
      })
    })

    const data = await response.json()
    // 从JSON-RPC响应中提取result
    toolsList.value = data.result?.tools || data.tools || []
  } catch (err) {
    console.error('获取工具列表失败:', err)
    error.value = '无法获取工具列表'
  } finally {
    loading.value = false
  }
}

// 测试天气工具
async function testWeatherTool() {
  try {
    loading.value = true
    error.value = ''
    weatherResult.value = null

    const response = await fetch('/api/mcp/tools/call', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'getWeather',
          arguments: {
            location: weatherLocation.value
          }
        }
      })
    })

    const data = await response.json()
    // 从JSON-RPC响应中提取result
    weatherResult.value = data.result || data
  } catch (err) {
    console.error('天气工具测试失败:', err)
    error.value = '天气工具调用失败'
  } finally {
    loading.value = false
  }
}

// 发送聊天消息
async function sendChatMessage() {
  if (!chatInput.value.trim()) return

  const userMessage = {
    id: Date.now(),
    role: 'user',
    content: chatInput.value
  }

  chatMessages.value.push(userMessage)
  const currentInput = chatInput.value
  chatInput.value = ''

  try {
    loading.value = true
    error.value = ''

    // 初始化 MCP 客户端（如果需要）
    if (!isMCPClientReady()) {
      console.log('初始化 MCP 客户端...')
      await initMCPClient()
    }

    // 获取 MCP 工具
    const tools = getMCPTools()

    // 准备消息
    const messages = [
      {
        role: 'system',
        content: '你是一个专业的BIM桥梁设计助手。当用户询问天气、新闻等信息时，请使用可用的工具来获取最新信息。'
      },
      ...chatMessages.value.map(m => ({
        role: m.role,
        content: m.content
      }))
    ]

    // 使用 AI SDK 调用，传入 MCP 工具
    const result = await generateText({
      model: minimax(import.meta.env.VITE_MINIMAX_MODEL_NAME || 'MiniMax-M2.1') as any,
      messages,
      tools: tools as any,
      maxTokens: 1024,
      temperature: 0.7,
    })

    // 添加 AI 回复
    chatMessages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: result.text
    })

  } catch (err: any) {
    console.error('聊天失败:', err)
    error.value = `聊天失败: ${err.message}`

    // 添加错误回复
    chatMessages.value.push({
      id: Date.now(),
      role: 'assistant',
      content: `抱歉，处理您的消息时发生了错误: ${err.message}`
    })
  } finally {
    loading.value = false
  }
}

// 组件挂载时执行
onMounted(() => {
  // 初始检查
  checkMCPServer()
  fetchToolsList()

  // 添加欢迎消息
  chatMessages.value.push({
    id: 1,
    role: 'assistant',
    content: '你好！我是AI+BIM桥梁设计助手。我可以帮您处理桥梁设计相关问题，也可以调用工具获取实时信息（如天气、新闻等）。请尝试问我"北京天气怎么样？"'
  })
})
</script>

<style scoped>
.mcp-test-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 30px;
}

.header h1 {
  color: #2c3e50;
  margin-bottom: 10px;
}

.header p {
  color: #7f8c8d;
  font-size: 16px;
}

.test-section {
  margin-bottom: 30px;
}

.test-section h2 {
  color: #34495e;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #ecf0f1;
}

.test-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.test-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid #ecf0f1;
}

.test-card h3 {
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 18px;
}

.status {
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 15px;
  font-weight: bold;
}

.status.online {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.status.offline {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.server-info p {
  margin: 5px 0;
  font-size: 14px;
}

.tools-list {
  max-height: 200px;
  overflow-y: auto;
  margin-bottom: 15px;
}

.tool-item {
  padding: 10px;
  background: #f8f9fa;
  border-radius: 4px;
  margin-bottom: 8px;
}

.tool-item strong {
  color: #495057;
}

.tool-item p {
  margin: 5px 0;
  font-size: 14px;
  color: #6c757d;
}

.tool-item small {
  color: #868e96;
  font-size: 12px;
}

.input-group {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
}

.city-input,
.chat-input {
  flex: 1;
  padding: 10px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 14px;
}

button {
  padding: 10px 16px;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

button:hover:not(:disabled) {
  background: #0056b3;
}

button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.result {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 15px;
  margin-bottom: 15px;
}

.weather-result h4 {
  color: #495057;
  margin-bottom: 10px;
}

.chat-container {
  height: 300px;
  display: flex;
  flex-direction: column;
}

.messages {
  flex: 1;
  overflow-y: auto;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 10px;
  margin-bottom: 10px;
}

.message {
  margin-bottom: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  max-width: 80%;
}

.message.user {
  background: #007bff;
  color: white;
  margin-left: auto;
  text-align: right;
}

.message.assistant {
  background: white;
  border: 1px solid #dee2e6;
  color: #495057;
}

.message strong {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  opacity: 0.8;
}

.message p {
  margin: 0;
  line-height: 1.4;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  padding: 15px;
  margin: 20px 0;
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 768px) {
  .test-grid {
    grid-template-columns: 1fr;
  }

  .input-group {
    flex-direction: column;
  }
}
</style>

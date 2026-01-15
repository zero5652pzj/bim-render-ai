# MCP 重构迁移指南

## 🎯 重构目标

本次重构完全移除自定义 HTTP API 实现，迁移到官方 Model Context Protocol (MCP) 标准，确保：

- ✅ 完全符合 MCP 官方标准
- ✅ 使用 `@ai-sdk/mcp` 官方客户端
- ✅ AI 自动决定何时调用工具
- ✅ 类型安全的工具定义
- ✅ 支持完整的 MCP 功能集

## 📊 架构对比

### ❌ 旧架构（已移除）
```typescript
// 自定义 HTTP API 调用
const response = await fetch('/api/mcp', {
  method: 'POST',
  body: JSON.stringify({
    tool: 'getWeather',
    parameters: { location: 'Beijing' }
  })
})

// 硬编码关键词匹配
if (lastMessage.includes('天气')) {
  // 手动调用工具
}
```

### ✅ 新架构（当前实现）
```typescript
// 官方 MCP 客户端
const mcpClient = await createMCPClient({
  transport: {
    type: 'http',
    url: '/api/mcp',
    headers: {
      'MCP-Protocol-Version': '2024-11-05'
    }
  }
})

// AI 自动使用工具
const result = await generateText({
  model: minimax(MINIMAX_MODEL_NAME),
  messages: aiMessages,
  tools, // AI 自动决定何时使用
})
```

## 🗂️ 文件变更

### 新增文件
- `api/mcp/http-server.ts` - 标准 MCP HTTP 传输层

### 修改文件
- `frontend/src/lib/simple-mcp-client.ts` - 重写为官方 MCP 客户端
- `frontend/src/lib/minimax-api.ts` - 集成自动工具调用
- `frontend/test-chat.sh` - 更新测试用例

### 删除文件
- `api/mcp/index.ts` - 移除自定义 HTTP API
- `api/chat/tools.ts` - 移除手动工具调用逻辑（工具实现保留）

## 🔧 核心功能变更

### 1. 工具发现机制

**旧方式**：硬编码关键词匹配
```typescript
if (lastMessage.includes('天气')) {
  // 手动调用
}
```

**新方式**：AI 自动决定
```typescript
// AI 根据上下文自动选择合适的工具
const result = await generateText({
  model: minimax(MINIMAX_MODEL_NAME),
  messages: aiMessages,
  tools, // 传递工具定义给 AI
})
```

### 2. 工具定义方式

**旧方式**：无类型定义
```typescript
const response = await fetch('/api/mcp', {
  body: JSON.stringify({ tool: 'getWeather', parameters: {} })
})
```

**新方式**：完整的 Zod 架构定义
```typescript
const tools = await mcpClient.tools({
  schemas: {
    getWeather: {
      inputSchema: z.object({
        location: z.string().describe('城市名称，支持中英文')
      }),
      outputSchema: z.object({
        temperature: z.number(),
        description: z.string(),
        // ... 更多字段
      })
    }
  }
})
```

### 3. 响应格式

**旧方式**：自定义 JSON 格式
```typescript
{
  success: boolean,
  data: any,
  message: string,
  error?: string
}
```

**新方式**：标准 MCP 响应格式
```typescript
{
  content: [{ type: 'text', text: '...' }],
  structuredContent: { /* 结构化数据 */ }
}
```

## 🚀 使用指南

### 初始化 MCP 客户端

```typescript
import { initMCPClient, getMCPTools } from './simple-mcp-client'

// 在应用启动时初始化
await initMCPClient()

// 获取工具实例
const tools = getMCPTools()
```

### 在 AI 聊天中使用工具

```typescript
import { generateText } from 'ai'

// AI 自动使用工具
const result = await generateText({
  model: minimax(MINIMAX_MODEL_NAME),
  messages: messages,
  tools, // 传递工具给 AI
})
```

### 手动执行工具（可选）

```typescript
import { executeMCPTool } from './simple-mcp-client'

// 手动调用特定工具
const weather = await executeMCPTool('getWeather', {
  location: 'Beijing'
})
```

## 🧪 测试验证

### 运行测试脚本
```bash
cd frontend
./test-chat.sh
```

### 手动测试 MCP 端点
```bash
# 健康检查
curl http://localhost:5173/api/mcp

# 获取工具列表
curl -X POST http://localhost:5173/api/mcp/tools/list \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'

# 调用工具
curl -X POST http://localhost:5173/api/mcp/tools/call \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"getWeather","arguments":{"location":"Beijing"}}}'
```

## ⚠️ 迁移注意事项

### 1. 环境变量
确保以下环境变量已设置：
- `VITE_MINIMAX_BASE_URL`
- `VITE_MINIMAX_MODEL_NAME`
- `VITE_MINIMAX_API_KEY`
- `WEATHER_API_KEY` (可选)

### 2. API 依赖
移除对 `/api/mcp` 自定义端点的直接调用。所有调用现在通过 AI SDK 自动处理。

### 3. 错误处理
新架构包含降级机制：
- 如果 MCP 初始化失败，自动降级到纯聊天模式
- 如果工具调用失败，继续使用 AI 响应

## 🔍 故障排除

### MCP 客户端初始化失败
```typescript
// 检查网络连接
// 确认 API 端点可访问
// 查看浏览器控制台日志
```

### 工具调用失败
```typescript
// 检查参数格式
// 确认工具名称正确
// 查看服务器日志
```

### AI 未自动调用工具
```typescript
// 检查 system 提示是否包含工具使用说明
// 确认工具定义正确传递
// 检查模型是否支持工具调用
```

## 📈 性能优化

### 1. 懒加载
MCP 客户端仅在首次使用时初始化：
```typescript
async function initializeMCPIfNeeded(): Promise<void> {
  if (!isMCPInitialized) {
    await initMCPClient()
    isMCPInitialized = true
  }
}
```

### 2. 缓存工具
工具实例在内存中缓存，避免重复初始化。

### 3. 错误降级
工具调用失败时自动降级到纯聊天模式。

## 🎯 后续计划

1. **添加更多 MCP 工具**：扩展工具集以支持更多功能
2. **实现资源功能**：使用 MCP Resources 获取桥梁设计规范
3. **实现提示模板**：使用 MCP Prompts 标准化设计流程
4. **优化类型安全**：进一步完善 TypeScript 类型定义
5. **添加监控**：实现工具使用统计和性能监控

---

## 📚 参考资料

- [MCP 官方文档](https://modelcontextprotocol.io/)
- [AI SDK MCP 指南](https://sdk.vercel.ai/docs/ai-sdk-core/mcp-tools)
- [项目技术规范](./openspec/TECHNICAL_STANDARDS.md)

通过本次重构，项目现在完全符合 MCP 官方标准，享受 AI 自动工具调用的便利，同时保持类型安全和良好的开发体验。

/**
 * Vite插件：处理MCP API请求
 * 在开发环境中模拟MCP服务器 - 支持JSON-RPC 2.0协议
 */

export function mcpPlugin() {
  return {
    name: 'mcp-dev-server',
    configureServer(server) {
      // 处理 /api/mcp 请求
      server.middlewares.use('/api/mcp', async (req, res) => {
        // 设置CORS头
        res.setHeader('Access-Control-Allow-Origin', '*')
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, MCP-Protocol-Version')

        if (req.method === 'OPTIONS') {
          res.statusCode = 200
          res.end()
          return
        }

        // 处理 POST 请求 (JSON-RPC 2.0)
        if (req.method === 'POST') {
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const request = JSON.parse(body)
              const { method, params, id } = request
              const requestId = id !== undefined ? id : 1

              res.setHeader('Content-Type', 'application/json')

              // 处理 initialize 方法
              if (method === 'initialize') {
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: requestId,
                  result: {
                    protocolVersion: '2025-06-18',
                    serverInfo: {
                      name: 'bim-ai-tools',
                      version: '1.0.0'
                    },
                    capabilities: {
                      tools: {}
                    }
                  }
                }))
                return
              }

              // 处理 tools/list 方法
              if (method === 'tools/list') {
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: requestId,
                  result: {
                    tools: [
                      {
                        name: 'getWeather',
                        description: '获取指定城市的实时天气信息',
                        inputSchema: {
                          type: 'object',
                          properties: {
                            location: {
                              type: 'string',
                              description: '城市名称，支持中英文'
                            }
                          },
                          required: ['location']
                        }
                      },
                      {
                        name: 'getNews',
                        description: '获取最新新闻资讯',
                        inputSchema: {
                          type: 'object',
                          properties: {
                            category: {
                              type: 'string',
                              description: '新闻分类'
                            }
                          }
                        }
                      },
                      {
                        name: 'getExchangeRate',
                        description: '查询货币汇率信息',
                        inputSchema: {
                          type: 'object',
                          properties: {
                            from: { type: 'string', description: '源货币' },
                            to: { type: 'string', description: '目标货币' }
                          }
                        }
                      }
                    ]
                  }
                }))
                return
              }

              // 处理 notifications/initialized (无响应的通知)
              if (method === 'notifications/initialized') {
                // 通知不需要响应，只返回 200 OK
                res.statusCode = 200
                res.end(JSON.stringify({ status: 'ok' }))
                return
              }

              // 处理 tools/call 方法
              if (method === 'tools/call') {
                const { name, arguments: args } = params || {}

                // 模拟工具响应
                let toolResult = {
                  content: [
                    {
                      type: 'text',
                      text: `开发模式：工具 ${name} 调用成功，参数: ${JSON.stringify(args)}`
                    }
                  ]
                }

                // 添加模拟数据
                if (name === 'getWeather') {
                  const location = args?.location || '北京'
                  toolResult.content[0].text = `🌤️ ${location}天气查询结果\n\n温度: 25°C\n湿度: 60%\n天气: 晴天\n风速: 5km/h`
                } else if (name === 'getNews') {
                  toolResult.content[0].text = `📰 ${args?.category || '综合'}新闻\n\n1. AI技术持续突破\n2. 全球经济复苏\n3. 科技创新推动发展`
                } else if (name === 'getExchangeRate') {
                  const from = args?.from || 'USD'
                  const to = args?.to || 'CNY'
                  toolResult.content[0].text = `💱 汇率查询\n\n1 ${from} = 7.2 ${to}`
                }

                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: requestId,
                  result: toolResult
                }))
                return
              }

              // 未知方法
              res.statusCode = 404
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: requestId,
                error: {
                  code: -32601,
                  message: 'Method not found'
                }
              }))

            } catch (error) {
              res.statusCode = 400
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                jsonrpc: '2.0',
                id: request.id || 1,
                error: {
                  code: -32700,
                  message: 'Parse error'
                }
              }))
            }
          })
          return
        }

        // GET 请求 - 简单的健康检查
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({
            status: 'ok',
            name: 'bim-ai-tools',
            version: '1.0.0',
            protocolVersion: '2025-06-18'
          }))
          return
        }

        // 其他方法返回 405
        res.statusCode = 405
        res.end(JSON.stringify({ error: 'Method not allowed' }))
      })
    }
  }
}

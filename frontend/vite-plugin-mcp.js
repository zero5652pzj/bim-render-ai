/**
 * Vite插件：处理MCP API请求
 * 在开发环境中模拟MCP服务器
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

        try {
          const url = new URL(req.url, 'http://localhost')
          const pathname = url.pathname

          // 处理健康检查
          if (pathname === '/' || pathname === '') {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({
              name: 'bim-ai-tools',
              version: '1.0.0',
              description: 'BIM AI工具 MCP 服务器 (开发模式)',
              protocolVersion: '2024-11-05',
              endpoints: [
                '/tools/list',
                '/tools/call',
                '/resources/list',
                '/resources/read',
                '/prompts/list',
                '/prompts/get'
              ]
            }))
            return
          }

          // 处理tools/list
          if (pathname.endsWith('/tools/list')) {
            let body = ''
            req.on('data', chunk => body += chunk)
            req.on('end', () => {
              const requestId = body ? (JSON.parse(body).id || 1) : 1
              res.setHeader('Content-Type', 'application/json')
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
                      from: { type: 'string' },
                      to: { type: 'string' }
                    }
                  }
                  }
                  ]
                }
              }))
            })
            return
          }

          // 处理tools/call
          if (pathname.endsWith('/tools/call')) {
            let body = ''
            req.on('data', chunk => body += chunk)
            req.on('end', () => {
              try {
                const request = JSON.parse(body)
                const requestId = request.id || 1
                const { name, arguments: args } = request.params || {}

                // 模拟工具响应
                let response = {
                  content: [
                    {
                      type: 'text',
                      text: `开发模式：工具 ${name} 调用成功，参数: ${JSON.stringify(args)}`
                    }
                  ]
                }

                // 添加模拟数据
                if (name === 'getWeather') {
                  response.structuredContent = {
                    location: args.location || '北京',
                    temperature: 25,
                    humidity: 60,
                    description: '晴天',
                    windSpeed: 5,
                    pressure: 1013,
                    visibility: 10,
                    timestamp: new Date().toLocaleString('zh-CN')
                  }
                }

                // JSON-RPC 2.0 格式响应
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: requestId,
                  result: response
                }))
              } catch (error) {
                const requestId = body ? (JSON.parse(body).id || 1) : 1
                res.statusCode = 400
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({
                  jsonrpc: '2.0',
                  id: requestId,
                  error: {
                    code: -32600,
                    message: 'Invalid Request'
                  }
                }))
              }
            })
            return
          }

          // 其他路径返回404
          res.statusCode = 404
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Not found' }))

        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message }))
        }
      })
    }
  }
}

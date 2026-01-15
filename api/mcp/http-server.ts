/**
 * 标准MCP HTTP传输层实现
 * 符合Model Context Protocol HTTP标准，支持标准的MCP请求/响应格式
 */

import { server, handlers } from './server'

export const config = {
  runtime: 'edge',
}

export default async function handler(req: Request) {
  // 设置CORS头
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE, PATCH',
    'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization, MCP-Protocol-Version, MCP-Session-ID',
  }

  // 处理预检请求
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    console.log(`[MCP HTTP服务器] ${req.method} ${new URL(req.url).pathname}`)

    // 解析MCP协议版本
    const protocolVersion = req.headers.get('MCP-Protocol-Version') || '2024-11-05'
    const sessionId = req.headers.get('MCP-Session-ID') || crypto.randomUUID()

    // 根据路径分发请求
    const url = new URL(req.url)
    const pathname = url.pathname

    if (pathname.endsWith('/tools/list')) {
      return handleToolsList(req, corsHeaders, protocolVersion, sessionId)
    } else if (pathname.endsWith('/tools/call')) {
      return handleToolsCall(req, corsHeaders, protocolVersion, sessionId)
    } else if (pathname.endsWith('/resources/list')) {
      return handleResourcesList(req, corsHeaders, protocolVersion, sessionId)
    } else if (pathname.endsWith('/resources/read')) {
      return handleResourcesRead(req, corsHeaders, protocolVersion, sessionId)
    } else if (pathname.endsWith('/prompts/list')) {
      return handlePromptsList(req, corsHeaders, protocolVersion, sessionId)
    } else if (pathname.endsWith('/prompts/get')) {
      return handlePromptsGet(req, corsHeaders, protocolVersion, sessionId)
    } else {
      // 健康检查端点
      return new Response(JSON.stringify({
        name: 'bim-ai-tools',
        version: '1.0.0',
        description: 'BIM AI工具 MCP 服务器',
        protocolVersion,
        sessionId,
        endpoints: [
          '/tools/list',
          '/tools/call',
          '/resources/list',
          '/resources/read',
          '/prompts/list',
          '/prompts/get'
        ]
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

  } catch (error: any) {
    console.error('[MCP HTTP服务器] 错误:', error)

    return new Response(JSON.stringify({
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * 处理工具列表请求
 */
async function handleToolsList(
  req: Request,
  corsHeaders: Record<string, string>,
  protocolVersion: string,
  sessionId: string
) {
  try {
    const request = await req.json()

    // 调用MCP服务器的工具列表处理器
    const response = await handlers['tools/list'].handler({
      method: 'tools/list',
      params: request.params || {},
    })

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        ...response,
        _meta: {
          protocolVersion,
          sessionId,
        }
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': protocolVersion,
        'MCP-Session-ID': sessionId,
      },
    })

  } catch (error: any) {
    console.error('[MCP HTTP服务器] tools/list 错误:', error)

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      error: {
        code: -32603,
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * 处理工具调用请求
 */
async function handleToolsCall(
  req: Request,
  corsHeaders: Record<string, string>,
  protocolVersion: string,
  sessionId: string
) {
  try {
    const request = await req.json()
    const { id, params } = request

    // 调用MCP服务器的工具调用处理器
    const response = await handlers['tools/call'].handler({
      method: 'tools/call',
      params,
    })

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id,
      result: {
        ...response,
        _meta: {
          protocolVersion,
          sessionId,
        }
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': protocolVersion,
        'MCP-Session-ID': sessionId,
      },
    })

  } catch (error: any) {
    console.error('[MCP HTTP服务器] tools/call 错误:', error)

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      error: {
        code: -32603,
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * 处理资源列表请求
 */
async function handleResourcesList(
  req: Request,
  corsHeaders: Record<string, string>,
  protocolVersion: string,
  sessionId: string
) {
  try {
    const request = await req.json()

    const response = await handlers['resources/list'].handler({
      method: 'resources/list',
      params: request.params || {},
    })

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        ...response,
        _meta: {
          protocolVersion,
          sessionId,
        }
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': protocolVersion,
        'MCP-Session-ID': sessionId,
      },
    })

  } catch (error: any) {
    console.error('[MCP HTTP服务器] resources/list 错误:', error)

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      error: {
        code: -32603,
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * 处理资源读取请求
 */
async function handleResourcesRead(
  req: Request,
  corsHeaders: Record<string, string>,
  protocolVersion: string,
  sessionId: string
) {
  try {
    const request = await req.json()

    const response = await handlers['resources/read'].handler({
      method: 'resources/read',
      params: request.params,
    })

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        ...response,
        _meta: {
          protocolVersion,
          sessionId,
        }
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': protocolVersion,
        'MCP-Session-ID': sessionId,
      },
    })

  } catch (error: any) {
    console.error('[MCP HTTP服务器] resources/read 错误:', error)

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      error: {
        code: -32603,
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * 处理提示列表请求
 */
async function handlePromptsList(
  req: Request,
  corsHeaders: Record<string, string>,
  protocolVersion: string,
  sessionId: string
) {
  try {
    const request = await req.json()

    const response = await handlers['experimental/prompts/list'].handler({
      method: 'experimental/prompts/list',
      params: request.params || {},
    })

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        ...response,
        _meta: {
          protocolVersion,
          sessionId,
        }
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': protocolVersion,
        'MCP-Session-ID': sessionId,
      },
    })

  } catch (error: any) {
    console.error('[MCP HTTP服务器] prompts/list 错误:', error)

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      error: {
        code: -32603,
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

/**
 * 处理提示获取请求
 */
async function handlePromptsGet(
  req: Request,
  corsHeaders: Record<string, string>,
  protocolVersion: string,
  sessionId: string
) {
  try {
    const request = await req.json()

    const response = await handlers['experimental/prompts/get'].handler({
      method: 'experimental/prompts/get',
      params: request.params,
    })

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: request.id,
      result: {
        ...response,
        _meta: {
          protocolVersion,
          sessionId,
        }
      }
    }), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'MCP-Protocol-Version': protocolVersion,
        'MCP-Session-ID': sessionId,
      },
    })

  } catch (error: any) {
    console.error('[MCP HTTP服务器] prompts/get 错误:', error)

    return new Response(JSON.stringify({
      jsonrpc: '2.0',
      id: crypto.randomUUID(),
      error: {
        code: -32603,
        message: error.message
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
}

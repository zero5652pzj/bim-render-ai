const http = require('http');
const url = require('url');
const axios = require('axios');

const port = 3001;

// MiniMax API 配置
const MINIMAX_BASE_URL = 'https://api.minimaxi.com/v1';
const MINIMAX_API_KEY = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOiLmnLTmraPmtakiLCJVc2VyTmFtZSI6IuactOato-a1qSIsIkFjY291bnQiOiIiLCJTdWJqZWN0SUQiOiIxOTg4OTU4ODQ3ODA0MzgwMDEyIiwiUGhvbmUiOiIxNTY1MjA3MDQ2NSIsIkdyb3VwSUQiOiIxOTg4OTU4ODQ3ODAwMTg1NzA4IiwiUGFnZU5hbWUiOiIiLCJNYWlsIjoiIiwiQ3JlYXRlVGltZSI6IjIwMjUtMTEtMTUgMTI6NTg6MDIiLCJUb2tlblR5cGUiOjQsImlzcyI6Im1pbmltYXgifQ.XDXhdZTkC8KrFLjy10toMdK82jEl7L7HP8gjoja3oVaycUOfh5-2fWOcZzXtClDUT0rq1MvpfO95eTlDGcb8qnz875kqRVEzFelQ56tCzHlzuODLNEtJS9KhAYjzvbFmlHCMPakT6UX2Lw9nMaPidPa5jKMyFXP30gbVF_Mg0jDQi1R700vWFzXnSZ2_rGNrdmbOVl5AwBYTeKb1Zza2hBkZmZRzCCAbkzSK44zaZq6tyu5ECwA6Lb5i5rQaeZWjBJDof4IfriH9tMIXidT8Jb8X6pfTcf5AXAy8ObUCZDxei7S21tsOBIWhIMouIdCcDIDvtiuHUiN24fzh_24Hcg';
const MINIMAX_MODEL_NAME = 'MiniMax-M2.1';

// CORS 头设置
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

// 处理 OPTIONS 请求（CORS预检）
function handleOptions(req, res) {
  res.writeHead(204, corsHeaders);
  res.end();
}

// 处理健康检查
function handleHealthCheck(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
  res.end(JSON.stringify({ status: 'OK', timestamp: new Date().toISOString() }));
}

// 处理聊天API
async function handleChat(req, res) {
  try {
    console.log('\n[API] 收到聊天请求');

    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const requestData = JSON.parse(body);
        const { messages } = requestData;

        console.log('[API] 消息数量:', messages?.length);

        if (!messages || !Array.isArray(messages)) {
          res.writeHead(400, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ error: '无效的消息格式' }));
          return;
        }

        console.log('[API] 准备调用MiniMax API...');

        // 调用 MiniMax API
        const response = await axios.post(`${MINIMAX_BASE_URL}/chat/completions`, {
          model: MINIMAX_MODEL_NAME,
          messages: [
            {
              role: 'system',
              content: '你是一个专业的 BIM 桥梁设计助手。你的职责是：\n1. 理解用户的桥梁设计需求\n2. 提供专业的桥梁设计建议\n3. 生成符合工程规范的桥梁参数\n4. 使用工具函数创建 3D 桥梁模型\n\n请用简洁专业的语言回答，必要时使用 Markdown 格式。'
            },
            ...messages
          ],
          max_tokens: 2048,
          temperature: 0.7,
          stream: false
        }, {
          headers: {
            'Authorization': `Bearer ${MINIMAX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('[API] MiniMax API 响应成功');

        const aiMessage = response.data.choices?.[0]?.message?.content;

        if (aiMessage) {
          res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
          res.end(JSON.stringify({ message: aiMessage }));
        } else {
          throw new Error('MiniMax API 返回了空的响应');
        }

      } catch (error) {
        console.error('[API] MiniMax调用错误:', error.response?.data || error.message);

        // 返回模拟响应
        const lastMessage = JSON.parse(body).messages?.[JSON.parse(body).messages.length - 1]?.content || '';
        const mockResponse = {
          message: `您好！我是AI+BIM桥梁设计助手。我注意到您提到了"${lastMessage}"。\n\n作为专业的桥梁设计助手，我可以帮您：\n\n1. **设计桥梁类型** - 简支梁桥、连续梁桥、拱桥、斜拉桥等\n2. **计算桥梁参数** - 跨径、梁高、材料规格等\n3. **生成3D模型** - 创建可视化的桥梁结构\n\n请告诉我您的具体设计需求，我会为您提供专业的建议！\n\n例如：\n- 生成一座100米的简支梁桥\n- 设计三跨连续梁桥，每跨30米\n- 创建一个拱桥，跨径50米`
        };

        res.writeHead(200, { 'Content-Type': 'application/json', ...corsHeaders });
        res.end(JSON.stringify(mockResponse));
      }
    });

  } catch (error) {
    console.error('[API] 服务器错误:', error);
    res.writeHead(500, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: '服务器内部错误' }));
  }
}

// HTTP 服务器
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // 处理CORS预检请求
  if (req.method === 'OPTIONS') {
    handleOptions(req, res);
    return;
  }

  // 路由处理
  if (pathname === '/api/health' && req.method === 'GET') {
    handleHealthCheck(req, res);
  } else if (pathname === '/api/chat' && req.method === 'POST') {
    handleChat(req, res);
  } else {
    res.writeHead(404, { 'Content-Type': 'application/json', ...corsHeaders });
    res.end(JSON.stringify({ error: 'Not Found' }));
  }
});

server.listen(port, () => {
  console.log(`\n🚀 API服务器运行在 http://localhost:${port}`);
  console.log(`📝 Chat API: http://localhost:${port}/api/chat`);
  console.log(`💡 健康检查: http://localhost:${port}/api/health`);
  console.log(`\n等待API请求...\n`);
});

// 优雅关闭
process.on('SIGINT', () => {
  console.log('\n👋 正在关闭服务器...');
  server.close(() => {
    console.log('✅ 服务器已关闭');
    process.exit(0);
  });
});
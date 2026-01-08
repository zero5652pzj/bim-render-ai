#!/bin/bash

# MiniMax AI 聊天系统开发环境启动脚本
echo "🚀 启动 MiniMax AI 聊天系统开发环境..."
echo "======================================"
echo

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js 未安装，请先安装 Node.js${NC}"
    exit 1
fi

# 检查是否在 frontend 目录
if [ ! -f "frontend/package.json" ]; then
    echo -e "${RED}❌ 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 启动函数
start_api_server() {
    echo -e "${YELLOW}📡 启动 API 服务器...${NC}"
    cd frontend
    node api-server.cjs &
    API_PID=$!
    echo "✅ API 服务器已启动 (PID: $API_PID)"
    cd ..
}

start_frontend() {
    echo -e "${YELLOW}🎨 启动前端开发服务器...${NC}"
    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    echo "✅ 前端服务器已启动 (PID: $FRONTEND_PID)"
    cd ..
}

# 清理函数
cleanup() {
    echo
    echo -e "${YELLOW}🧹 正在关闭服务器...${NC}"
    if [ ! -z "$API_PID" ]; then
        kill $API_PID 2>/dev/null
        echo "✅ API 服务器已关闭"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "✅ 前端服务器已关闭"
    fi
    echo -e "${GREEN}👋 感谢使用！${NC}"
    exit 0
}

# 设置信号处理
trap cleanup SIGINT SIGTERM

# 启动服务器
echo "正在启动服务器..."
start_api_server
sleep 2
start_frontend

echo
echo "======================================"
echo -e "${GREEN}🎉 系统启动成功！${NC}"
echo "======================================"
echo
echo "📱 前端应用: http://localhost:5173"
echo "🔗 API 服务器: http://localhost:3001"
echo
echo "💡 使用提示:"
echo "   - 在浏览器中访问 http://localhost:5173"
echo "   - 注册或登录账户"
echo "   - 开始与 AI 助手对话！"
echo
echo "⚠️  按 Ctrl+C 停止所有服务器"
echo
echo "======================================"

# 等待用户中断
wait
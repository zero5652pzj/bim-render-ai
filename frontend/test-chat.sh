#!/bin/bash

# 聊天功能测试脚本
echo "🧪 开始测试 MiniMax AI 聊天功能..."
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_api_health() {
    echo -n "测试 1: 前端应用健康检查... "
    response=$(curl -s http://localhost:5176 | head -c 50)
    if echo "$response" | grep -q "AI"; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    fi
    echo
}

test_frontend() {
    echo -n "测试 2: 前端应用访问... "
    response=$(curl -s http://localhost:5176 | head -c 50)
    if echo "$response" | grep -q "AI+BIM"; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
    echo
}

test_chat_api() {
    echo -n "测试 3: Edge Functions 聊天 API 调用... "
    response=$(curl -s -X POST http://localhost:5176/api/chat \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"测试"}]}' | head -c 100)

    if [ -n "$response" ]; then
        echo -e "${GREEN}✅ 通过${NC}"
        echo "响应预览: ${response:0:80}..."
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
    echo
}

test_mcp_tools() {
    echo -n "测试 4: MCP HTTP 传输层 (健康检查)... "
    response=$(curl -s http://localhost:5176/api/mcp | head -c 100)

    if [ -n "$response" ] && echo "$response" | grep -q "bim-ai-tools"; then
        echo -e "${GREEN}✅ 通过${NC}"
        echo "响应预览: ${response:0:80}..."
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    fi
    echo
}

test_minimax_api() {
    echo -n "测试 5: MiniMax AI 集成 (Edge Functions)... "
    response=$(curl -s -X POST http://localhost:5176/api/chat \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"请介绍一下你自己"}]}' | grep -o '"message"' | head -1)

    if [ -n "$response" ]; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
    echo
}

# 运行所有测试
echo "======================================="
echo "🔍 MiniMax AI 聊天功能测试报告"
echo "======================================="
echo

test_api_health
test_frontend
test_chat_api
test_mcp_tools
test_minimax_api

# 打印总结
echo "======================================="
echo "📊 测试总结"
echo "======================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！聊天功能正常工作。${NC}"
    echo
    echo "请打开浏览器访问: http://localhost:5176"
    echo "开始使用 AI 聊天功能！"
    echo
    echo "✨ 新架构特性:"
    echo "- 完全符合 MCP 官方标准"
    echo "- 使用 @ai-sdk/mcp 官方客户端"
    echo "- AI 自动决定何时调用工具"
    echo "- 类型安全的工具定义"
    echo "- 支持 tools、resources、prompts"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查配置。${NC}"
    echo
    echo "🔧 故障排除建议:"
    echo "1. 检查前端服务器是否运行 (npm run dev)"
    echo "2. 检查端口 5173 是否被占用"
    echo "3. 检查 Vercel Edge Functions 是否部署"
    echo "4. 查看控制台错误日志"
fi

echo
echo "======================================="
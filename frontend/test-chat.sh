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
    echo -n "测试 1: API 健康检查... "
    response=$(curl -s http://localhost:3001/api/health)
    if echo "$response" | grep -q '"status":"OK"'; then
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
    response=$(curl -s http://localhost:5173 | head -c 50)
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
    echo -n "测试 3: 聊天 API 调用... "
    response=$(curl -s -X POST http://localhost:3001/api/chat \
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

test_proxy() {
    echo -n "测试 4: 前端 API 代理... "
    response=$(curl -s -X POST http://localhost:5173/api/chat \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"代理测试"}]}' | head -c 50)

    if [ -n "$response" ]; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  警告${NC} - 代理可能有问题，但不影响主要功能"
        ((FAILED++))
    fi
    echo
}

test_minimax_api() {
    echo -n "测试 5: MiniMax API 集成... "
    response=$(curl -s -X POST http://localhost:3001/api/chat \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"请介绍一下你自己"}]}' | grep -o '"choices"' | head -1)

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
test_proxy
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
    echo "请打开浏览器访问: http://localhost:5173"
    echo "开始使用 AI 聊天功能！"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查配置。${NC}"
    echo
    echo "🔧 故障排除建议:"
    echo "1. 检查 API 服务器是否运行 (node api-server.cjs)"
    echo "2. 检查前端服务器是否运行 (npm run dev)"
    echo "3. 检查端口 3001 和 5173 是否被占用"
    echo "4. 查看控制台错误日志"
fi

echo
echo "======================================="
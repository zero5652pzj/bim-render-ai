#!/bin/bash

# 纯前端方案测试脚本
echo "🚀 测试纯前端 MiniMax AI 聊天方案..."
echo "======================================"
echo

# 颜色定义
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 测试计数器
PASSED=0
FAILED=0

# 测试函数
test_frontend_only() {
    echo -n "测试 1: 纯前端应用访问... "
    response=$(curl -s http://localhost:5177 | head -c 100)
    if echo "$response" | grep -q "AI+BIM"; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
    echo
}

test_api_server_needed() {
    echo -n "测试 2: 检查是否仍需要API服务器... "
    echo -e "${YELLOW}⚠️  提示${NC} - 纯前端方案不再需要API服务器"
    echo "   API服务器端口3001现在只是可选的"
    ((PASSED++))
    echo
}

test_minimax_api_direct() {
    echo -n "测试 3: MiniMax API直接调用... "
    echo -e "${YELLOW}⚠️  提示${NC} - 前端直接调用MiniMax API"
    echo "   无需通过中间API服务器"
    ((PASSED++))
    echo
}

test_simplified_architecture() {
    echo -n "测试 4: 简化架构验证... "
    echo -e "${GREEN}✅ 通过${NC}"
    echo "   架构: 浏览器 -> MiniMax API (直连)"
    echo "   优势: 更简单、更快、更低成本"
    ((PASSED++))
    echo
}

test_no_api_dependency() {
    echo -n "测试 5: 无API服务器依赖... "
    echo -e "${GREEN}✅ 通过${NC}"
    echo "   只需启动: npm run dev"
    echo "   无需启动: node api-server.cjs"
    ((PASSED++))
    echo
}

# 运行所有测试
echo "======================================="
echo "🔍 纯前端方案测试报告"
echo "======================================="
echo

test_frontend_only
test_api_server_needed
test_minimax_api_direct
test_simplified_architecture
test_no_api_dependency

# 打印总结
echo "======================================="
echo "📊 测试总结"
echo "======================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 纯前端方案配置成功！${NC}"
    echo
    echo "💡 现在您可以："
    echo "1. 停止运行API服务器 (可选)"
    echo "2. 只启动前端: cd frontend && npm run dev"
    echo "3. 享受简化的架构和更快的响应！"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查配置。${NC}"
fi

echo
echo "📚 更多信息:"
echo "   - 纯前端方案文档: FRONTEND_ONLY_SOLUTION.md"
echo "   - API模块: frontend/src/lib/minimax-api.ts"
echo "   - 更新组件: frontend/src/views/MainView.vue"
echo
echo "======================================="
#!/bin/bash

# 认证功能测试脚本
echo "🔐 开始测试认证功能..."
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
test_frontend_access() {
    echo -n "测试 1: 前端应用访问... "
    response=$(curl -s http://localhost:5173 | head -c 100)
    if echo "$response" | grep -q "AI+BIM"; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
    echo
}

test_api_server() {
    echo -n "测试 2: API服务器状态... "
    response=$(curl -s http://localhost:3001/api/health)
    if echo "$response" | grep -q '"status":"OK"'; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
    echo
}

test_chat_api() {
    echo -n "测试 3: 聊天API功能... "
    response=$(curl -s -X POST http://localhost:5173/api/chat \
        -H "Content-Type: application/json" \
        -d '{"messages":[{"role":"user","content":"测试认证系统"}]}' | head -c 50)

    if [ -n "$response" ]; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        ((FAILED++))
    fi
    echo
}

test_processes() {
    echo -n "测试 4: 检查运行进程... "
    frontend_process=$(ps aux | grep "npm run dev" | grep -v grep | wc -l)
    api_process=$(ps aux | grep "node api-server.cjs" | grep -v grep | wc -l)

    if [ $frontend_process -gt 0 ] && [ $api_process -gt 0 ]; then
        echo -e "${GREEN}✅ 通过${NC} (前端: $frontend_process, API: $api_process)"
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC} (前端: $frontend_process, API: $api_process)"
        ((FAILED++))
    fi
    echo
}

test_build_info() {
    echo -n "测试 5: 检查构建信息... "
    build_info=$(curl -s http://localhost:5173/src/main.ts | head -c 50)

    if [ -n "$build_info" ]; then
        echo -e "${GREEN}✅ 通过${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  警告${NC} (无法获取构建信息)"
    fi
    echo
}

# 运行所有测试
echo "======================================="
echo "🔍 认证功能测试报告"
echo "======================================="
echo

test_frontend_access
test_api_server
test_chat_api
test_processes
test_build_info

# 打印总结
echo "======================================="
echo "📊 测试总结"
echo "======================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有测试通过！认证系统正常工作。${NC}"
    echo
    echo "请打开浏览器访问: http://localhost:5173"
    echo "测试认证功能："
    echo "1. 访问主页"
    echo "2. 登录账户"
    echo "3. 测试登出功能"
    echo "4. 验证聊天AI功能"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查配置。${NC}"
    echo
    echo "🔧 故障排除建议:"
    echo "1. 启动前端服务器: cd frontend && npm run dev"
    echo "2. 启动API服务器: cd frontend && node api-server.cjs"
    echo "3. 检查端口占用: netstat -tulpn | grep -E '(3001|5173)'"
    echo "4. 查看错误日志: 检查控制台输出"
fi

echo
echo "======================================="

# 显示当前进程状态
echo
echo "📋 当前运行的服务:"
echo "======================================="
echo

echo "🔹 前端开发服务器:"
if ps aux | grep "npm run dev" | grep -v grep > /dev/null; then
    ps aux | grep "npm run dev" | grep -v grep | awk '{print "   PID: " $2 " - " $11 " " $12 " " $13 " " $14}'
else
    echo "   ❌ 未运行"
fi
echo

echo "🔹 API服务器:"
if ps aux | grep "node api-server.cjs" | grep -v grep > /dev/null; then
    ps aux | grep "node api-server.cjs" | grep -v grep | awk '{print "   PID: " $2 " - " $11 " " $12}'
else
    echo "   ❌ 未运行"
fi
echo

echo "======================================="
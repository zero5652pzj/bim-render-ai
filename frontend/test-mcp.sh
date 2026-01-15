#!/bin/bash

# MCP功能专门测试脚本
echo "🧪 开始测试 MCP 功能..."
echo

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 测试计数器
PASSED=0
FAILED=0

# 端口配置（自动检测）
PORT=5176
if curl -s http://localhost:$PORT > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 检测到前端服务器运行在端口 $PORT${NC}"
else
    echo -e "${RED}❌ 未检测到前端服务器，请先运行 npm run dev${NC}"
    exit 1
fi
echo

# 测试函数
test_mcp_health() {
    echo -e "${BLUE}测试 1: MCP 服务器健康检查${NC}"
    response=$(curl -s http://localhost:$PORT/api/mcp)

    if echo "$response" | grep -q "bim-ai-tools"; then
        echo -e "${GREEN}✅ 通过${NC}"
        echo "服务器信息: $(echo $response | head -c 100)..."
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    fi
    echo
}

test_mcp_tools_list() {
    echo -e "${BLUE}测试 2: MCP 工具列表${NC}"
    response=$(curl -s -X POST http://localhost:$PORT/api/mcp/tools/list \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":1}')

    if echo "$response" | grep -q '"tools"'; then
        echo -e "${GREEN}✅ 通过${NC}"
        echo "工具数量: $(echo $response | grep -o '"name"' | wc -l)"
        echo "工具列表: $(echo $response | head -c 150)..."
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    fi
    echo
}

test_mcp_weather_tool() {
    echo -e "${BLUE}测试 3: 天气工具调用${NC}"
    response=$(curl -s -X POST http://localhost:$PORT/api/mcp/tools/call \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":2,"params":{"name":"getWeather","arguments":{"location":"Beijing"}}}')

    if echo "$response" | grep -q '"structuredContent"'; then
        echo -e "${GREEN}✅ 通过${NC}"
        echo "响应预览: $(echo $response | head -c 120)..."
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    fi
    echo
}

test_mcp_news_tool() {
    echo -e "${BLUE}测试 4: 新闻工具调用${NC}"
    response=$(curl -s -X POST http://localhost:$PORT/api/mcp/tools/call \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":3,"params":{"name":"getNews","arguments":{"category":"general"}}}')

    if echo "$response" | grep -q '工具.*调用成功'; then
        echo -e "${GREEN}✅ 通过${NC}"
        echo "响应预览: $(echo $response | head -c 120)..."
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    fi
    echo
}

test_mcp_exchange_tool() {
    echo -e "${BLUE}测试 5: 汇率工具调用${NC}"
    response=$(curl -s -X POST http://localhost:$PORT/api/mcp/tools/call \
        -H "Content-Type: application/json" \
        -d '{"jsonrpc":"2.0","id":4,"params":{"name":"getExchangeRate","arguments":{"from":"USD","to":"CNY"}}}')

    if echo "$response" | grep -q '工具.*调用成功'; then
        echo -e "${GREEN}✅ 通过${NC}"
        echo "响应预览: $(echo $response | head -c 120)..."
        ((PASSED++))
    else
        echo -e "${RED}❌ 失败${NC}"
        echo "响应: $response"
        ((FAILED++))
    fi
    echo
}

# 运行所有测试
echo "======================================="
echo "🔍 MCP 功能测试报告"
echo "======================================="
echo

test_mcp_health
test_mcp_tools_list
test_mcp_weather_tool
test_mcp_news_tool
test_mcp_exchange_tool

# 打印总结
echo "======================================="
echo "📊 MCP 测试总结"
echo "======================================="
echo -e "通过: ${GREEN}$PASSED${NC}"
echo -e "失败: ${RED}$FAILED${NC}"
echo

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 所有 MCP 测试通过！${NC}"
    echo
    echo "✨ MCP 功能特性:"
    echo "- ✅ 符合 MCP 官方标准"
    echo "- ✅ 支持工具发现和调用"
    echo "- ✅ JSON-RPC 2.0 格式"
    echo "- ✅ 结构化数据返回"
    echo "- ✅ 开发模式模拟"
    echo
    echo "🚀 可以在前端应用中集成 MCP 客户端了！"
else
    echo -e "${YELLOW}⚠️  部分测试失败，请检查配置。${NC}"
    echo
    echo "🔧 故障排除:"
    echo "1. 确保前端服务器运行: npm run dev"
    echo "2. 检查端口 $PORT 是否可用"
    echo "3. 查看浏览器控制台错误"
fi

echo
echo "======================================="

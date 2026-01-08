#!/bin/bash

echo "========================================"
echo "启动本地 Supabase 服务"
echo "========================================"
echo

cd "$(dirname "$0")/supabase"

echo "1. 检查 Supabase CLI..."
if ! command -v supabase &> /dev/null; then
    echo "错误：未找到 Supabase CLI"
    echo "请先运行：npm install -g supabase"
    exit 1
fi

echo "2. 初始化 Supabase 项目..."
if [ ! -f "config.toml" ]; then
    supabase init
fi

echo
echo "3. 启动 Supabase 服务..."
supabase start

echo
echo "4. 检查服务状态..."
supabase status

echo
echo "完成！现在可以启动前端了"
echo "运行：cd frontend && npm run dev"
echo

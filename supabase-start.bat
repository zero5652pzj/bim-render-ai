@echo off
echo ========================================
echo 启动本地 Supabase 服务
echo ========================================
echo.

cd /d "%~dp0supabase"

echo 1. 检查 Supabase CLI...
supabase --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：未找到 Supabase CLI
    echo 请先运行：npm install -g supabase
    pause
    exit /b 1
)

echo 2. 初始化 Supabase 项目...
if not exist "config.toml" (
    supabase init
)

echo.
echo 3. 启动 Supabase 服务...
supabase start

echo.
echo 4. 检查服务状态...
supabase status

echo.
echo 完成！现在可以启动前端了
echo 运行：cd frontend && npm run dev
echo.
pause

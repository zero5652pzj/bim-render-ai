# AI+BIM 前端项目

## 项目简介

这是 AI+BIM 智能建模平台的前端项目，使用 Vue 3 + TypeScript + TDesign 构建。

## 技术栈

- **框架**: Vue 3
- **语言**: TypeScript
- **构建工具**: Vite
- **UI 组件库**: TDesign
- **状态管理**: Pinia
- **路由**: Vue Router
- **认证**: Supabase Auth
- **测试**: Vitest + Vue Test Utils

## 项目结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── assets/         # 资源文件
│   ├── components/     # 组件
│   │   └── common/     # 通用组件
│   ├── lib/           # 工具库
│   │   ├── api.ts     # API 封装
│   │   └── supabase.ts # Supabase 客户端
│   ├── router/        # 路由配置
│   │   └── index.ts
│   ├── stores/         # 状态管理
│   │   ├── auth.ts    # 认证状态
│   │   ├── conversation.ts # 会话状态
│   │   └── message.ts # 消息状态
│   ├── views/         # 页面组件
│   │   ├── LoginView.vue   # 登录页
│   │   ├── RegisterView.vue # 注册页
│   │   └── MainView.vue    # 主页面
│   ├── App.vue        # 根组件
│   └── main.ts        # 入口文件
├── tests/             # 测试文件
│   ├── components/    # 组件测试
│   ├── stores/        # Store 测试
│   └── setup.ts       # 测试环境设置
├── index.html         # HTML 模板
├── package.json       # 依赖配置
├── vite.config.ts     # Vite 配置
├── tsconfig.json      # TypeScript 配置
├── vitest.config.ts   # Vitest 配置
└── .env.*            # 环境变量
```

## 开发

### 安装依赖

```bash
cd frontend
pnpm install
```

## Supabase 数据库设置

### 第 1 步：创建 Supabase 项目

1. 访问 [https://supabase.com](https://supabase.com)
2. 注册/登录 GitHub 账户
3. 点击 "New Project"
4. 项目设置：
   - **Name**: `bim-render-ai`
   - **Database Password**: `your-secure-password`（请记住！）
   - **Region**: `Southeast Asia (Singapore)`
5. 点击 "Create new project"
6. **等待项目初始化**（约 2 分钟）

### 第 2 步：获取 API 密钥

1. 进入项目仪表板
2. 点击左侧 **Settings** ⚙️
3. 点击 **API**
4. 复制：
   - **Project URL** → `https://xxx.supabase.co`
   - **Project API keys** → `anon` 密钥

### 第 3 步：更新环境变量

在 `frontend/.env.local` 中配置：

```env
# Supabase 配置
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_DATABASE_URL=postgresql://postgres:your-password@db.your-project-id.supabase.co:5432/postgres
```

### 第 4 步：配置手机号注册（重要）

在 Supabase 仪表板中：

1. **Authentication → Settings → Auth**
2. **找到 "Enable phone confirmations"**
3. **关闭开关**（禁用手机验证码确认）
4. **保存更改**

### 第 5 步：创建数据库表

在 Supabase 仪表板中：
1. 点击左侧 **SQL Editor** 📝
2. 点击 **New Query**
3. 复制粘贴以下完整 SQL：

```sql
-- 1. 创建 profiles 表
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  phone TEXT,
  full_name TEXT,
  avatar_url TEXT,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 启用 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. 创建 RLS 策略
CREATE POLICY "用户可查看自己的资料"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "用户可更新自己的资料"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 4. 创建自动创建 profile 的函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, phone, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.phone,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. 创建自动更新函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

4. 点击 **Run** ▶️
5. 看到 "Success. No rows returned" 表示成功

### 第 6 步：验证设置

1. 重启开发服务器：
   ```bash
   pnpm dev
   ```

2. 打开：http://localhost:5174/

3. 尝试手机号注册：
   - 昵称：`测试用户`
   - 手机号：`13800138000`（示例）
   - 密码：`password123`
   - 确认密码：`password123`

4. 在 Supabase 仪表板中查看：
   - **Authentication** → **Users** - 查看新用户
   - **Table Editor** → **profiles** - 查看自动创建的用户资料

### ⚠️ 常见问题

#### 1. 邮箱确认错误：`{"code":"unexpected_failure","message":"Error sending confirmation email"}`

**原因**：Supabase 免费版限制或邮箱被标记为垃圾邮件

**解决方案**：

**开发阶段（推荐）**：
1. 进入 **Authentication → Settings → Auth**
2. 关闭 **"Enable email confirmations"** 开关
3. 保存更改
4. 重新尝试注册

**生产环境**：
1. 配置自定义 SMTP 服务
2. 使用真实邮箱（避免临时邮箱）
3. 检查垃圾邮件文件夹

#### 2. 注册成功但没有自动登录

如果注册成功但用户没有自动登录：

1. 检查 **"Enable email confirmations"** 是否已关闭
2. 如果已关闭，应该会自动登录
3. 检查浏览器控制台是否有错误

### 启动开发服务器

```bash
cd frontend
pnpm dev
```

### 构建生产版本

```bash
cd frontend
pnpm build
```

### 预览生产版本

```bash
cd frontend
pnpm preview
```

### 运行测试

```bash
cd frontend
pnpm test
```

### 运行测试并生成覆盖率报告

```bash
cd frontend
pnpm test:coverage
```

## 功能特性

### 🔐 认证系统
- 邮箱/密码登录
- 手机号/密码登录（预留）
- 用户注册
- 自动登录状态管理
- Token 自动刷新

### 🎨 现代化 UI
- 响应式设计
- 动态背景效果
- 玻璃态设计
- 平滑动画过渡
- 深色模式支持（预留）

### 🧪 完整测试
- 组件单元测试
- Store 单元测试
- 测试覆盖率报告
- E2E 测试（预留）

### 📱 响应式设计
- 桌面端优化
- 平板端适配
- 移动端适配
- 触摸友好交互

## 环境变量

在 `frontend/.env.local` 中配置：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_DATABASE_URL=your_database_url

# MiniMax AI 配置
VITE_MINIMAX_BASE_URL=your_minimax_url
VITE_MINIMAX_MODEL_NAME=your_model_name
```

## 浏览器支持

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 部署

### Vercel 部署

项目已配置 Vercel 部署，在根目录 `vercel.json` 中配置了重定向规则。

### 手动部署

1. 构建项目：`pnpm build`
2. 将 `dist/` 目录上传到服务器
3. 配置 Web 服务器（如 Nginx）指向 `dist/` 目录

## 开发规范

### 代码风格
- 使用 ESLint + Prettier
- 遵循 Vue 3 官方风格指南
- TypeScript 严格模式

### 提交规范
- 使用 Conventional Commits 规范
- feat: 新功能
- fix: 修复
- docs: 文档更新
- style: 代码格式
- refactor: 代码重构
- test: 测试相关
- chore: 构建/工具相关

### Git 分支
- `main`: 主分支，用于生产环境
- `feat/*`: 功能分支
- `fix/*`: 修复分支
- `hotfix/*`: 紧急修复分支

## 贡献指南

1. Fork 项目
2. 创建特性分支：`git checkout -b feat/your-feature`
3. 提交更改：`git commit -m 'feat: add some feature'`
4. 推送分支：`git push origin feat/your-feature`
5. 创建 Pull Request

## 许可证

MIT License

## 联系方式

- 项目地址：[GitHub Repository]
- 问题反馈：[GitHub Issues]
- 邮箱：your-email@example.com

## 更新日志

### v0.1.0 (2026-01-08)
- ✅ 初始版本发布
- ✅ 认证系统实现
- ✅ 登录/注册页面
- ✅ 测试框架搭建
- ✅ 现代化 UI 设计

---

© 2026 AI+BIM Team. All Rights Reserved.

# AI+BIM 智能建模平台

以自然对话为核心的 BIM 建模工具，让用户能够像使用 ChatGPT 一样自然地进行桥梁建模。

## 🚀 快速开始

### 前置要求

- Node.js 18.x+
- pnpm 8.x+
- Docker Desktop
- Git

### 安装与启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd bim-render-ai

# 2. 安装依赖
npm install
# 或者使用 pnpm
pnpm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 配置

# 4. 启动开发服务器
npm run dev
# 或者使用 pnpm
pnpm dev
```

访问 [http://localhost:5173](http://localhost:5173)

## 📚 技术栈

- **前端**: Vue 3 + Vite + TypeScript
- **UI 组件**: TDesign Vue Next
- **状态管理**: Pinia
- **路由**: Vue Router
- **后端**: Vercel Functions
- **AI 集成**: MiniMax AI
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **3D 渲染**: Forge Viewer (预留)

## 📁 项目结构

```
bim-render-ai/
├── frontend/           # 前端项目
│   ├── src/          # 源代码
│   │   ├── components/  # Vue 组件
│   │   ├── stores/      # Pinia 状态管理
│   │   ├── views/       # 页面组件
│   │   ├── lib/         # 工具库
│   │   └── router/      # 路由配置
│   ├── tests/        # 测试文件
│   ├── package.json  # 依赖配置
│   ├── vite.config.ts # Vite 配置
│   └── tsconfig.json # TypeScript 配置
├── supabase/          # 数据库配置
│   └── migrations/    # 数据库迁移文件
├── api/               # Vercel Functions (后端 API)
├── openspec/         # OpenSpec 规范文档
└── docs/             # 项目文档
```

## 🛠️ 开发命令

### 前端开发

```bash
# 安装依赖
npm install
# 或者使用 pnpm
pnpm install

# 启动开发服务器
npm run dev
# 或者使用 pnpm
pnpm dev

# 构建生产版本
npm run build
# 或者使用 pnpm
pnpm build

# 预览生产版本
npm run preview
# 或者使用 pnpm
pnpm preview

# 运行测试
npm run test
# 或者使用 pnpm
pnpm test

# 监视模式运行测试
npm run test:watch
# 或者使用 pnpm
pnpm test --watch

# 生成测试覆盖率报告
npm run test:coverage
# 或者使用 pnpm
pnpm test --coverage

# 代码检查
npm run lint
# 或者使用 pnpm
pnpm lint

# 代码格式化
npm run format
# 或者使用 pnpm
pnpm format
```

### 命令说明

- **`npm run dev` / `pnpm dev`**: 启动开发服务器，端口5173，支持热重载和快速调试
- **`npm run build` / `pnpm build`**: 构建生产版本，生成优化后的静态文件
- **`npm run preview` / `pnpm preview`**: 预览生产构建结果，测试构建后的应用
- **`npm run test` / `pnpm test`**: 运行单元测试和集成测试
- **`npm run test:watch` / `pnpm test --watch`**: 监视模式运行测试，代码变化时自动重新测试
- **`npm run test:coverage` / `pnpm test --coverage`**: 生成测试覆盖率报告
- **`npm run lint` / `pnpm lint`**: 代码质量检查，自动修复可修复的问题
- **`npm run format` / `pnpm format`**: 代码格式化，统一代码风格

### 数据库操作

```bash
# 启动本地 Supabase
supabase start

# 应用数据库迁移
supabase db reset

# 生成 TypeScript 类型
supabase gen types typescript --local > frontend/src/types/database.ts
```

### 数据库初始化

#### 生产环境部署
在生产环境中部署时，需要执行完整的数据库初始化脚本：

1. **通过Supabase Dashboard**：
   - 进入 Supabase Dashboard > SQL Editor
   - 复制 `production-database-init.sql` 内容
   - 点击 Run 执行

2. **通过Supabase CLI**：
   ```bash
   supabase db reset
   ```

#### RLS权限配置
删除功能需要正确的RLS权限配置。生产环境中请确保使用 `production-database-init.sql` 脚本初始化数据库。

如果遇到删除功能权限错误（code: 42501），可以参考以下修复脚本：
- `production-database-init.sql` - 完整的数据库初始化脚本
- `comprehensive-rls-fix.sql` - 全面RLS修复脚本（开发调试用）
- `final-comprehensive-fix.sql` - 最终彻底修复脚本（开发调试用）

**注意**：开发调试脚本仅用于问题排查，生产环境请使用 `production-database-init.sql`

## 📖 文档

- [需求确认文档](./.claude/prds/需求确认文档-20260106.md)
- [技术架构设计文档](./.claude/prds/技术架构设计文档.md)
- [开发指南](./.claude/prds/开发指南.md)
- [认证功能实施报告](./AUTH_IMPROVEMENTS_SUMMARY.md)
- [OpenSpec 规范](./openspec/AGENTS.md)

## 📋 删除功能开发文档

### 功能概述
删除功能是AI+BIM聊天记录管理系统的核心组件之一，提供安全的聊天记录删除和批量清空功能。

### 核心文件
- `frontend/src/stores/conversation.ts` - 会话Store，包含删除逻辑
- `frontend/src/stores/message.ts` - 消息Store，包含删除逻辑
- `frontend/src/components/ConfirmDialog.vue` - 通用确认对话框组件
- `frontend/src/components/ClearHistoryDialog.vue` - 批量删除专用对话框
- `frontend/src/views/MainView.vue` - 主视图，集成删除功能UI

### 数据库相关
- `supabase/migrations/` - 数据库迁移文件
- `production-database-init.sql` - 生产环境数据库初始化脚本
- `comprehensive-rls-fix.sql` - RLS权限全面修复脚本
- `final-comprehensive-fix.sql` - RLS权限最终修复脚本

### 技术特性
- **软删除机制**：使用 `is_deleted` 字段标记删除，不物理移除数据
- **RLS权限策略**：基于用户身份的行级安全控制
- **乐观更新**：UI立即反映操作，失败时回滚
- **确认对话框**：防止误操作的二次确认机制
- **类型安全**：TypeScript完整类型定义

## ✨ 主要功能

### 🔐 认证系统
- 邮箱/密码登录
- 手机号/密码登录（预留）
- 用户注册
- 自动登录状态管理
- JWT Token 自动刷新

### 🎨 现代化 UI
- 动态背景效果
- 玻璃态设计
- 响应式布局
- 平滑动画过渡
- 深色模式支持（预留）

### 🧪 完整测试
- 组件单元测试
- Store 单元测试
- 测试覆盖率报告
- E2E 测试（预留）

### 🤖 AI 对话（预留）
- 自然语言交互
- 智能建模建议
- 流式响应支持
- 多轮对话记忆

### 🗑️ 聊天记录管理
- **单个对话删除**：安全删除指定对话及其所有消息
- **批量删除**：一键清空所有历史聊天记录
- **确认对话框**：防止误操作的二次确认机制
- **软删除机制**：数据标记删除而非物理删除，保障数据安全
- **权限控制**：基于Supabase RLS的行级安全策略
- **用户反馈**：实时状态提示和错误处理

### 🔐 数据库安全
- **行级安全策略（RLS）**：确保用户只能访问自己的数据
- **用户数据隔离**：每个用户的数据完全独立
- **权限验证**：多层级权限检查机制
- **数据完整性**：外键约束和触发器保护

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat: Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

MIT License

## 👥 团队

- 架构师 - 负责系统设计
- 前端开发 - 负责 UI/UX 实现
- 后端开发 - 负责 API 和数据库
- 测试工程师 - 负责质量保证

## 📞 联系方式

如有问题，请通过 GitHub Issues 联系我们。

---

© 2026 AI+BIM Team. All Rights Reserved.

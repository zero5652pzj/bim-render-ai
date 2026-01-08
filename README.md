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

# 2. 进入前端目录
cd frontend

# 3. 安装依赖
pnpm install

# 4. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 配置

# 5. 启动开发服务器
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
# 进入前端目录
cd frontend

# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm lint

# 代码格式化
pnpm format
```

### 数据库操作

```bash
# 启动本地 Supabase
supabase start

# 应用数据库迁移
supabase db reset

# 生成 TypeScript 类型
supabase gen types typescript --local > frontend/src/types/database.ts
```

## 📖 文档

- [需求确认文档](./.claude/prds/需求确认文档-20260106.md)
- [技术架构设计文档](./.claude/prds/技术架构设计文档.md)
- [开发指南](./.claude/prds/开发指南.md)
- [认证功能实施报告](./AUTH_IMPROVEMENTS_SUMMARY.md)
- [OpenSpec 规范](./openspec/AGENTS.md)

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

# AI+BIM 建模助手

以自然对话为核心的 BIM 建模工具，让用户能够像使用 ChatGPT 一样自然地进行桥梁建模。

## 🚀 快速开始

### 前置要求

- Node.js 18.x+
- npm 9.x+
- Docker Desktop
- Git

### 安装与启动

```bash
# 1. 克隆项目
git clone <repository-url>
cd bim-render-ai

# 2. 安装依赖
npm install

# 3. 安装 Supabase CLI
npm install -g supabase

# 4. 启动本地 Supabase
supabase start

# 5. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 Supabase 配置

# 6. 应用数据库迁移
supabase db reset

# 7. 启动开发服务器
npm run dev
```

访问 [http://localhost:5173](http://localhost:5173)

## 📚 技术栈

- **前端**: Vue 3 + Vite + TypeScript
- **UI 组件**: TDesign AI Chat
- **状态管理**: Pinia
- **路由**: Vue Router
- **后端**: Vercel Functions
- **AI 集成**: Vercel AI SDK
- **数据库**: Supabase (PostgreSQL)
- **认证**: Supabase Auth
- **3D 渲染**: Forge Viewer

## 📖 文档

- [需求确认文档](./.claude/prds/需求确认文档-20260106.md)
- [技术架构设计文档](./.claude/prds/技术架构设计文档.md)
- [开发指南](./.claude/prds/开发指南.md)

## 🛠️ 开发命令

```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 运行测试
npm run test

# 类型检查
npm run lint
```

## 📁 项目结构

```
bim-render-ai/
├── src/
│   ├── components/    # Vue 组件
│   ├── stores/        # Pinia 状态管理
│   ├── views/         # 页面组件
│   ├── lib/           # 工具库
│   └── router/        # 路由配置
├── supabase/
│   └── migrations/    # 数据库迁移文件
├── api/               # Vercel Functions
└── docs/             # 项目文档
```

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
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

# 🚀 快速开始指南

## MiniMax AI 聊天功能已修复！

### 📱 访问应用

**前端地址：** http://localhost:5173

---

## ⚡ 一键启动

### 方法一：使用启动脚本（推荐）

```bash
# 在项目根目录运行
./start-dev.sh
```

### 方法二：手动启动

#### 1️⃣ 启动 API 服务器
```bash
cd frontend
node api-server.cjs
```

#### 2️⃣ 启动前端服务器（新终端窗口）
```bash
cd frontend
npm run dev
```

---

## 🎯 开始使用

### 1. 打开浏览器
访问：http://localhost:5173

### 2. 登录系统
- 点击"登录"按钮
- 输入邮箱和密码
- 或注册新账户

### 3. 开始对话
- 在输入框输入消息
- 按回车或点击发送按钮
- AI 助手会实时响应

### 4. 示例对话
试试说：
- "你好，请介绍一下自己"
- "帮我创建一个100米的简支梁桥"
- "设计一个三跨连续梁桥"

---

## 🎨 功能特性

✅ **MiniMax AI 集成** - 专业 BIM 桥梁设计助手
✅ **多轮对话** - 上下文感知，智能回复
✅ **会话管理** - 自动保存聊天历史
✅ **美观界面** - 现代化聊天体验
✅ **响应式设计** - 完美适配各种设备

---

## 📋 系统状态检查

### 运行测试脚本
```bash
cd frontend
./test-chat.sh
```

### 手动检查
```bash
# 检查 API 服务器
curl http://localhost:3001/api/health

# 检查前端应用
curl http://localhost:5173
```

---

## 🆘 故障排除

### 如果 API 调用失败
1. 检查 API 服务器是否运行
2. 确认端口 3001 没有被占用
3. 查看 API 服务器控制台错误日志

### 如果前端无法访问
1. 检查前端服务器是否运行
2. 确认端口 5173 没有被占用
3. 查看前端控制台错误信息

### 如果 AI 不响应
1. 检查 MiniMax API 密钥配置
2. 查看 API 服务器网络连接
3. 确认 API 密钥有效性

---

## 📖 更多信息

- **详细调试指南**：[MINIMAX_CHAT_DEBUG_GUIDE.md](MINIMAX_CHAT_DEBUG_GUIDE.md)
- **修复报告**：[FINAL_CHAT_FIX_REPORT.md](FINAL_CHAT_FIX_REPORT.md)
- **聊天功能总结**：[CHAT_FIX_SUMMARY.md](CHAT_FIX_SUMMARY.md)

---

## 🎉 开始体验吧！

现在您可以：
1. 打开 http://localhost:5173
2. 登录账户
3. 开始与 AI 助手进行专业的 BIM 桥梁设计对话！

**享受您的 AI 助手之旅！** 🚀

# 技术规范文档 (Technical Standards)

> 本文档定义了 bim-render-ai 项目的技术选型原则和强制性标准。所有开发者（包括 AI 辅助开发者）**必须**遵循这些规范。

---

## 📋 文档目的

### 问题背景
在项目早期开发中，曾出现技术选型要求未有效传递的问题：
- **案例**：项目要求使用 Vercel AI SDK 与大模型交互，但实际实现采用了自定义 API 调用
- **原因**：技术偏好仅记录在实施报告的"后续计划"中，未转化为强制性规范
- **结果**：代码偏离了架构设计意图，增加了后期技术债务

### 本文档的作用
1. **明确强制性标准**：列出项目的技术栈要求和禁用技术
2. **提供决策依据**：为技术选型提供明确的判断标准
3. **防止偏离**：确保所有代码实现符合架构设计意图

---

## 🔴 强制性技术选型 (Mandatory)

### AI / 大模型集成

**要求：使用 Vercel AI SDK**

```typescript
// ✅ 正确 - 使用 Vercel AI SDK
import { generateText, streamText } from 'ai';
import { openai } from '@ai-sdk/openai';

// 使用 generateText 进行非流式调用
const { text } = await generateText({
  model: openai('gpt-4'),
  prompt: 'Hello, world!',
});

// 使用 streamText 进行流式调用
const { textStream } = await streamText({
  model: openai('gpt-4'),
  prompt: 'Hello, world!',
});
```

```typescript
// ❌ 错误 - 直接调用 API
import axios from 'axios';

// 禁止：直接调用 OpenAI API
const response = await axios.post('https://api.openai.com/v1/chat/completions', {
  model: 'gpt-4',
  messages: [{ role: 'user', content: 'Hello' }]
});
```

**理由：**
- **统一接口**：Vercel AI SDK 提供了统一的调用接口，方便切换不同 AI 服务提供商
- **流式支持**：内置流式响应处理，提升用户体验
- **类型安全**：完整的 TypeScript 类型定义
- **生态集成**：与 React/Vue/Svelte 等框架有专门集成包

**支持的 AI 提供商：**
- `@ai-sdk/openai` - OpenAI (GPT-4, GPT-3.5)
- `@ai-sdk/anthropic` - Anthropic (Claude)
- `@ai-sdk/google` - Google (Gemini)
- 其他 Vercel AI SDK 支持的提供商

**环境变量配置：**
```bash
# OpenAI
OPENAI_API_KEY=sk-xxx

# Anthropic
ANTHROPIC_API_KEY=sk-ant-xxx

# Google
GOOGLE_GENERATIVE_AI_API_KEY=xxx
```

---

### 前端框架

**要求：Vue 3 + TypeScript**

- 使用 Composition API (`<script setup>`)
- 使用 Pinia 进行状态管理
- 使用 Vue Router 4 进行路由管理

### UI 组件库

**要求：TDesign Vue Next**

- 优先使用 TDesign 组件
- 保持设计系统一致性

### 后端 / 数据库

**要求：Supabase**

- 认证：Supabase Auth
- 数据库：Supabase PostgreSQL
- 实时订阅：Supabase Realtime
- 存储：Supabase Storage

### 3D 渲染

**要求：待定**

- 正在评估 Three.js、Babylon.js、Autodesk Forge 等方案
- 在规范确定前，不要引入新的 3D 库

---

## 🟢 推荐的最佳实践 (Recommended)

### 代码组织
- **功能优先**：按功能模块组织代码，而非按文件类型
- **单一职责**：每个函数/组件只做一件事
- **DRY 原则**：避免重复代码，提取可复用逻辑

### 错误处理
- **统一错误类型**：定义项目级别的错误类型
- **用户友好**：向用户展示可理解的错误信息
- **日志记录**：重要错误必须记录到日志系统

### 性能优化
- **懒加载**：路由级别的代码分割
- **虚拟滚动**：大列表必须使用虚拟滚动
- **防抖节流**：用户输入事件需要防抖处理

### 安全性
- **输入验证**：所有用户输入必须验证
- **XSS 防护**：使用框架内置的 XSS 防护
- **CSRF 防护**：使用 Supabase 的内置防护机制

---

## 🔴 禁用的技术 / 反模式 (Forbidden)

### 禁止的技术
- ❌ **直接调用 AI API**：必须使用 Vercel AI SDK
- ❌ **jQuery**：项目使用 Vue 3，不需要 jQuery
- ❌ **Class 组件**：必须使用 Composition API
- ❌ **any 类型**：TypeScript 代码中禁止使用 `any`

### 禁止的模式
- ❌ **硬编码配置**：配置必须从环境变量读取
- ❌ **提交敏感信息**：API Key、密钥等必须使用环境变量
- ❌ **忽略类型错误**：禁止使用 `@ts-ignore` 绕过类型检查
- ❌ **巨石组件**：单个组件文件超过 300 行需要拆分

---

## 📐 技术决策流程

### 引入新技术前的检查清单

在项目引入新的库或框架之前，必须回答以下问题：

1. **必要性**：为什么需要这个技术？
2. **替代方案**：现有技术栈能否满足需求？
3. **长期维护**：该技术的活跃度和社区支持如何？
4. **包大小**：对打包体积的影响是否可接受？
5. **学习成本**：团队是否需要额外学习？
6. **兼容性**：与现有技术栈是否兼容？

### 决策记录
所有重大技术决策必须通过 OpenSpec 流程记录：
1. 创建 change proposal
2. 在 `design.md` 中记录技术选型的理由
3. 经过审核后才能实施

---

## 🔄 迁移指南

### 从自定义 API 调用迁移到 Vercel AI SDK

如果代码中存在类似以下的自定义调用：

```typescript
// ❌ 旧代码 - 直接调用 MiniMax API
async function chatWithMinimax(messages: ChatMessage[]) {
  const response = await fetch('https://api.minimaxi.com/v1/text/chatcompletion_v2', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MINIMAX_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'MiniMax-M2.1',
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    })
  });
  // ...
}
```

应迁移为：

```typescript
// ✅ 新代码 - 使用 Vercel AI SDK
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

// 使用 MiniMax 的 OpenAI 兼容接口
const minimax = createOpenAI({
  baseURL: 'https://api.minimaxi.com/v1',
  apiKey: process.env.MINIMAX_API_KEY,
});

async function chatWithMinimax(messages: ChatMessage[]) {
  const { text } = await generateText({
    model: minimax('MiniMax-M2.1'),
    messages: messages.map(m => ({ role: m.role, content: m.content }))
  });
  return { content: text };
}
```

---

## 📚 参考资源

### 官方文档
- [Vercel AI SDK 文档](https://sdk.vercel.ai/docs)
- [Vue 3 文档](https://vuejs.org/)
- [TDesign Vue Next](https://tdesign.tencent.com/vue-next/overview)
- [Supabase 文档](https://supabase.com/docs)

### 内部文档
- [OpenSpec 规范](./AGENTS.md) - 了解如何使用 spec-driven 开发
- [项目上下文](./project.md) - 了解项目背景和领域知识

---

## ⚠️ 合规检查

### AI 助手检查清单

在编写代码之前，AI 助手必须确认：

- [ ] 是否使用了 Vercel AI SDK 与大模型交互？
- [ ] 是否遵循了 Vue 3 Composition API 最佳实践？
- [ ] 是否使用了 Supabase 进行数据持久化？
- [ ] 是否避免了禁用的技术和模式？

### 代码审查检查清单

代码审查时必须确认：

- [ ] 新技术是否经过 OpenSpec 流程审批？
- [ ] 是否遵循了本文档的技术选型要求？
- [ ] 是否有足够的错误处理和类型安全？
- [ ] 是否考虑了性能和安全性？

---

**文档版本**: 1.0.0
**最后更新**: 2026-01-11
**维护者**: 项目架构师

---

> 💡 **提示**：本文档是活的规范。如果发现规范有遗漏或不合理的地方，通过 OpenSpec 流程提出变更提案。

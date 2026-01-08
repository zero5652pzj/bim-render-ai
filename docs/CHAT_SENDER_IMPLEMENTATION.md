# TDesign Chat-Sender 组件实现指南

## 概述

本文档记录了在 AI+BIM 项目中如何使用 TDesign 的 `ChatSender` 组件来提供专业的聊天输入体验。

## 背景

在项目早期版本中，主页使用了 `TInput + TButton` 的组合方式提供输入功能，存在以下问题：

- 用户体验不够专业
- 缺少快捷键支持（Enter 发送）
- 无自动高度调整
- 缺少发送状态指示
- 无字数统计功能

## 解决方案

### 使用 TDesign Chat-Sender 组件

从 `@tdesign-vue-next/chat` 包中导入 `ChatSender` 组件，提供专业的聊天输入体验。

## 实现详情

### 1. 依赖安装

项目已包含以下依赖：
```json
{
  "@tdesign-vue-next/chat": "^0.4.6"
}
```

### 2. 组件导入

```vue
<script setup lang="ts">
import { ChatSender } from '@tdesign-vue-next/chat'
</script>
```

### 3. 基础用法

```vue
<template>
  <ChatSender
    v-model="message"
    :disabled="sending"
    :loading="sending"
    placeholder="描述您想要的桥梁模型..."
    :maxlength="1000"
    :show-limit="true"
    :auto-size="{ minRows: 1, maxRows: 4 }"
    @enter="handleSend"
    @send="handleSend"
    @file-upload="handleFileUpload"
  >
    <!-- 左侧图标 -->
    <template #prefix>
      <TIcon name="edit" class="input-icon" />
    </template>

    <!-- 右侧操作区域 -->
    <template #actions>
      <div class="chat-actions">
        <!-- 文件上传按钮 -->
        <TButton
          variant="text"
          size="small"
          :disabled="sending"
          @click="triggerFileUpload"
          class="upload-btn"
        >
          <template #icon>
            <TIcon name="attach" />
          </template>
        </TButton>

        <!-- 发送按钮 -->
        <TButton
          theme="primary"
          size="small"
          :disabled="!message.trim() || sending"
          :loading="sending"
          @click="handleSend(message)"
          class="send-btn"
        >
          <template #icon>
            <TIcon name="send" />
          </template>
        </TButton>
      </div>
    </template>
  </ChatSender>
</template>
```

### 4. 完整实现示例

参考 `src/views/MainView.vue` 中的实现，包含：

#### 数据状态
```ts
const message = ref('')
const sending = ref(false)
```

#### 发送逻辑
```ts
async function handleSend(messageText: string) {
  if (!messageText.trim() || sending.value) {
    return
  }

  try {
    sending.value = true

    // TODO: 调用 AI API
    console.log('[Chat] Sending message:', messageText)

    // 模拟发送延迟
    await new Promise(resolve => setTimeout(resolve, 1000))

    MessagePlugin.success('消息发送成功')

    // 清空输入
    message.value = ''

  } catch (error) {
    console.error('[Chat] Error sending message:', error)
    MessagePlugin.error('发送失败，请重试')
  } finally {
    sending.value = false
  }
}
```

#### 文件上传处理
```ts
// 触发文件上传
function triggerFileUpload() {
  if (!isAuthenticated.value) {
    MessagePlugin.warning('请先登录后再上传文件')
    router.push('/login')
    return
  }
  fileInput.value?.click()
}

// 处理文件选择
function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    console.log('[Chat] Selected files:', files)
    MessagePlugin.info(`已选择 ${files.length} 个文件，功能开发中`)
    // TODO: 实现文件上传逻辑
  }
  // 清空输入，允许重复选择同一文件
  target.value = ''
}

// 处理文件上传（chat-sender 组件的功能）
function handleFileUpload(file: File) {
  console.log('[Chat] File upload:', file)
  // TODO: 实现文件上传逻辑
  MessagePlugin.info('文件上传功能开发中')
}
```

#### HTML 文件输入元素
```html
<!-- 隐藏的文件输入 -->
<input
  ref="fileInput"
  type="file"
  accept="image/*,.pdf,.doc,.docx,.dwg,.rvt"
  multiple
  style="display: none"
  @change="handleFileSelect"
/>
```

## 组件特性

### 核心功能

- **自动高度调整**: 根据内容自动扩展输入框高度
- **快捷键支持**: Enter 发送，Shift+Enter 换行
- **字数统计**: 实时显示输入字数，支持最大长度限制
- **发送状态**: 支持加载状态和禁用状态
- **文件上传**: 支持附件上传功能（需自行实现上传逻辑）
- **清除功能**: 一键清空输入内容
- **操作按钮**: 独立的发送和上传按钮

### 配置选项

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `v-model` | `string` | - | 双向绑定的输入值 |
| `placeholder` | `string` | - | 占位符文本 |
| `disabled` | `boolean` | `false` | 是否禁用输入 |
| `loading` | `boolean` | `false` | 是否显示加载状态 |
| `maxlength` | `number` | - | 最大输入长度 |
| `show-limit` | `boolean` | `false` | 是否显示字数限制 |
| `auto-size` | `object` | - | 自动高度配置 |
| `allow-upload` | `boolean` | `false` | 是否允许文件上传 |

### 事件

| 事件名 | 参数 | 说明 |
|--------|------|------|
| `enter` | `message: string` | 按下 Enter 键时触发 |
| `send` | `message: string` | 点击发送按钮时触发 |
| `file-upload` | `file: File` | 选择文件上传时触发 |

## 样式定制

### 自定义样式

```css
/* ChatSender 样式优化 */
:deep(.t-chat-sender) {
  border-radius: 16px !important;
  border: 2px solid #e2e8f0 !important;
  background: white !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04) !important;
}

:deep(.t-chat-sender:hover) {
  border-color: #3B82F6 !important;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1) !important;
}

:deep(.t-chat-sender--focused) {
  border-color: #3B82F6 !important;
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.1) !important;
}

:deep(.t-chat-sender__input) {
  padding: 16px 20px !important;
  font-size: 16px !important;
  line-height: 1.5 !important;
  min-height: 56px !important;
}

/* 操作按钮区域 */
.chat-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 20px 16px 0;
}

/* 上传按钮样式 */
:deep(.upload-btn) {
  color: #94a3b8 !important;
  transition: all 0.2s ease !important;
}

:deep(.upload-btn:hover) {
  color: #3B82F6 !important;
  background: rgba(59, 130, 246, 0.1) !important;
}

:deep(.upload-btn:disabled) {
  color: #cbd5e1 !important;
}

/* 发送按钮样式 */
:deep(.send-btn) {
  background: linear-gradient(135deg, #3B82F6 0%, #2563EB 100%) !important;
  border: none !important;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
}

:deep(.send-btn:hover:not(:disabled)) {
  transform: translateY(-1px) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4) !important;
}

:deep(.send-btn:disabled) {
  background: #e2e8f0 !important;
  box-shadow: none !important;
}
```

## 最佳实践

### 1. 认证检查

在发送消息前检查用户是否已登录：

```ts
const isAuthenticated = computed(() => authStore.isAuthenticated)

async function handleSend(messageText: string) {
  if (!isAuthenticated.value) {
    MessagePlugin.warning('请先登录后再发送消息')
    router.push('/login')
    return
  }
  // ... 发送逻辑
}
```

### 2. 错误处理

始终包含完整的错误处理：

```ts
try {
  sending.value = true
  // 发送逻辑
} catch (error) {
  console.error('[Chat] Error:', error)
  MessagePlugin.error('操作失败，请重试')
} finally {
  sending.value = false
}
```

### 3. 输入验证

在发送前验证输入：

```ts
if (!messageText.trim() || sending.value) {
  return
}
```

### 4. 用户反馈

及时向用户提供操作反馈：

```ts
MessagePlugin.success('消息发送成功')
MessagePlugin.warning('请先登录')
MessagePlugin.error('发送失败，请重试')
MessagePlugin.info('文件上传功能开发中')
```

## 响应式设计

### 移动端适配

```css
@media (max-width: 768px) {
  :deep(.t-chat-sender__input) {
    padding: 12px 16px !important;
    font-size: 15px !important;
  }

  .input-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
```

## 集成指南

### 1. 在新项目中使用

1. 安装依赖：`npm install @tdesign-vue-next/chat`
2. 导入组件：`import { ChatSender } from '@tdesign-vue-next/chat'`
3. 使用组件并配置相应的逻辑

### 2. 迁移现有实现

1. 替换 `TInput + TButton` 组合为 `ChatSender`
2. 更新样式选择器为 `.t-chat-sender`
3. 实现相应的发送和上传逻辑

### 3. 扩展功能

- **AI 集成**: 在 `handleSend` 中调用 AI API
- **文件上传**: 实现 `handleFileUpload` 上传逻辑
- **历史记录**: 集成消息存储和管理
- **实时通信**: 结合 WebSocket 实现实时聊天

## 相关文件

- **实现文件**: `src/views/MainView.vue`
- **样式文件**: 内联在 MainView.vue 中
- **类型定义**: TDesign 内置类型

## 参考资料

- [TDesign 官方文档](https://tdesign.tencent.com/)
- [@tdesign-vue-next/chat 组件文档](https://tdesign.tencent.com/chat/components/chat-sender)
- [Vue 3 官方文档](https://vuejs.org/)

## 更新日志

### v1.0.0 (2026-01-08)
- 初始实现 ChatSender 组件
- 集成发送消息逻辑
- 添加文件上传支持
- 实现响应式设计
- 完整的错误处理和用户反馈

---

*此文档将随着项目发展持续更新和完善。*
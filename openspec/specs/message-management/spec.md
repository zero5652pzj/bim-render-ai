# message-management Specification

## Purpose
TBD - created by archiving change delete-chat-history. Update Purpose after archive.
## Requirements
### Requirement: 单个消息删除

用户 **SHALL** 能够在聊天界面中删除单条消息。

#### Scenario: 删除按钮显示
- 给定 用户在聊天界面查看消息列表
- 当 用户 hover 在自己的消息气泡上
- 那么 显示删除按钮（14x14px 垃圾桶图标）

#### Scenario: 确认按钮显示（AI消息）
- 给定 用户在聊天界面查看 AI 回复
- 当 用户 hover 在 AI 消息气泡上
- 那么 显示删除按钮

#### Scenario: 立即删除消息
- 给定 删除按钮已显示
- 当 用户点击删除按钮
- 那么 消息立即从列表中移除，显示成功提示

#### Scenario: 删除动画效果
- 给定 消息显示在聊天列表中
- 当 执行删除操作
- 那么 消息以 300ms 淡出动画消失

#### Scenario: 删除失败处理
- 给定 执行消息删除
- 当 删除失败（如网络错误）
- 那么 显示错误提示，消息保留在列表中

### Requirement: 清空对话消息

用户 **SHALL** 能够清空当前对话中的所有消息。

#### Scenario: 清空消息入口
- 给定 用户在聊天界面查看消息
- 当 用户点击"清空消息"按钮
- 那么 显示确认对话框

#### Scenario: 确认清空
- 给定 显示确认对话框
- 当 用户点击"确认"按钮
- 那么 清空当前对话的所有消息

#### Scenario: 取消清空
- 给定 显示确认对话框
- 当 用户点击"取消"按钮
- 那么 对话框关闭，消息保留

#### Scenario: 清空后状态
- 给定 已清空对话消息
- 当 重新打开该对话
- 那么 消息列表为空，显示欢迎提示

### Requirement: MessageStore 增强

MessageStore **SHALL** 增强删除功能的方法。

#### Scenario: 删除单条消息
- 给定 消息 ID 有效且属于当前用户
- 当 调用 deleteMessage(messageId)
- 那么 返回 Promise.resolve(true)，消息被标记为已删除

- 给定 消息 ID 无效或权限不足
- 当 调用 deleteMessage(messageId)
- 那么 返回 Promise.resolve(false)

#### Scenario: 清空对话消息
- 给定 对话 ID 有效且属于当前用户
- 当 调用 clearConversationMessages(conversationId)
- 那么 返回 Promise.resolve(true)，所有消息被标记为已删除

#### Scenario: 加载状态管理
- 给定 执行消息删除
- 当 操作开始
- 那么 isDeletingMessage 设置为 true

- 给定 删除操作完成
- 当 操作结束（无论成功或失败）
- 那么 isDeletingMessage 设置为 false

#### Scenario: 乐观更新
- 给定 用户点击删除消息
- 当 操作开始
- 那么 消息立即从 UI 中移除

- 给定 乐观更新后操作失败
- 当 收到错误响应
- 那么 消息恢复到列表中

### Requirement: UI 交互与动画

消息删除的 UI 交互 **SHALL** 流畅自然。

#### Scenario: 按钮显示逻辑
- 给定 消息气泡渲染完成
- 当 消息显示在界面上
- 那么 删除按钮不显示

- 给定 用户鼠标悬停在消息上
- 当 hover 事件触发
- 那么 删除按钮以 200ms 淡入动画显示

#### Scenario: 删除动画
- 给定 用户点击删除按钮
- 当 删除操作开始
- 那么 消息执行动画序列：透明度从 1 变为 0（250ms），缩放从 1 变为 0.95（250ms）

#### Scenario: hover 效果
- 给定 删除按钮已显示
- 当 用户鼠标悬停在按钮上
- 那么 按钮背景变为浅红色

#### Scenario: 按钮状态
- 给定 执行删除操作
- 当 操作进行中
- 那么 按钮禁用并显示加载图标

### Requirement: 数据一致性

消息删除 **MUST** 保持数据一致性。

#### Scenario: 消息删除与对话统计
- 给定 对话包含 5 条消息
- 当 删除其中 2 条消息
- 那么 conversation.message_count 自动更新为 3

- 给定 对话的最后一条消息被删除
- 当 删除操作完成
- 那么 conversation.last_message_at 更新为倒数第二条消息的时间

#### Scenario: 触发器验证
- 给定 消息表有触发器 on_message_soft_deleted
- 当 消息 is_deleted 字段更新为 true
- 那么 触发器调用 recompute_conversation_stats 更新对话统计

#### Scenario: RLS 策略
- 给定 用户尝试删除不属于自己的消息
- 当 执行删除操作
- 那么 Supabase RLS 策略阻止操作，返回权限错误

### Requirement: 无障碍支持

消息删除功能 **SHALL** 支持无障碍访问。

#### Scenario: 键盘导航
- 给定 焦点在删除按钮上
- 当 用户按 Enter 键
- 那么 触发删除操作

- 给定 显示确认对话框
- 当 用户按 ESC 键
- 那么 对话框关闭

#### Scenario: 屏幕阅读器
- 给定 使用屏幕阅读器的用户
- 当 焦点在删除按钮上
- 那么 屏幕阅读器朗读"删除消息"

- 给定 消息删除完成
- 当 操作完成
- 那么 屏幕阅读器通知"消息已删除"

#### Scenario: 颜色对比
- 给定 删除按钮在浅色背景上
- 当 按钮显示
- 那么 颜色对比度至少 4.5:1

